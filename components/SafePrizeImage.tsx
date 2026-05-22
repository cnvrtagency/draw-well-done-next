import { cn } from "@/lib/utils";

export function SafePrizeImage({
  url,
  alt,
  aspect = "aspect-square",
  imgClassName,
  priority,
  width = 640,
  height = 640,
}: {
  url: string | null | undefined;
  alt: string;
  aspect?: string;
  imgClassName?: string;
  priority?: boolean;
  width?: number;
  height?: number;
  thumb?: boolean;
}) {
  return (
    <div className={cn("relative overflow-hidden bg-white/[0.04]", aspect)}>
      <img
        src={url || "/placeholder.svg"}
        alt={alt}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async"
        className={cn("absolute inset-0 h-full w-full object-cover animate-fade-in-img", imgClassName)}
      />
    </div>
  );
}
