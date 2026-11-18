"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CircleAlert, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UPLOAD_LIMITS } from "@/lib/constants";

export type UploadedPhoto = { id: string; previewUrl: string };

type Pending = { key: string; name: string; progress: number; previewUrl: string; error?: string };

function uploadWithProgress(file: File, onProgress: (pct: number) => void) {
  return new Promise<{ id: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/uploads");
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: { id?: string; error?: string } = {};
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON */
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.id) resolve({ id: body.id });
      else reject(new Error(body.error ?? "The photo couldn't be uploaded."));
    };
    xhr.onerror = () => reject(new Error("Upload failed. Check your connection and try again."));
    const form = new FormData();
    form.append("file", file);
    xhr.send(form);
  });
}

/**
 * Photo picker with constraints stated up front (allowed types, size, count),
 * per-file progress, previews and removal.
 */
export function PhotoUploader({
  photos,
  onChange,
  onBusyChange,
}: {
  photos: UploadedPhoto[];
  onChange: (photos: UploadedPhoto[]) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<Pending[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const photosRef = useRef(photos);
  useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  const remaining = UPLOAD_LIMITS.maxImagesPerReport - photos.length - pending.filter((p) => !p.error).length;

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setMessage(null);
    const list = Array.from(files).slice(0, Math.max(0, remaining));
    if (files.length > list.length) {
      setMessage(`You can add up to ${UPLOAD_LIMITS.maxImagesPerReport} photos.`);
    }
    onBusyChange?.(true);
    await Promise.all(
      list.map(async (file) => {
        const key = crypto.randomUUID();
        const previewUrl = URL.createObjectURL(file);
        const fail = (error: string) =>
          setPending((prev) => prev.map((p) => (p.key === key ? { ...p, error } : p)));
        setPending((prev) => [...prev, { key, name: file.name, progress: 0, previewUrl }]);

        // Quick client checks for instant feedback; the server re-validates everything.
        if (!(UPLOAD_LIMITS.acceptedMimeTypes as readonly string[]).includes(file.type)) {
          fail("Only JPG, PNG or WebP photos can be uploaded.");
          return;
        }
        if (file.size > UPLOAD_LIMITS.maxBytes) {
          fail("This photo is larger than 5 MB.");
          return;
        }
        try {
          const { id } = await uploadWithProgress(file, (progress) =>
            setPending((prev) => prev.map((p) => (p.key === key ? { ...p, progress } : p))),
          );
          setPending((prev) => prev.filter((p) => p.key !== key));
          onChange([...photosRef.current, { id, previewUrl }]);
        } catch (err) {
          fail(err instanceof Error ? err.message : "Upload failed.");
        }
      }),
    );
    onBusyChange?.(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="space-y-3">
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label="Photos">
        {photos.map((photo, index) => (
          <li key={photo.id} className="relative overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.previewUrl} alt={`Photo ${index + 1}`} className="aspect-[4/3] w-full object-cover" />
            <Button
              type="button"
              size="icon-sm"
              variant="secondary"
              className="absolute top-2 right-2 shadow"
              onClick={() => onChange(photos.filter((p) => p.id !== photo.id))}
              aria-label={`Remove photo ${index + 1}`}
            >
              <X aria-hidden />
            </Button>
            {index === 0 && (
              <span className="absolute bottom-2 left-2 rounded-full bg-card/90 px-2 py-0.5 text-xs font-medium">Cover</span>
            )}
          </li>
        ))}
        {pending.map((p) => (
          <li key={p.key} className="relative overflow-hidden rounded-xl border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.previewUrl} alt="" className="aspect-[4/3] w-full object-cover opacity-50" />
            <div className="absolute inset-x-0 bottom-0 bg-card/95 p-2 text-xs">
              {p.error ? (
                <div className="flex items-start gap-1.5 text-destructive" role="alert">
                  <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                  <span className="flex-1">{p.error}</span>
                  <button
                    type="button"
                    className="font-medium underline"
                    onClick={() => setPending((prev) => prev.filter((x) => x.key !== p.key))}
                  >
                    Dismiss
                  </button>
                </div>
              ) : (
                <div role="status">
                  <span className="sr-only">Uploading {p.name}: </span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <div className="h-full bg-primary transition-[width]" style={{ width: `${p.progress}%` }} />
                  </div>
                  <span className="mt-1 block">Uploading… {p.progress}%</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      <input
        ref={inputRef}
        id="photo-input"
        type="file"
        accept={UPLOAD_LIMITS.acceptedMimeTypes.join(",")}
        multiple
        className="sr-only"
        aria-describedby="photo-rules"
        onChange={(e) => handleFiles(e.target.files)}
        disabled={remaining <= 0}
      />
      <label
        htmlFor="photo-input"
        aria-disabled={remaining <= 0}
        className="flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed bg-card p-4 text-center text-sm transition hover:border-primary/50 hover:bg-accent/50 aria-disabled:cursor-not-allowed aria-disabled:opacity-50 has-[:focus-visible]:ring-3"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          handleFiles(e.dataTransfer.files);
        }}
      >
        <span className="flex items-center gap-2 font-medium text-primary">
          {photos.length ? <ImagePlus className="size-5" aria-hidden /> : <Camera className="size-5" aria-hidden />}
          {remaining > 0 ? (photos.length ? "Add another photo" : "Choose or drop photos") : "Photo limit reached"}
        </span>
        <span id="photo-rules" className="text-xs text-muted-foreground">
          Up to {UPLOAD_LIMITS.maxImagesPerReport} photos · JPG, PNG or WebP · max 5 MB each. Location data is removed automatically.
        </span>
      </label>
      {message && (
        <p className="text-sm text-muted-foreground" role="status">
          {message}
        </p>
      )}
    </div>
  );
}
