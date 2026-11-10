"use client";

import { useRef, useState, type ChangeEvent, type DragEvent as ReactDragEvent } from "react";
import { FileText, Map, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ImageLightbox } from "@/components/ui/image-lightbox";
import type { ManagedMediaDto, MediaKind } from "@/lib/api-types";
import { listingProblemMessage } from "@/lib/listing-problems";
import { resolveMediaUrl } from "@/lib/media";

/** Mirrors the API whitelist: PHOTO jpeg/png/webp, VIDEO mp4, FLOOR_PLAN pdf/png/jpeg. */
const ACCEPT_MEDIA = "image/jpeg,image/png,image/webp,video/mp4,application/pdf,.jpg,.jpeg,.png,.webp,.mp4,.pdf";

const KIND_LABEL: Record<MediaKind, string> = {
  PHOTO: "Photo",
  VIDEO: "Video",
  FLOOR_PLAN: "Floor plan",
};

function uploadFile(
  listingId: string,
  file: File,
  kind: MediaKind,
  onProgress: (percent: number) => void
): Promise<ManagedMediaDto> {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("file", file);
    form.append("kind", kind);
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `/api/dashboard/listings/${listingId}/media`);
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          resolve(JSON.parse(xhr.responseText) as ManagedMediaDto);
        } catch {
          reject(new Error("bad_response"));
        }
        return;
      }
      let problem = null;
      try {
        problem = JSON.parse(xhr.responseText);
      } catch {
        // Non-JSON failure bodies fall through to the generic message.
      }
      reject(new Error(listingProblemMessage(problem)));
    };
    xhr.onerror = () => reject(new Error("The upload could not reach the server. Try again."));
    xhr.send(form);
  });
}

type MediaManagerProps = {
  listingId: string;
  mediaOrigin: string;
  initialMedia: ManagedMediaDto[];
};

/**
 * Media manager for listings that are not yet approved. Existing entries are
 * loaded through the owner-scoped media endpoint so they can be removed or
 * reordered across visits.
 */
