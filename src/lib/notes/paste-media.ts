import { toast } from "sonner";
import { isImageFile, isVideoFile } from "./media";

/** Collect image/video files from a paste event (Files list or clipboard items). */
export function mediaFilesFromClipboard(clipboardData: DataTransfer | null): File[] {
  if (!clipboardData) return [];
  const fromFiles = [...(clipboardData.files ?? [])];
  const fromItems: File[] = [];
  if (clipboardData.items) {
    for (const item of clipboardData.items) {
      if (item.kind !== "file") continue;
      const file = item.getAsFile();
      if (file) fromItems.push(file);
    }
  }
  const candidates = fromFiles.length ? fromFiles : fromItems;
  return candidates.filter((file) => isImageFile(file) || isVideoFile(file));
}

export function toastMediaAdded(media: File[]): void {
  if (!media.length) return;
  const onlyImages = media.every((file) => isImageFile(file));
  const onlyVideos = media.every((file) => isVideoFile(file));
  if (media.length === 1 && onlyImages) toast("Picture added to the page");
  else if (media.length === 1 && onlyVideos) toast("Video added to the page");
  else toast(`${media.length} files added to the page`);
}
