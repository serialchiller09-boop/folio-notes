export type Align = "left" | "center" | "right";
export type FontSize = "sm" | "md" | "lg" | "xl";
export type TextRole = "paragraph" | "h1" | "h2" | "h3";

export type TextBlock = {
  id: string;
  type: "text";
  html: string;
  role: TextRole;
  align: Align;
  fontSize: FontSize;
};

export type ImageBlock = {
  id: string;
  type: "image";
  mediaId: string;
  width: number;
  alt: string;
};

export type VideoBlock = {
  id: string;
  type: "video";
  mediaId: string;
  width: number;
  posterMediaId?: string;
};

export type Block = TextBlock | ImageBlock | VideoBlock;

export type Note = {
  id: string;
  title: string;
  blocks: Block[];
  createdAt: number;
  updatedAt: number;
  thumbnailMediaId?: string | null;
};

export type MediaRecord = {
  id: string;
  mimeType: string;
  name: string;
  size: number;
  createdAt: number;
  blob: Blob;
};

export type SortMode = "recent" | "name";

export function emptyTextBlock(partial?: Partial<TextBlock>): TextBlock {
  return {
    id: partial?.id ?? crypto.randomUUID(),
    type: "text",
    html: partial?.html ?? "",
    role: partial?.role ?? "paragraph",
    align: partial?.align ?? "left",
    fontSize: partial?.fontSize ?? "md",
  };
}

export function thumbnailOf(note: Note): string | null {
  if (note.thumbnailMediaId) return note.thumbnailMediaId;
  for (const block of note.blocks) {
    if (block.type === "image") return block.mediaId;
    if (block.type === "video") return block.posterMediaId ?? null;
  }
  return null;
}

export function collectMediaIds(note: Note): Set<string> {
  const ids = new Set<string>();
  for (const block of note.blocks) {
    if (block.type === "image") ids.add(block.mediaId);
    if (block.type === "video") {
      ids.add(block.mediaId);
      if (block.posterMediaId) ids.add(block.posterMediaId);
    }
  }
  return ids;
}
