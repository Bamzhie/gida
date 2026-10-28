"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

type PropertyGalleryProps = {
  images: { url: string; caption: string | null }[];
  title: string;
};

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex] ?? images[0];

  if (!activeImage) return null;

  return (
    <div>
      <div className="relative h-72 overflow-hidden bg-secondary sm:h-96">
        <Image
          src={activeImage.url}
          alt={activeImage.caption ?? title}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
          preload
        />
        {images.length > 1 && (
          <p aria-hidden="true" className="absolute bottom-3 right-3 rounded-full bg-background/85 px-3 py-1 text-xs font-medium text-foreground backdrop-blur-sm">
            {activeIndex + 1} / {images.length}
          </p>
        )}
      </div>
      {images.length > 1 && (
        <>
          <p aria-live="polite" className="sr-only">
            Photo {activeIndex + 1} of {images.length}
          </p>
          <div className="flex gap-2 overflow-x-auto border-t border-border p-3" role="group" aria-label="Property photos">
            {images.map((image, index) => (
              <button
                key={`${image.url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show photo ${index + 1} of ${images.length}`}
                aria-pressed={index === activeIndex}
                className={cn(
                  "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition-opacity",
                  index === activeIndex ? "border-primary" : "border-transparent opacity-70 hover:opacity-100"
                )}
              >
                <Image src={image.url} alt="" fill sizes="96px" className="object-cover" />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
