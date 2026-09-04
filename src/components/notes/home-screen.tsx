import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { formatDistanceToNow } from "date-fns";
import { Copy, MoreHorizontal, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ExportAllButton } from "@/components/notes/export-all-button";
import { ThemeToggle } from "@/components/notes/theme-toggle";
import { useMediaUrl } from "@/hooks/use-media-url";
import { previewText, stripHtml } from "@/lib/notes/html";
import { groupNotesByRelativeDate } from "@/lib/notes/relative-date";
import { sortedNotes, useNotesStore } from "@/lib/notes/store";
import { thumbnailOf, type Note } from "@/lib/notes/types";
import { cn } from "@/lib/utils";

export function HomeScreen() {
  const navigate = useNavigate();
  const hydrate = useNotesStore((s) => s.hydrate);
  const ready = useNotesStore((s) => s.ready);
  const notes = useNotesStore((s) => s.notes);
  const sort = useNotesStore((s) => s.sort);
  const query = useNotesStore((s) => s.query);
  const setSort = useNotesStore((s) => s.setSort);
  const setQuery = useNotesStore((s) => s.setQuery);
  const createNote = useNotesStore((s) => s.createNote);
  const deleteNote = useNotesStore((s) => s.deleteNote);
  const duplicateNote = useNotesStore((s) => s.duplicateNote);
  const renameNote = useNotesStore((s) => s.renameNote);

  const [pendingDelete, setPendingDelete] = useState<Note | null>(null);
  const [renaming, setRenaming] = useState<Note | null>(null);
  const [renameValue, setRenameValue] = useState("");

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const visible = useMemo(() => sortedNotes(notes, sort, query), [notes, sort, query]);
  const grouped = useMemo(() => groupNotesByRelativeDate(visible), [visible]);
  const noteCount = Object.keys(notes).length;

  async function onCreate() {
    const id = await createNote();
    void navigate({ to: "/note/$noteId", params: { noteId: id } });
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-5xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10">
      <header className="stagger-item mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">Notebook</p>
          <h1 className="mt-1 font-serif text-4xl font-medium tracking-tight text-fg sm:text-5xl">
            Folio
          </h1>
          <p className="mt-2 max-w-md text-sm text-muted">Write. Paste a picture. Drop a clip. Keep going.</p>
        </div>
        <div className="flex items-center gap-1">
          <ExportAllButton notes={visible} />
          <ThemeToggle />
          <Button onClick={() => void onCreate()} className="hidden sm:inline-flex">
            <Plus />
            New note
          </Button>
        </div>
      </header>

      <div className="stagger-item mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative block flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-subtle" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search notes"
            className="pl-10"
            aria-label="Search notes"
          />
        </label>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md bg-surface p-1 shadow-border">
            <button
              type="button"
              onClick={() => setSort("recent")}
              className={cn(
                "h-9 rounded-sm px-3 text-sm",
                sort === "recent" ? "bg-paper text-fg shadow-border" : "text-muted",
              )}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={() => setSort("name")}
              className={cn(
                "h-9 rounded-sm px-3 text-sm",
                sort === "name" ? "bg-paper text-fg shadow-border" : "text-muted",
              )}
            >
              Name
            </button>
          </div>
          <Button onClick={() => void onCreate()} size="icon" className="sm:hidden" aria-label="New note">
            <Plus />
          </Button>
        </div>
      </div>

      {!ready ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-56 animate-pulse rounded-xl bg-surface shadow-border" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <EmptyState
          query={query}
          hasNotes={noteCount > 0}
          onCreate={() => void onCreate()}
          onClearSearch={() => setQuery("")}
        />
      ) : (
        <div className="flex flex-col gap-8">
          {grouped.map((group) => (
            <section key={group.id} aria-labelledby={`notes-group-${group.id}`}>
              <h2
                id={`notes-group-${group.id}`}
                className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-muted"
              >
                {group.label}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {group.notes.map((note) => (
                  <li key={note.id} className="stagger-item">
                    <NoteCard
                      note={note}
                      onOpen={() => void navigate({ to: "/note/$noteId", params: { noteId: note.id } })}
                      onRename={() => {
                        setRenaming(note);
                        setRenameValue(note.title);
                      }}
                      onDuplicate={async () => {
                        const id = await duplicateNote(note.id);
                        toast("Note duplicated");
                        void navigate({ to: "/note/$noteId", params: { noteId: id } });
                      }}
                      onDelete={() => setPendingDelete(note)}
                    />
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <Button
        onClick={() => void onCreate()}
        size="icon"
        className="fixed bottom-5 right-5 z-20 size-14 rounded-full shadow-border sm:hidden"
        aria-label="New note"
      >
        <Plus className="size-6" />
      </Button>

      <AlertDialog open={!!pendingDelete} onOpenChange={(open) => !open && setPendingDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this note?</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingDelete
                ? `“${pendingDelete.title}” and its pictures and videos will be removed from this device.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-danger text-paper"
              onClick={async () => {
                if (!pendingDelete) return;
                await deleteNote(pendingDelete.id);
                setPendingDelete(null);
                toast("Note deleted");
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!renaming} onOpenChange={(open) => !open && setRenaming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename note</AlertDialogTitle>
            <AlertDialogDescription>Choose a short title for the home screen.</AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter" && renaming) {
                void renameNote(renaming.id, renameValue.trim() || "Untitled");
                setRenaming(null);
              }
            }}
          />
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!renaming) return;
                void renameNote(renaming.id, renameValue.trim() || "Untitled");
                setRenaming(null);
              }}
            >
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}

function EmptyState({
  query,
  hasNotes,
  onCreate,
  onClearSearch,
}: {
  query: string;
  hasNotes: boolean;
  onCreate: () => void;
  onClearSearch: () => void;
}) {
  const trimmed = query.trim();
  const isSearchMiss = hasNotes && trimmed.length > 0;

  if (isSearchMiss) {
    return (
      <div className="rounded-xl bg-paper px-6 py-16 text-center shadow-border" role="status">
        <p className="font-serif text-2xl text-fg">No notes match “{trimmed}”</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
          Try a different word, clear the search, or start a new note.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          <Button type="button" variant="secondary" onClick={onClearSearch}>
            Clear search
          </Button>
          <Button type="button" onClick={onCreate}>
            <Plus />
            New note
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-paper px-6 py-16 text-center shadow-border" role="status">
      <p className="font-serif text-2xl text-fg">Your notebook is empty</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted">
        Start with a blank page — type, paste a picture, or drop in a video.
      </p>
      <Button type="button" className="mt-6" size="lg" onClick={onCreate}>
        <Plus />
        Create your first note
      </Button>
    </div>
  );
}

function NoteCard({
  note,
  onOpen,
  onRename,
  onDuplicate,
  onDelete,
}: {
  note: Note;
  onOpen: () => void;
  onRename: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const firstText = note.blocks.find((b) => b.type === "text" && stripHtml(b.html));
  const preview = firstText && firstText.type === "text" ? previewText(firstText.html, 120) : "Empty note";
  const thumbId = thumbnailOf(note);
  const thumb = useMediaUrl(thumbId);
  const videoBlock = note.blocks.find((b) => b.type === "video");

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-xl bg-paper shadow-border transition-[transform,box-shadow] duration-200 hover:-translate-y-0.5">
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col text-left">
        <div className="relative aspect-4/3 overflow-hidden bg-surface">
          {thumb ? (
            <img
              src={thumb}
              alt=""
              className="media-frame size-full object-cover"
            />
          ) : (
            <div className="flex size-full items-end p-4">
              <p className="line-clamp-4 font-serif text-lg leading-snug text-fg/80">{preview}</p>
            </div>
          )}
          {videoBlock ? (
            <span className="absolute bottom-3 left-3 rounded-full bg-fg/80 px-2 py-1 text-xs font-medium uppercase tracking-wide text-bg">
              Video
            </span>
          ) : null}
        </div>
        <div className="flex flex-1 flex-col gap-1 p-4 pr-12">
          <h2 className="truncate font-serif text-lg font-medium text-fg">{note.title || "Untitled"}</h2>
          {thumb ? <p className="line-clamp-2 text-sm text-muted">{preview}</p> : null}
          <p className="mt-auto pt-3 text-xs tabular-nums text-subtle">
            {formatDistanceToNow(note.updatedAt, { addSuffix: true })}
          </p>
        </div>
      </button>
      <div className="absolute bottom-3 right-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Note actions"
              className="text-muted"
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={onRename}>
              <Pencil className="size-4" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={onDuplicate}>
              <Copy className="size-4" />
              Duplicate
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onDelete}>
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </article>
  );
}
