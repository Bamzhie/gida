"use client";

import { useRef, useState } from "react";
import { ArrowDown, ArrowUp, FileText, Film, ImagePlus, Map, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ManagedMediaDto, MediaKind } from "@/lib/api-types";
import { listingProblemMessage } from "@/lib/listing-problems";
import { resolveMediaUrl } from "@/lib/media";

const KIND_OPTIONS: { value: MediaKind; label: string }[] = [
  { value: "PHOTO", label: "Photo" },
  { value: "VIDEO", label: "Video" },
  { value: "FLOOR_PLAN", label: "Floor plan" },
];

/** Mirrors the API whitelist: PHOTO jpeg/png/webp, VIDEO mp4, FLOOR_PLAN pdf/png/jpeg. */
const ACCEPT_BY_KIND: Record<MediaKind, string> = {
  PHOTO: "image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp",
  VIDEO: "video/mp4,.mp4",
  FLOOR_PLAN: "application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg",
};

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
 * Media manager for draft listings. The API only accepts media changes while
 * a listing is a draft, so this is rendered on the edit page for drafts only.
 * Uploaded entries arrive with ids, so delete and reorder work within this
 * session; media saved on an earlier visit cannot be listed again until the
 * API exposes owner draft media.
 */
export function ListingMediaManager({ listingId, mediaOrigin, initialMedia }: MediaManagerProps) {
  const [media, setMedia] = useState<ManagedMediaDto[]>(initialMedia);
  const [kind, setKind] = useState<MediaKind>("PHOTO");
  const [progress, setProgress] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      toast.error("Choose a file to upload first.");
      return;
    }
    setProgress(0);
    try {
      const uploaded = await uploadFile(listingId, file, kind, setProgress);
      setMedia((current) => [...current, uploaded]);
      if (inputRef.current) inputRef.current.value = "";
      toast.success("File uploaded.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "The upload failed. Try again.");
    } finally {
      setProgress(null);
    }
  }

  async function move(index: number, delta: -1 | 1) {
    const target = index + delta;
    if (target < 0 || target >= media.length) return;
    const previous = media;
    const next = [...media];
    [next[index], next[target]] = [next[target], next[index]];
    setMedia(next.map((item, order) => ({ ...item, sortOrder: order })));
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
          Up to 20 files. Photos: JPG, PNG or WebP up to 10&nbsp;MB. Video: MP4 up to 100&nbsp;MB.
          Floor plans: PDF, PNG or JPG up to 10&nbsp;MB. Files can only change while the listing is
          a draft.
        </p>
      </div>
      <div className="grid gap-3 rounded-2xl border border-border bg-secondary/30 p-4 sm:grid-cols-[1fr_auto_auto] sm:items-end">
        <div className="space-y-2">
          <Label htmlFor="media-file">File</Label>
          <input
            ref={inputRef}
            id="media-file"
            type="file"
            accept={ACCEPT_BY_KIND[kind]}
            className="flex h-10 w-full cursor-pointer rounded-xl border border-input bg-background px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="media-kind">Shows</Label>
          <Select value={kind} onValueChange={(value) => setKind(value as MediaKind)}>
            <SelectTrigger id="media-kind" className="w-full sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KIND_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="button" onClick={handleUpload} disabled={progress !== null} className="rounded-xl">
          <ImagePlus /> Upload
        </Button>
      </div>
      {progress !== null && (
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Upload progress"
          className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        >
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
        </div>
      )}
      {media.length === 0 ? (
        <p className="text-sm text-muted-foreground">No files uploaded in this session yet.</p>
      ) : (
        <ul className="space-y-2">
          {media.map((item, index) => (
            <li
              key={item.id}
              className="flex flex-wrap items-center gap-3 rounded-2xl border border-border p-3"
            >
              <span className="relative flex h-14 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary text-muted-foreground">
                {item.kind === "VIDEO" ? (
                  <Film className="h-6 w-6" aria-hidden="true" />
                ) : item.kind === "FLOOR_PLAN" && item.url.toLowerCase().endsWith(".pdf") ? (
                  <FileText className="h-6 w-6" aria-hidden="true" />
                ) : (
                  /* Backend-served media lives on another origin; next/image cannot be configured for it. */
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={resolveMediaUrl(mediaOrigin, item.url)}
                    alt={item.caption ?? `Media ${index + 1}`}
                    className="h-full w-full object-cover"
                  />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <Badge variant={item.kind === "PHOTO" ? "secondary" : "outline"}>
                  {KIND_LABEL[item.kind]}
                </Badge>
                {item.caption && (
                  <p className="mt-1 truncate text-sm text-muted-foreground">{item.caption}</p>
                )}
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label={`Move media ${index + 1} earlier`}
                >
                  <ArrowUp />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => move(index, 1)}
                  disabled={index === media.length - 1}
                  aria-label={`Move media ${index + 1} later`}
                >
                  <ArrowDown />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => remove(item.id)}
                  aria-label={`Remove media ${index + 1}`}
                >
                  <Trash2 />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Map className="h-3.5 w-3.5" aria-hidden="true" />
        The first photo becomes the listing&apos;s cover.
      </p>
    </div>
  );
}
