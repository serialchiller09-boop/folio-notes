import { useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useMediaUrl } from "@/hooks/use-media-url";
import type { ImageBlock as ImageBlockType } from "@/lib/notes/types";
import { cn } from "@/lib/utils";

export function ImageBlockView({
  block,
  selected,
  onWidth,
  readOnly,
}: {
  block: ImageBlockType;
  selected: boolean;
  onWidth: (width: number) => void;
  readOnly?: boolean;
}) {
  const url = useMediaUrl(block.mediaId);
  const [open, setOpen] = useState(false);

  return (
    <>
      <ResizableMedia width={block.width} onWidth={onWidth} selected={selected} readOnly={readOnly}>
        {url ? (
          <button type="button" onClick={() => setOpen(true)} className="block w-full">
            <img
              src={url}
              alt={block.alt || "Photograph"}
              draggable={false}
              className="media-frame max-h-[70vh] w-full rounded-md object-contain"
            />
          </button>
        ) : (
          <div className="flex aspect-video items-center justify-center rounded-md bg-surface text-subtle">
            Loading image
          </div>
        )}
      </ResizableMedia>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          showClose
          className="max-h-[92dvh] w-[min(96vw,1100px)] overflow-auto bg-bg p-2"
        >
          <DialogTitle className="sr-only">{block.alt || "Photograph"}</DialogTitle>
          {url ? (
            <img src={url} alt={block.alt || ""} className="mx-auto max-h-[86dvh] w-auto rounded-md" />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}

export function ResizableMedia({
  width,
  onWidth,
  selected,
  readOnly,
  children,
}: {
  width: number;
  onWidth: (width: number) => void;
  selected: boolean;
  readOnly?: boolean;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);

  function onDown(e: React.PointerEvent) {
    e.preventDefault();
    e.stopPropagation();
    const parent = ref.current?.parentElement;
    if (!parent) return;
    const startX = e.clientX;
    const startW = width;
    const box = parent.getBoundingClientRect();
    const move = (ev: PointerEvent) => {
      const next = Math.min(100, Math.max(36, startW + ((ev.clientX - startX) / box.width) * 100));
      onWidth(Math.round(next));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  }

  return (
    <div ref={ref} className="relative mx-auto" style={{ width: `${width}%` }}>
      {children}
      {readOnly ? null : (
        <button
          type="button"
          aria-label="Resize"
          onPointerDown={onDown}
          className={cn(
            "absolute bottom-2 right-2 size-6 rounded-sm bg-fg/75 text-bg",
            selected ? "opacity-100" : "opacity-0 group-hover/block:opacity-100",
          )}
        />
      )}
    </div>
  );
}
