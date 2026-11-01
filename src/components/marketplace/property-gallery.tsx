"use client";
/* eslint-disable @next/next/no-img-element -- media urls point at the API origin (e.g. /media/...) or arbitrary external hosts, neither of which next/image can be configured for. */

import { useState } from "react";
import { FileText, Film } from "lucide-react";
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
  /** API origin used to resolve backend-relative media urls; passed from the server. */
  mediaOrigin?: string;
};

const KIND_LABELS: Record<MediaKind, string> = {
  PHOTO: "Photo",
  VIDEO: "Video",
  FLOOR_PLAN: "Floor plan",
};

function isPdf(url: string): boolean {
  return url.toLowerCase().endsWith(".pdf");
}

export function PropertyGallery({ media, title, mediaOrigin }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = media[activeIndex] ?? media[0];
  const activeUrl = active ? resolveMediaUrl(mediaOrigin, active.url) : "";

  if (!active) return null;

  return (
    <div>
      <div className="relative h-72 overflow-hidden bg-secondary sm:h-96">
        {active.kind === "VIDEO" ? (
          <video
            key={activeUrl}
            src={activeUrl}
            controls
            preload="metadata"
            aria-label={active.caption ?? `Video tour of ${title}`}
            className="h-full w-full bg-black object-contain"
          />
        ) : active.kind === "FLOOR_PLAN" && isPdf(active.url) ? (
          <a
            href={activeUrl}
            target="_blank"
            rel="noreferrer"
            className="flex h-full w-full flex-col items-center justify-center gap-3 text-center text-muted-foreground hover:text-foreground"
          >
            <FileText className="h-12 w-12" aria-hidden="true" />
            <span className="text-sm font-medium">Open the floor plan (PDF)</span>
          </a>
        ) : (
          <img
            src={activeUrl}
            alt={active.caption ?? title}
            className="h-full w-full object-cover"
          />
        )}
        <p className="absolute left-3 top-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
          {KIND_LABELS[active.kind]}
        </p>
        {media.length > 1 && (
          <p aria-hidden="true" className="absolute bottom-3 right-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            {activeIndex + 1} / {media.length}
          </p>
        )}
      </div>
      {media.length > 1 && (
        <>
          <p aria-live="polite" className="sr-only">
            {KIND_LABELS[active.kind]} {activeIndex + 1} of {media.length}
          </p>
          <div className="flex gap-2 overflow-x-auto border-t border-border p-3" role="group" aria-label="Property media">
            {media.map((item, index) => (
              <button
                key={`${item.url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show ${KIND_LABELS[item.kind].toLowerCase()} ${index + 1} of ${media.length}`}
                aria-pressed={index === activeIndex}
                className={cn(
                  "relative flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border-2 bg-background text-muted-foreground transition-opacity",
                  index === activeIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                {item.kind === "VIDEO" ? (
                  <span className="flex flex-col items-center gap-0.5">
                    <Film className="h-5 w-5" aria-hidden="true" />
                    <span className="text-[10px] font-medium">Video</span>
                  </span>
                ) : item.kind === "FLOOR_PLAN" && isPdf(item.url) ? (
                  <span className="flex flex-col items-center gap-0.5">
                    <FileText className="h-5 w-5" aria-hidden="true" />
                    <span className="text-[10px] font-medium">Plan</span>
                  </span>
                ) : item.kind === "FLOOR_PLAN" ? (
                  <span className="relative h-full w-full">
                    <img src={resolveMediaUrl(mediaOrigin, item.url)} alt="" className="h-full w-full object-cover" />
                    <span className="absolute bottom-0 left-0 right-0 bg-background/85 text-center text-[10px] font-medium">Plan</span>
                  </span>
                ) : (
                  <img src={resolveMediaUrl(mediaOrigin, item.url)} alt="" className="h-full w-full object-cover" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
      <p className="sr-only">
        Media alternates between photos, video tours and floor plans as labelled.
      </p>
    </div>
  );
}