export function ListingMediaManager({ listingId, mediaOrigin, initialMedia }: MediaManagerProps) {
  const [media, setMedia] = useState<ManagedMediaDto[]>(initialMedia);
  const [progress, setProgress] = useState<number | null>(null);
  const [reordering, setReordering] = useState(false);
  const [draggedMediaId, setDraggedMediaId] = useState<string | null>(null);
  const [dragOverMediaId, setDragOverMediaId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const imageCount = media.filter((item) => item.kind !== "VIDEO").length;
  const videoCount = media.filter((item) => item.kind === "VIDEO").length;
  const imageMedia = media.filter((item) =>
    item.kind === "PHOTO" || (item.kind === "FLOOR_PLAN" && !item.url.toLowerCase().endsWith(".pdf"))
  );
  const lightboxImages = imageMedia.map((item, index) => ({
    src: resolveMediaUrl(mediaOrigin, item.url),
    alt: item.caption ?? `${KIND_LABEL[item.kind]} ${index + 1}`,
  }));

  async function uploadSelected(file: File, kind: MediaKind) {
    setProgress(0);
    try {
      const uploaded = await uploadFile(listingId, file, kind, setProgress);
      setMedia((current) => [...current, uploaded]);
      toast.success("File uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The upload failed. Try again.");
    } finally {
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    const kind: MediaKind | null = file.type === "application/pdf" || extension === "pdf"
      ? "FLOOR_PLAN"
      : file.type === "video/mp4" || extension === "mp4"
        ? "VIDEO"
        : ["image/jpeg", "image/png", "image/webp"].includes(file.type)
          || ["jpg", "jpeg", "png", "webp"].includes(extension ?? "")
          ? "PHOTO"
          : null;
    if (!kind) {
      toast.error("Choose a JPG, PNG, WebP, MP4 or PDF file.");
      event.currentTarget.value = "";
      return;
    }
    const count = kind === "VIDEO" ? videoCount : imageCount;
    const limit = kind === "VIDEO" ? 2 : 10;
    if (count >= limit) {
      toast.error(kind === "VIDEO" ? "You can add up to 2 videos." : "You can add up to 10 photos or floor plans.");
      event.currentTarget.value = "";
      return;
    }
    void uploadSelected(file, kind);
  }

  function chooseFile() {
    if (reordering) return;
    inputRef.current?.click();
  }

  async function reorder(sourceId: string, targetId: string) {
    if (sourceId === targetId || reordering || progress !== null) return;
    const previous = media;
    const next = [...media];
    const sourceIndex = next.findIndex((item) => item.id === sourceId);
    const targetIndex = next.findIndex((item) => item.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;
    const [dragged] = next.splice(sourceIndex, 1);
    next.splice(targetIndex, 0, dragged);
    setMedia(next.map((item, order) => ({ ...item, sortOrder: order })));
    setReordering(true);
    try {
      const response = await fetch(`/api/dashboard/listings/${listingId}/media/order`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(next.map((item, order) => ({ id: item.id, sortOrder: order }))),
      });
      if (!response.ok) {
        setMedia(previous);
        toast.error(listingProblemMessage(await response.json().catch(() => null)));
        return;
      }
      const ordered = (await response.json()) as ManagedMediaDto[];
      setMedia(ordered);
    } catch {
      setMedia(previous);
      toast.error("The new media order could not be saved. Try again.");
    } finally {
      setReordering(false);
    }
  }

  async function remove(id: string) {
    const previous = media;
    setMedia((current) => current.filter((item) => item.id !== id));
    const response = await fetch(`/api/dashboard/listings/${listingId}/media/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      setMedia(previous);
      toast.error(listingProblemMessage(await response.json().catch(() => null)));
      return;
    }
    toast.success("File removed.");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-heading text-lg font-semibold">Photos, video and floor plans</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Add up to 10 photos or floor plans and 2 videos. Photos: JPG, PNG or WebP up to 10&nbsp;MB;
          videos: MP4 up to 100&nbsp;MB; PDF floor plans up to 10&nbsp;MB.
        </p>
      </div>
      <div className="flex justify-end">
        <p className="text-sm text-muted-foreground">Photos and floor plans: {imageCount}/10 · Videos: {videoCount}/2</p>
      </div>
      <input
        ref={inputRef}
        id="media-file"
        type="file"
        accept={ACCEPT_MEDIA}
        className="sr-only"
        aria-label="Choose a photo, video or floor plan"
        onChange={handleFileChange}
      />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {media.map((item, index) => (
          <li
            key={item.id}
            draggable={!reordering && progress === null}
            onDragStart={(event: ReactDragEvent<HTMLLIElement>) => {
              event.dataTransfer.effectAllowed = "move";
              event.dataTransfer.setData("text/plain", item.id);
              setDraggedMediaId(item.id);
            }}
            onDragOver={(event: ReactDragEvent<HTMLLIElement>) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDragOverMediaId(item.id);
            }}
            onDrop={(event: ReactDragEvent<HTMLLIElement>) => {
              event.preventDefault();
              const sourceId = event.dataTransfer.getData("text/plain") || draggedMediaId;
              if (sourceId) void reorder(sourceId, item.id);
              setDraggedMediaId(null);
              setDragOverMediaId(null);
            }}
            onDragEnd={() => {
              setDraggedMediaId(null);
              setDragOverMediaId(null);
            }}
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return;
              const targetIndex = event.key === "ArrowUp" ? index - 1 : event.key === "ArrowDown" ? index + 1 : -1;
              const target = media[targetIndex];
              if (!target) return;
              event.preventDefault();
              void reorder(item.id, target.id);
            }}
            tabIndex={0}
            aria-label={`Media ${index + 1}, ${KIND_LABEL[item.kind]}. Drag to reorder.`}
            className={`group relative aspect-square overflow-hidden rounded-2xl border border-border bg-secondary ${
              dragOverMediaId === item.id ? "ring-2 ring-primary ring-offset-2" : ""
            } ${reordering ? "cursor-wait" : "cursor-grab active:cursor-grabbing"}`}
          >
            {item.kind === "VIDEO" ? (
              <video
                src={resolveMediaUrl(mediaOrigin, item.url)}
                className="h-full w-full object-cover"
                controls
                preload="metadata"
                aria-label={`Video ${index + 1}`}
              />
            ) : item.kind === "FLOOR_PLAN" && item.url.toLowerCase().endsWith(".pdf") ? (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <FileText className="size-8" aria-hidden="true" />
                <span className="text-sm">Floor plan PDF</span>
              </div>
            ) : (
              <ImageLightbox
                src={resolveMediaUrl(mediaOrigin, item.url)}
                alt={item.caption ?? `${KIND_LABEL[item.kind]} ${index + 1}`}
                images={lightboxImages}
                index={Math.max(0, imageMedia.findIndex((image) => image.id === item.id))}
                buttonClassName="absolute inset-0 h-full w-full"
                imageClassName="h-full w-full object-cover"
              />
            )}
            <div className="absolute inset-x-2 top-2 flex items-start justify-between gap-2">
              <Badge variant="secondary" className="max-w-24 truncate">{KIND_LABEL[item.kind]}</Badge>
              <div className="flex items-center gap-1 rounded-full bg-background/90 p-1 shadow-sm">
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => remove(item.id)}
                  disabled={progress !== null || reordering}
                  aria-label={`Remove media ${index + 1}`}
                ><Trash2 /></Button>
              </div>
            </div>
          </li>
        ))}
        <li className="aspect-square">
          <button
            type="button"
            onClick={chooseFile}
            disabled={progress !== null || reordering}
            aria-label="Add media"
            className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border bg-secondary/30 text-muted-foreground transition-colors hover:bg-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {progress !== null ? (
              <span className="text-sm font-medium">Uploading {progress}%</span>
            ) : (
              <>
                <Plus className="size-8" aria-hidden="true" />
                <span className="text-sm font-medium">Add media</span>
              </>
            )}
          </button>
        </li>
      </ul>
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Map className="h-3.5 w-3.5" aria-hidden="true" />
        The first photo becomes the listing&apos;s cover.
      </p>
    </div>
  );
}
