"use client";

import { useRef, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, Maximize, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type LightboxImage = { src: string; alt: string };

type ImageLightboxProps = {
  src: string;
  alt: string;
  images?: LightboxImage[];
  index?: number;
  buttonClassName?: string;
  imageClassName?: string;
};

export function ImageLightbox({ src, alt, images, index = 0, buttonClassName, imageClassName }: ImageLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const touchStartX = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(index);
  const imageStack = images?.length ? images : [{ src, alt }];
  const activeImage = imageStack[activeIndex] ?? imageStack[0];

  function showImage(nextIndex: number) {
    const wrappedIndex = (nextIndex + imageStack.length) % imageStack.length;
    setActiveIndex(wrappedIndex);
  }

  function open() {
    setActiveIndex(index);
    dialogRef.current?.showModal();
  }

  function closeOnBackdrop(event: MouseEvent<HTMLDivElement>) {
    if (event.target === event.currentTarget) dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        draggable={false}
        onDragStart={(event) => event.preventDefault()}
        onClick={open}
        aria-label={`View full image: ${alt}`}
        className={cn(
          "group relative block cursor-zoom-in overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          buttonClassName
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- media can be served from the API origin. */}
        <img src={src} alt={alt} className={cn("block object-cover", imageClassName)} />
        <span className="absolute bottom-2 right-2 rounded-full bg-background/90 p-2 text-foreground opacity-90 shadow-sm transition-opacity md:opacity-0 md:group-hover:opacity-100 md:group-focus-visible:opacity-100">
          <Maximize className="size-4" aria-hidden="true" />
        </span>
      </button>
      <dialog
        ref={dialogRef}
        aria-label={`Image preview: ${alt}`}
        className="fixed inset-0 m-auto h-[96dvh] max-h-[96dvh] w-[96vw] max-w-none overflow-visible border-0 bg-transparent p-0 text-foreground backdrop:bg-black/90"
        onKeyDown={(event) => {
          if (imageStack.length < 2) return;
          if (event.key === "ArrowRight") {
            event.preventDefault();
            showImage(activeIndex + 1);
          } else if (event.key === "ArrowLeft") {
            event.preventDefault();
            showImage(activeIndex - 1);
          }
        }}
      >
        <div className="relative flex h-full w-full items-center justify-center" onClick={closeOnBackdrop}>
          <button
            type="button"
            autoFocus
            onClick={() => dialogRef.current?.close()}
            aria-label="Close image preview"
            className="absolute right-2 top-2 z-10 inline-flex size-11 items-center justify-center rounded-full bg-background/95 text-foreground shadow-lg hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:right-4 sm:top-4"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
          {imageStack.length > 1 && (
            <>
              <button
                type="button"
                onClick={() => showImage(activeIndex - 1)}
                aria-label="Show previous image"
                className="absolute left-2 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/95 text-foreground shadow-lg hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:left-4"
              >
                <ChevronLeft className="size-6" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => showImage(activeIndex + 1)}
                aria-label="Show next image"
                className="absolute right-2 top-1/2 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/95 text-foreground shadow-lg hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:right-4"
              >
                <ChevronRight className="size-6" aria-hidden="true" />
              </button>
              <span className="absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-background/90 px-3 py-1 text-sm font-medium text-foreground">
                {activeIndex + 1} / {imageStack.length}
              </span>
            </>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element -- media can be served from the API origin. */}
          <img
            src={activeImage.src}
            alt={activeImage.alt}
            onTouchStart={(event) => {
              touchStartX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              const start = touchStartX.current;
              touchStartX.current = null;
              if (start === null || imageStack.length < 2) return;
              const end = event.changedTouches[0]?.clientX;
              if (end === undefined) return;
              const delta = end - start;
              if (Math.abs(delta) < 48) return;
              showImage(activeIndex + (delta < 0 ? 1 : -1));
            }}
            className="max-h-[92dvh] max-w-[96vw] touch-pan-y object-contain"
          />
        </div>
      </dialog>
    </>
  );
}
