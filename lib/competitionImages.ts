import { createSupabaseBrowserClient } from "@/lib/supabase";
import { safeExt, safeSlug } from "@/lib/storagePath";

const BUCKET = "competition-images";

export type CompetitionImageVariantSet = {
  image_original_url: string;
  image_card_url: string;
  image_detail_url: string;
  image_thumb_url: string;
};

type CompetitionImageLike = {
  main_image_url?: string | null;
  image_original_url?: string | null;
  image_card_url?: string | null;
  image_detail_url?: string | null;
  image_thumb_url?: string | null;
};

type GenerateOptions = {
  competitionId?: string | null;
  slug?: string | null;
  sourceName?: string | null;
};

const VARIANTS = {
  card: { size: 640, quality: 0.8 },
  detail: { size: 1200, quality: 0.84 },
  thumb: { size: 320, quality: 0.78 },
} as const;

export function competitionCardImageUrl(c: CompetitionImageLike): string | null {
  return c.image_card_url || c.main_image_url || c.image_original_url || null;
}

export function competitionDetailImageUrl(c: CompetitionImageLike): string | null {
  return c.image_detail_url || c.main_image_url || c.image_original_url || c.image_card_url || null;
}

export function competitionThumbImageUrl(c: CompetitionImageLike): string | null {
  return c.image_thumb_url || c.image_card_url || c.main_image_url || c.image_original_url || null;
}

function baseFolder(options: GenerateOptions) {
  const key = safeSlug(options.competitionId || options.slug || "new-competition") || "new-competition";
  return `competitions/${key}`;
}

function baseName(options: GenerateOptions) {
  const raw = (options.sourceName || options.slug || "competition-image").replace(/\.[^.]+$/, "");
  return safeSlug(raw) || "competition-image";
}

async function blobToImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
}

async function makeSquareWebp(blob: Blob, size: number, quality: number): Promise<Blob> {
  const img = await blobToImage(blob);
  try {
    const sourceSize = Math.min(img.naturalWidth, img.naturalHeight);
    if (!sourceSize || sourceSize <= 0) throw new Error("Image could not be decoded.");
    const sx = Math.max(0, Math.floor((img.naturalWidth - sourceSize) / 2));
    const sy = Math.max(0, Math.floor((img.naturalHeight - sourceSize) / 2));
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) throw new Error("Image processing is not available in this browser.");
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((out) => {
        if (out) resolve(out);
        else reject(new Error("Could not generate WebP image variant."));
      }, "image/webp", quality);
    });
  } finally {
    URL.revokeObjectURL(img.src);
  }
}

async function uploadBlob(path: string, blob: Blob, contentType: string) {
  const supabase = createSupabaseBrowserClient();
  if (!supabase) throw new Error("Supabase client is not configured.");
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    cacheControl: "31536000",
    contentType,
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadVariants(source: Blob, options: GenerateOptions, originalUrl: string): Promise<CompetitionImageVariantSet> {
  const stamp = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${baseName(options)}`;
  const folder = baseFolder(options);
  const [cardBlob, detailBlob, thumbBlob] = await Promise.all([
    makeSquareWebp(source, VARIANTS.card.size, VARIANTS.card.quality),
    makeSquareWebp(source, VARIANTS.detail.size, VARIANTS.detail.quality),
    makeSquareWebp(source, VARIANTS.thumb.size, VARIANTS.thumb.quality),
  ]);

  const [image_card_url, image_detail_url, image_thumb_url] = await Promise.all([
    uploadBlob(`${folder}/card/${stamp}-640.webp`, cardBlob, "image/webp"),
    uploadBlob(`${folder}/detail/${stamp}-1200.webp`, detailBlob, "image/webp"),
    uploadBlob(`${folder}/thumb/${stamp}-320.webp`, thumbBlob, "image/webp"),
  ]);

  return {
    image_original_url: originalUrl,
    image_card_url,
    image_detail_url,
    image_thumb_url,
  };
}

export async function uploadCompetitionImageVariants(file: File, options: GenerateOptions): Promise<CompetitionImageVariantSet> {
  const stamp = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${baseName({ ...options, sourceName: file.name })}`;
  const folder = baseFolder(options);
  const ext = safeExt(file.name, file.type);
  const originalUrl = await uploadBlob(`${folder}/original/${stamp}.${ext}`, file, file.type || "application/octet-stream");
  return uploadVariants(file, { ...options, sourceName: file.name }, originalUrl);
}

export async function regenerateCompetitionImageVariants(sourceUrl: string, options: GenerateOptions): Promise<CompetitionImageVariantSet> {
  const response = await fetch(sourceUrl, { mode: "cors" });
  if (!response.ok) {
    throw new Error(`Could not fetch the source image (${response.status}).`);
  }
  const blob = await response.blob();
  if (!blob.type.startsWith("image/")) {
    throw new Error("The source URL did not return an image.");
  }
  return uploadVariants(blob, options, sourceUrl);
}
