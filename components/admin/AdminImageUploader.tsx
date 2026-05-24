"use client";

import { useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { safeExt, safeSlug } from "@/lib/storagePath";
import { uploadCompetitionImageVariants, type CompetitionImageVariantSet } from "@/lib/competitionImages";

const BUCKET = "competition-images";
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

type UploadedFile = {
  url: string;
  path: string;
  name: string;
  size: number;
};

type Props = {
  folder?: string;
  multiple?: boolean;
  hint?: string;
  onUploaded: (files: UploadedFile[]) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  className?: string;
  compact?: boolean;
  competitionImage?: {
    competitionId?: string | null;
    slug?: string | null;
    onGenerated: (variants: CompetitionImageVariantSet) => void;
  };
};

function friendlyError(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) return String((error as { message?: unknown }).message || "");
  return "Upload failed.";
}

export function AdminImageUploader({
  folder = "competitions/general",
  multiple = true,
  hint,
  onUploaded,
  onError,
  onSuccess,
  className,
  compact,
  competitionImage,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(fileList: FileList | File[]) {
    const supabase = createSupabaseBrowserClient();
    if (!supabase) {
      onError?.("Supabase client is not configured.");
      return;
    }
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setBusy(true);
    setProgress({ done: 0, total: files.length });
    const uploaded: UploadedFile[] = [];
    let failed = 0;
    let policyBlocked = false;
    const cleanFolder = (folder || "competitions/general").replace(/^\/+|\/+$/g, "") || "competitions/general";

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        if (!ALLOWED.includes(file.type)) {
          onError?.(`${file.name}: unsupported type`);
          failed++;
          continue;
        }
        if (file.size > MAX_BYTES) {
          onError?.(`${file.name}: too large (max 8 MB)`);
          failed++;
          continue;
        }
        if (competitionImage) {
          const variants = await uploadCompetitionImageVariants(file, {
            competitionId: competitionImage.competitionId,
            slug: competitionImage.slug,
            sourceName: file.name,
          });
          competitionImage.onGenerated(variants);
          uploaded.push({ url: variants.image_original_url, path: variants.image_original_url, name: file.name, size: file.size });
          continue;
        }
        const baseName = safeSlug(file.name.replace(/\.[^.]+$/, "")) || "image";
        const path = `${cleanFolder}/${Date.now()}-${crypto.randomUUID().slice(0, 8)}-${baseName}.${safeExt(file.name, file.type)}`;
        const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: "3600",
          contentType: file.type,
          upsert: false,
        });
        if (error) {
          const msg = (error.message || "").toLowerCase();
          if (msg.includes("row-level") || msg.includes("rls") || msg.includes("permission") || msg.includes("policy")) {
            policyBlocked = true;
          }
          throw error;
        }
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
        uploaded.push({ url: data.publicUrl, path, name: file.name, size: file.size });
      } catch (error) {
        failed++;
        onError?.(`${file.name}: ${friendlyError(error)}`);
      } finally {
        setProgress({ done: i + 1, total: files.length });
      }
    }

    setBusy(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
    if (uploaded.length) {
      onUploaded(uploaded);
      onSuccess?.(competitionImage ? "Image variants generated." : `Uploaded ${uploaded.length} of ${files.length}.`);
    }
    if (policyBlocked) {
      onError?.("Storage policy blocked upload. Check admin storage RLS for competition-images.");
    }
    if (!uploaded.length && !failed) {
      onError?.("No files were uploaded.");
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <div
        onClick={() => !busy && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (busy) return;
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "admin-dropzone relative flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed text-sm transition",
          dragOver && "admin-dropzone-active",
          busy && "cursor-wait opacity-70",
          compact ? "p-4" : "p-8",
        )}
      >
        {busy ? <Loader2 className="h-5 w-5 animate-spin text-primary" /> : <Upload className="h-5 w-5 text-primary" />}
        <div className="font-medium admin-value">
          {busy ? `Uploading ${progress?.done ?? 0} / ${progress?.total ?? 0}...` : multiple ? "Click or drop images" : "Click or drop an image"}
        </div>
        <div className="text-xs admin-muted">{hint || "JPG, PNG, WebP, AVIF - max 8 MB each"}</div>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={busy}>
        {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
        {multiple ? "Choose files" : "Choose file"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        multiple={multiple}
        accept="image/jpeg,image/png,image/webp,image/avif"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) handleFiles(e.target.files);
        }}
      />
    </div>
  );
}
