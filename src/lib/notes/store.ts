import { create } from "zustand";
import { nid } from "@/lib/utils";
import { stripHtml } from "./html";
import { idbDeleteMedia, idbDeleteNote, idbGetAllNotes, idbGetMedia, idbGetMeta, idbPutMeta, idbPutNote } from "./idb";
import { forgetMediaUrl, isImageFile, isVideoFile, putFile, captureVideoPoster, putBlob } from "./media";
import { buildSeedNotes } from "./seed";
import {
  collectMediaIds,
  emptyTextBlock,
  thumbnailOf,
  type Block,
  type Note,
  type SortMode,
} from "./types";

type NotesState = {
  ready: boolean;
  notes: Note[];
  sort: SortMode;
  query: string;
  hydrate: () => Promise<void>;
  setSort: (sort: SortMode) => void;
  setQuery: (query: string) => void;
  createNote: () => Promise<string>;
  saveNote: (note: Note) => Promise<void>;
  renameNote: (id: string, title: string) => Promise<void>;
  togglePin: (id: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  duplicateNote: (id: string) => Promise<string>;
  insertFiles: (noteId: string, files: File[], afterId?: string | null) => Promise<void>;
  replaceBlockMedia: (noteId: string, blockId: string, file: File) => Promise<void>;
};

let hydrating: Promise<void> | null = null;

function withThumbnail(note: Note): Note {
  return { ...note, thumbnailMediaId: thumbnailOf(note) };
}

/** Build a unique duplicate title: Untitled → Untitled copy → Untitled copy 2. */
function nextDuplicateTitle(sourceTitle: string, notes: Note[]): string {
  const base =
    (sourceTitle.trim() || "Untitled").replace(/\s+copy(?:\s+\d+)?$/i, "").trim() || "Untitled";
  const taken = new Set(notes.map((note) => note.title.toLowerCase()));
  let candidate = `${base} copy`;
  if (!taken.has(candidate.toLowerCase())) return candidate;
  let n = 2;
  while (taken.has(`${base} copy ${n}`.toLowerCase())) n += 1;
  return `${base} copy ${n}`;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  ready: false,
  notes: [],
  sort: "recent",
  query: "",

  setSort: (sort) => set({ sort }),
  setQuery: (query) => set({ query }),

  hydrate: async () => {
    if (typeof indexedDB === "undefined") {
      set({ ready: true });
      return;
    }
    if (hydrating) return hydrating;
    hydrating = (async () => {
      try {
        let notes = await idbGetAllNotes();
        set({ notes, ready: true });
        const seeded = await idbGetMeta<boolean>("seeded");
        if (!notes.length && !seeded) {
          set({
            notes: [
              {
                id: "pending-seed",
                title: "Welcome to Folio",
                createdAt: Date.now(),
                updatedAt: Date.now(),
                thumbnailMediaId: null,
                blocks: [
                  emptyTextBlock({
                    role: "h1",
                    html: "A notebook that holds more than words",
                  }),
                  emptyTextBlock({
                    html: "Folio is a continuous page for writing, pictures, and video.",
                  }),
                ],
              },
            ],
          });
          const fresh = await buildSeedNotes();
          for (const note of fresh) await idbPutNote(note);
          await idbPutMeta("seeded", true);
          set({ notes: fresh });
        }
      } catch (err) {
        console.error("Folio failed to load notes", err);
        set({ ready: true });
      }
    })();
    return hydrating;
  },

  createNote: async () => {
    const now = Date.now();
    const note: Note = {
      id: nid("n"),
      title: "Untitled",
      blocks: [emptyTextBlock()],
      createdAt: now,
      updatedAt: now,
      thumbnailMediaId: null,
    };
    await idbPutNote(note);
    set({ notes: [note, ...get().notes] });
    return note.id;
  },

  saveNote: async (note) => {
    const next = withThumbnail({ ...note, updatedAt: Date.now() });
    await idbPutNote(next);
    set({
      notes: get().notes.map((item) => (item.id === next.id ? next : item)),
    });
  },

  renameNote: async (id, title) => {
    const note = get().notes.find((item) => item.id === id);
    if (!note) return;
    await get().saveNote({ ...note, title });
  },

  togglePin: async (id) => {
    const note = get().notes.find((item) => item.id === id);
    if (!note) return;
    // Pin is list metadata — keep updatedAt so date groups stay stable when unpinning.
    const next: Note = { ...note, pinned: !note.pinned };
    await idbPutNote(next);
    set({
      notes: get().notes.map((item) => (item.id === next.id ? next : item)),
    });
  },

  deleteNote: async (id) => {
    const notes = get().notes;
    const target = notes.find((item) => item.id === id);
    if (!target) return;
    const remaining = notes.filter((item) => item.id !== id);
    const stillUsed = new Set<string>();
    for (const note of remaining) {
      for (const mediaId of collectMediaIds(note)) stillUsed.add(mediaId);
    }
    for (const mediaId of collectMediaIds(target)) {
      if (stillUsed.has(mediaId)) continue;
      forgetMediaUrl(mediaId);
      await idbDeleteMedia(mediaId);
    }
    await idbDeleteNote(id);
    set({ notes: remaining });
  },

  duplicateNote: async (id) => {
    const source = get().notes.find((item) => item.id === id);
    if (!source) throw new Error("Note not found");
    const remap = new Map<string, string>();
    for (const mediaId of collectMediaIds(source)) {
      const rec = await idbGetMedia(mediaId);
      if (!rec) continue;
      const copy = await putBlob(rec.blob, rec.name, rec.mimeType);
      remap.set(mediaId, copy.id);
    }
    const now = Date.now();
    const blocks: Block[] = source.blocks.map((block) => {
      if (block.type === "text") return { ...block, id: nid("b") };
      if (block.type === "image") {
        return { ...block, id: nid("b"), mediaId: remap.get(block.mediaId) ?? block.mediaId };
      }
      return {
        ...block,
        id: nid("b"),
        mediaId: remap.get(block.mediaId) ?? block.mediaId,
        posterMediaId: block.posterMediaId ? (remap.get(block.posterMediaId) ?? block.posterMediaId) : undefined,
      };
    });
    const note: Note = {
      ...source,
      id: nid("n"),
      title: nextDuplicateTitle(source.title, get().notes),
      blocks,
      createdAt: now,
      updatedAt: now,
      thumbnailMediaId: source.thumbnailMediaId ? (remap.get(source.thumbnailMediaId) ?? null) : null,
      pinned: false,
    };
    await idbPutNote(note);
    set({ notes: [note, ...get().notes] });
    return note.id;
  },

  insertFiles: async (noteId, files, afterId) => {
    const note = get().notes.find((item) => item.id === noteId);
    if (!note) return;
    const blocks = [...note.blocks];
    let index = afterId ? blocks.findIndex((block) => block.id === afterId) : blocks.length - 1;
    if (index < 0) index = blocks.length - 1;

    for (const file of files) {
      if (isImageFile(file)) {
        const rec = await putFile(file);
        const block: Block = {
          id: nid("b"),
          type: "image",
          mediaId: rec.id,
          width: 100,
          alt: file.name.replace(/\.[^.]+$/, ""),
        };
        blocks.splice(index + 1, 0, block, emptyTextBlock());
        index += 2;
        continue;
      }
      if (isVideoFile(file)) {
        const rec = await putFile(file);
        const posterBlob = await captureVideoPoster(file);
        const poster = posterBlob ? await putBlob(posterBlob, `${file.name}-poster.jpg`, "image/jpeg") : null;
        const block: Block = {
          id: nid("b"),
          type: "video",
          mediaId: rec.id,
          width: 100,
          posterMediaId: poster?.id,
        };
        blocks.splice(index + 1, 0, block, emptyTextBlock());
        index += 2;
      }
    }

    await get().saveNote({ ...note, blocks });
  },

  replaceBlockMedia: async (noteId, blockId, file) => {
    const note = get().notes.find((item) => item.id === noteId);
    if (!note) return;
    const block = note.blocks.find((item) => item.id === blockId);
    if (!block || block.type === "text") return;

    const oldIds = [block.mediaId];
    if (block.type === "video" && block.posterMediaId) oldIds.push(block.posterMediaId);

    let next: Block;
    if (isImageFile(file) && block.type === "image") {
      const rec = await putFile(file);
      next = { ...block, mediaId: rec.id, alt: file.name.replace(/\.[^.]+$/, "") };
    } else if (isVideoFile(file) && block.type === "video") {
      const rec = await putFile(file);
      const posterBlob = await captureVideoPoster(file);
      const poster = posterBlob ? await putBlob(posterBlob, `${file.name}-poster.jpg`, "image/jpeg") : null;
      next = { ...block, mediaId: rec.id, posterMediaId: poster?.id };
    } else {
      return;
    }

    const blocks = note.blocks.map((item) => (item.id === blockId ? next : item));
    await get().saveNote({ ...note, blocks });

    const stillUsed = new Set<string>();
    for (const item of get().notes) {
      for (const mediaId of collectMediaIds(item)) stillUsed.add(mediaId);
    }
    for (const mediaId of oldIds) {
      if (stillUsed.has(mediaId)) continue;
      forgetMediaUrl(mediaId);
      await idbDeleteMedia(mediaId);
    }
  },
}));

export function sortedNotes(notes: Note[], sort: SortMode, query: string): Note[] {
  const q = query.trim().toLowerCase();
  const filtered = q
    ? notes.filter((note) => {
        if (note.title.toLowerCase().includes(q)) return true;
        return note.blocks.some((block) => {
          if (block.type !== "text") return false;
          return stripHtml(block.html).toLowerCase().includes(q);
        });
      })
    : notes;
  const copy = [...filtered];
  if (sort === "name") {
    copy.sort((a, b) => a.title.localeCompare(b.title, undefined, { sensitivity: "base" }));
  } else {
    copy.sort((a, b) => b.updatedAt - a.updatedAt);
  }
  return copy;
}
