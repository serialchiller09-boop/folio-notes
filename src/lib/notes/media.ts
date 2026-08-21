import { nid } from "@/lib/utils";
import { idbGetMedia, idbPutMedia } from "./idb";
import type { MediaRecord } from "./types";

const urlCache = new Map<string, string>();

export async function getMediaUrl(id: string): Promise<string> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const rec = await idbGetMedia(id);
  if (!rec) return "";
  const url = URL.createObjectURL(rec.blob);
  urlCache.set(id, url);
  return url;
}

export function forgetMediaUrl(id: string) {
  const url = urlCache.get(id);
  if (url) {
    URL.revokeObjectURL(url);
    urlCache.delete(id);
  }
}

export async function putBlob(blob: Blob, name: string, mimeType?: string): Promise<MediaRecord> {
  const rec: MediaRecord = {
    id: nid("m"),
    mimeType: mimeType || blob.type || "application/octet-stream",
    name,
    size: blob.size,
    createdAt: Date.now(),
    blob,
  };
  await idbPutMedia(rec);
  return rec;
}

export async function putFile(file: File): Promise<MediaRecord> {
  return putBlob(file, file.name, file.type);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(file.name);
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg)$/i.test(file.name);
}

export function captureVideoPoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.src = url;

    const cleanup = () => URL.revokeObjectURL(url);
    const fail = () => {
      cleanup();
      resolve(null);
    };

    const snap = () => {
      try {
        const w = video.videoWidth || 640;
        const h = video.videoHeight || 360;
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          fail();
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        canvas.toBlob(
          (blob) => {
            cleanup();
            resolve(blob);
          },
          "image/jpeg",
          0.82,
        );
      } catch {
        fail();
      }
    };

    video.addEventListener("error", fail, { once: true });
    video.addEventListener(
      "loadeddata",
      () => {
        if (video.readyState >= 2) {
          snap();
          return;
        }
        video.currentTime = Math.min(0.15, (video.duration || 1) / 4);
        video.addEventListener("seeked", snap, { once: true });
      },
      { once: true },
    );
  });
}

export async function fetchAsFile(path: string, name: string, mime: string): Promise<File> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  const blob = await res.blob();
  return new File([blob], name, { type: mime || blob.type });
}
