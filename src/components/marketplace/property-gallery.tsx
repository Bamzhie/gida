"use client";
/* eslint-disable @next/next/no-img-element -- media urls can point at the API origin or arbitrary advertiser hosts. */

import { useState } from "react";
import { Camera, FileText, Film } from "lucide-react";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { MediaKind } from "@/lib/api-types";
import { resolveMediaUrl } from "@/lib/media";
import { cn } from "@/lib/utils";

type GalleryMedia = {
  url: string;
  caption: string | null;
  kind: MediaKind;
};

type PropertyGalleryProps = {
  media: GalleryMedia[];
  title: string;
  mediaOrigin?: string;
};

function isPdf(url: string): boolean {
  return url.toLowerCase().endsWith(".pdf");
}

export function PropertyGallery({ media, title, mediaOrigin }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const photos = media.filter((item) => item.kind === "PHOTO").length;
  const videos = media.filter((item) => item.kind === "VIDEO").length;
  const lightboxImages = media
    .filter((item) => item.kind === "PHOTO" || (item.kind === "FLOOR_PLAN" && !isPdf(item.url)))
    .map((item, index) => ({
      src: resolveMediaUrl(mediaOrigin, item.url),
      alt: item.caption ?? `${title}, image ${index + 1}`,
    }));
  const visibleIndexes = media.length <= 3
    ? media.map((_, index) => index)
    : [0, 1, 2].map((offset) => (activeIndex + offset) % media.length);

  function mediaPreview(item: GalleryMedia, index: number, primary: boolean) {
    const url = resolveMediaUrl(mediaOrigin, item.url);
    if (item.kind === "VIDEO") {
      return primary ? (
        <video
          key={url}
          src={url}
          controls
          preload="metadata"
          aria-label={item.caption ?? `Video tour of ${title}`}
          className="absolute inset-0 h-full w-full bg-black object-contain"
        />
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary text-foreground">
          <Film className="size-8" aria-hidden="true" />
          <span className="text-sm font-medium">Video tour</span>
        </span>
      );
    }
    if (item.kind === "FLOOR_PLAN" && isPdf(item.url)) {
      const preview = (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-secondary text-foreground">
          <FileText className="size-8" aria-hidden="true" />
          <span className="text-sm font-medium">Floor plan PDF</span>
        </span>
      );
      return primary ? <a href={url} target="_blank" rel="noreferrer" aria-label="Open floor plan PDF in a new tab">{preview}</a> : preview;
    }
    const alt = item.caption ?? `${title}, image ${index + 1}`;
    if (!primary) {
      return <img src={url} alt={alt} className="absolute inset-0 h-full w-full object-cover" />;
    }
    return (
      <ImageLightbox
        src={url}
        alt={alt}
        images={lightboxImages}
        index={Math.max(0, lightboxImages.findIndex((image) => image.src === url))}
        buttonClassName="absolute inset-0 h-full w-full"
        imageClassName="absolute inset-0 h-full w-full object-cover"
      />
    );
  }

  if (media.length === 0) return null;

  return (
    <div className="overflow-hidden rounded-xl">
      <div className={cn(
        "grid gap-2 sm:h-[min(62vw,30rem)] sm:max-h-[30rem]",
        visibleIndexes.length > 1 ? "sm:grid-cols-[1.8fr_1fr] sm:grid-rows-2" : "sm:grid-cols-1"
      )}>
        {visibleIndexes.map((index, position) => {
          const item = media[index];
          const isPrimary = position === 0;
          const tileClass = cn(
            "relative isolate block min-h-52 overflow-hidden bg-secondary text-left",
            isPrimary ? "sm:row-span-2 sm:min-h-0" : "hidden sm:block sm:min-h-0"
          );
          const countBadge = isPrimary && (photos > 0 || videos > 0) && (
            <span className="absolute bottom-3 right-3 inline-flex items-center gap-2 rounded-md bg-background/95 px-3 py-1.5 text-xs font-semibold text-foreground shadow-sm">
              {photos > 0 && <span className="inline-flex items-center gap-1"><Camera className="size-3.5" />{media.slice(0, activeIndex + 1).filter((entry) => entry.kind === "PHOTO").length || 1}/{photos}</span>}
              {videos > 0 && <span className="inline-flex items-center gap-1"><Film className="size-3.5" />{videos}</span>}
            </span>
          );

          return isPrimary ? (
            <div key={`${item.url}-${index}`} className={tileClass}>
              {mediaPreview(item, index, true)}
              {countBadge}
            </div>
          ) : (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${item.kind === "PHOTO" ? "photo" : item.kind === "VIDEO" ? "video" : "floor plan"} ${index + 1}`}
              className={cn(tileClass, "group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring")}
            >
              {mediaPreview(item, index, false)}
              {visibleIndexes.length === 3 && position === 2 && media.length > 3 && (
                <span className="absolute inset-0 flex items-center justify-center bg-foreground/45 text-lg font-semibold text-background transition-colors group-hover:bg-foreground/55">
                  +{media.length - 3} more
                </span>
              )}
            </button>
          );
        })}
      </div>

      {media.length > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1" role="group" aria-label="Property photos, videos and floor plans">
          {media.map((item, index) => (
            <button
              key={`${item.url}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Show ${item.kind.toLowerCase().replace("_", " ")} ${index + 1} of ${media.length}`}
              aria-pressed={index === activeIndex}
              className={cn(
                "relative size-[4.25rem] shrink-0 overflow-hidden rounded-md border-2 bg-secondary",
                index === activeIndex ? "border-primary" : "border-transparent opacity-75 hover:opacity-100"
              )}
            >
              {item.kind === "PHOTO" || (item.kind === "FLOOR_PLAN" && !isPdf(item.url)) ? (
                <img src={resolveMediaUrl(mediaOrigin, item.url)} alt="" className="absolute inset-0 h-full w-full object-cover" />
              ) : (
                <span className="absolute inset-0 grid place-items-center text-muted-foreground">
                  {item.kind === "VIDEO" ? <Film className="size-5" /> : <FileText className="size-5" />}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
      <p className="sr-only" aria-live="polite">Showing item {activeIndex + 1} of {media.length}</p>
    </div>
  );
}
