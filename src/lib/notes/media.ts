import { nid } from "@/lib/utils";
import { idbGetMedia, idbPutMedia } from "./idb";
import type { MediaRecord } from "./types";

const urlCache = new Map<string, string>();

function inferMime(name: string, fallback = "application/octet-stream"): string {
  const lower = name.toLowerCase();
  if (/\.mp4$/i.test(lower) || /\.m4v$/i.test(lower)) return "video/mp4";
  if (/\.webm$/i.test(lower)) return "video/webm";
  if (/\.mov$/i.test(lower)) return "video/quicktime";
  if (/\.ogg$/i.test(lower) || /\.ogv$/i.test(lower)) return "video/ogg";
  if (/\.png$/i.test(lower)) return "image/png";
  if (/\.jpe?g$/i.test(lower)) return "image/jpeg";
  if (/\.gif$/i.test(lower)) return "image/gif";
  if (/\.webp$/i.test(lower)) return "image/webp";
  if (/\.avif$/i.test(lower)) return "image/avif";
  return fallback;
}

function ensureTypedBlob(blob: Blob, name: string, mimeType?: string): Blob {
  const type = (mimeType && mimeType !== "application/octet-stream" ? mimeType : null)
    || (blob.type && blob.type !== "application/octet-stream" ? blob.type : null)
    || inferMime(name);
  if (blob.type === type) return blob;
  return new Blob([blob], { type });
}

export async function getMediaUrl(id: string): Promise<string> {
  const cached = urlCache.get(id);
  if (cached) return cached;
  const rec = await idbGetMedia(id);
  if (!rec) return "";
  const typed = ensureTypedBlob(rec.blob, rec.name, rec.mimeType);
  const url = URL.createObjectURL(typed);
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
  const typed = ensureTypedBlob(blob, name, mimeType);
  const rec: MediaRecord = {
    id: nid("m"),
    mimeType: typed.type || inferMime(name),
    name,
    size: typed.size,
    createdAt: Date.now(),
    blob: typed,
  };
  await idbPutMedia(rec);
  return rec;
}

export async function putFile(file: File): Promise<MediaRecord> {
  const mime = file.type && file.type !== "application/octet-stream"
    ? file.type
    : inferMime(file.name, "application/octet-stream");
  return putBlob(file, file.name, mime);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/") || /\.(png|jpe?g|gif|webp|avif|svg)$/i.test(file.name);
}

export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/") || /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(file.name);
}

export function captureVideoPoster(file: File): Promise<Blob | null> {
  return new Promise((resolve) => {
    const mime = file.type && file.type !== "application/octet-stream"
      ? file.type
      : inferMime(file.name, "video/mp4");
    const typed = file.type === mime ? file : new File([file], file.name, { type: mime });
    const url = URL.createObjectURL(typed);
    const video = document.createElement("video");
    video.preload = "auto";
    video.muted = true;
    video.playsInline = true;
    video.setAttribute("playsinline", "true");
    video.src = url;

    let settled = false;
    const finish = (result: Blob | null) => {
      if (settled) return;
      settled = true;
      URL.revokeObjectURL(url);
      resolve(result);
    };

    const snap = () => {
      try {
        const w = video.videoWidth;
        const h = video.videoHeight;
        if (!w || !h) {
          finish(null);
          return;
        }
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          finish(null);
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        canvas.toBlob(
          (blob) => finish(blob),
          "image/jpeg",
          0.82,
        );
      } catch {
        finish(null);
      }
    };

    const trySeekAndSnap = () => {
      if (video.videoWidth > 0) {
        snap();
        return;
      }
      const target = Number.isFinite(video.duration) && video.duration > 0
        ? Math.min(0.25, video.duration / 4)
        : 0.1;
      const onSeeked = () => snap();
      video.addEventListener("seeked", onSeeked, { once: true });
      try {
        video.currentTime = target;
      } catch {
        snap();
      }
    };

    video.addEventListener("error", () => finish(null), { once: true });
    video.addEventListener("loadeddata", trySeekAndSnap, { once: true });
    video.addEventListener("loadedmetadata", () => {
      if (video.readyState >= 2) trySeekAndSnap();
    }, { once: true });

    // Android / WebView sometimes never fires without an explicit load
    try {
      video.load();
    } catch {
      // ignore
    }

    window.setTimeout(() => finish(null), 8000);
  });
}

export async function fetchAsFile(path: string, name: string, mime: string): Promise<File> {
  const res = await fetch(path);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  const blob = await res.blob();
  const type = mime || blob.type || inferMime(name);
  return new File([blob], name, { type });
}
