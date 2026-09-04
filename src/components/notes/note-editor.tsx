import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, CircleHelp, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { BlockShell } from "@/components/notes/block-shell";
import { FormatToolbar } from "@/components/notes/toolbar";
import { TextBlockView } from "@/components/notes/text-block";
import { ImageBlockView } from "@/components/notes/image-block";
import { VideoBlockView } from "@/components/notes/video-block";
import { TtsBar } from "@/components/notes/tts-bar";
import { ThemeToggle } from "@/components/notes/theme-toggle";
import { KeyboardShortcutsHelp, isTypingTarget } from "@/components/notes/keyboard-shortcuts-help";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { isEmptyHtml, sanitizeHtml, stripHtml } from "@/lib/notes/html";
import { ExportMarkdownButton } from "@/components/notes/export-markdown-button";
import { downloadNoteMarkdown } from "@/lib/notes/markdown";
import { mediaFilesFromClipboard, toastMediaAdded } from "@/lib/notes/paste-media";
import { isImageFile, isVideoFile } from "@/lib/notes/media";
import { useNotesStore } from "@/lib/notes/store";
import { pickEnglishFemaleVoice, tts, type TtsStatus } from "@/lib/notes/tts";
import { emptyTextBlock, type Align, type Block, type FontSize, type Note, type TextRole } from "@/lib/notes/types";
import { nid } from "@/lib/utils";

export function NoteEditor({ noteId }: { noteId: string }) {
  const hydrate = useNotesStore((s) => s.hydrate);
  const ready = useNotesStore((s) => s.ready);
  const notes = useNotesStore((s) => s.notes);
  const saveNote = useNotesStore((s) => s.saveNote);
  const insertFiles = useNotesStore((s) => s.insertFiles);
  const replaceBlockMedia = useNotesStore((s) => s.replaceBlockMedia);
  const note = notes.find((item) => item.id === noteId);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropId, setDropId] = useState<string | null>(null);
  const [saving, setSaving] = useState<"saved" | "saving">("saved");
  const [ttsStatus, setTtsStatus] = useState<TtsStatus>("idle");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [voiceName, setVoiceName] = useState("");
  const [draggingFile, setDraggingFile] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const fileDragCount = useRef(0);
  const fileRef = useRef<HTMLInputElement>(null);
  const fileKind = useRef<"image" | "video" | "replace-image" | "replace-video">("image");
  const replaceId = useRef<string | null>(null);
  const saveTimer = useRef<number | null>(null);
  const pending = useRef<Note | null>(null);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    tts.setListener({
      onStatus: setTtsStatus,
      onBlock: setSpeakingId,
    });
    void tts.ready().then((voice) => setVoiceName(voice?.name ?? ""));
    return () => tts.stop();
  }, []);

  useEffect(() => {
    if (speakingId) {
      document.getElementById(`block-${speakingId}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [speakingId]);

  const activeText = useMemo(() => {
    const block = note?.blocks.find((item) => item.id === activeId);
    return block?.type === "text" ? block : null;
  }, [note, activeId]);

  function queueSave(next: Note) {
    pending.current = next;
    setSaving("saving");
    if (saveTimer.current) window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      const snapshot = pending.current;
      if (!snapshot) return;
      void saveNote(snapshot).then(() => setSaving("saved"));
    }, 380);
  }

  function saveNow() {
    if (!note) return;
    if (saveTimer.current) {
      window.clearTimeout(saveTimer.current);
      saveTimer.current = null;
    }
    const snapshot = pending.current ?? note;
    setSaving("saving");
    void saveNote(snapshot).then(() => {
      pending.current = null;
      setSaving("saved");
      toast("Saved");
    });
  }

  function exportMarkdown() {
    if (!note) return;
    downloadNoteMarkdown(note);
    toast("Markdown downloaded");
  }

  function patch(updater: (current: Note) => Note) {
    if (!note) return;
    const next = updater(note);
    queueSave(next);
    useNotesStore.setState({
      notes: useNotesStore.getState().notes.map((item) => (item.id === next.id ? next : item)),
    });
  }

  function updateBlocks(fn: (blocks: Block[]) => Block[]) {
    patch((current) => ({ ...current, blocks: fn(current.blocks) }));
  }

  function runCommand(cmd: string) {
    document.execCommand(cmd, false);
  }

  function onTitle(title: string) {
    patch((current) => ({ ...current, title }));
  }

  function onTextChange(id: string, html: string) {
    updateBlocks((blocks) =>
      blocks.map((block) => (block.id === id && block.type === "text" ? { ...block, html } : block)),
    );
  }

  function onRole(role: TextRole) {
    if (!activeText) return;
    updateBlocks((blocks) =>
      blocks.map((block) => (block.id === activeText.id && block.type === "text" ? { ...block, role } : block)),
    );
  }

  function onAlign(align: Align) {
    if (!activeText) return;
    document.execCommand(
      align === "center" ? "justifyCenter" : align === "right" ? "justifyRight" : "justifyLeft",
      false,
    );
    updateBlocks((blocks) =>
      blocks.map((block) => (block.id === activeText.id && block.type === "text" ? { ...block, align } : block)),
    );
  }

  function onSize(fontSize: FontSize) {
    if (!activeText) return;
    updateBlocks((blocks) =>
      blocks.map((block) => (block.id === activeText.id && block.type === "text" ? { ...block, fontSize } : block)),
    );
  }

  function moveBlock(id: string, dir: -1 | 1) {
    updateBlocks((blocks) => {
      const index = blocks.findIndex((block) => block.id === id);
      const nextIndex = index + dir;
      if (index < 0 || nextIndex < 0 || nextIndex >= blocks.length) return blocks;
      const copy = [...blocks];
      const [item] = copy.splice(index, 1);
      copy.splice(nextIndex, 0, item);
      return copy;
    });
  }

  function removeBlock(id: string) {
    updateBlocks((blocks) => {
      const next = blocks.filter((block) => block.id !== id);
      return next.length ? next : [emptyTextBlock()];
    });
  }

  function dropBlock(targetId: string) {
    if (!dragId || dragId === targetId) return;
    updateBlocks((blocks) => {
      const from = blocks.findIndex((block) => block.id === dragId);
      const to = blocks.findIndex((block) => block.id === targetId);
      if (from < 0 || to < 0) return blocks;
      const copy = [...blocks];
      const [item] = copy.splice(from, 1);
      copy.splice(to, 0, item);
      return copy;
    });
    setDragId(null);
    setDropId(null);
  }

  function pickFile(kind: "image" | "video") {
    fileKind.current = kind;
    replaceId.current = null;
    if (fileRef.current) {
      fileRef.current.accept = kind === "image" ? "image/*" : "video/*";
      fileRef.current.click();
    }
  }

  function pickReplace(id: string, kind: "image" | "video") {
    fileKind.current = kind === "image" ? "replace-image" : "replace-video";
    replaceId.current = id;
    if (fileRef.current) {
      fileRef.current.accept = kind === "image" ? "image/*" : "video/*";
      fileRef.current.click();
    }
  }

  async function onFiles(files: File[]) {
    if (!note) return;
    const usable = files.filter((file) => isImageFile(file) || isVideoFile(file));
    if (!usable.length) return;
    const replace = replaceId.current;
    if (replace && usable[0]) {
      try {
        await replaceBlockMedia(note.id, replace, usable[0]);
      } catch {
        toast("Could not replace that file");
      }
      replaceId.current = null;
      return;
    }
    try {
      await insertFiles(note.id, usable, activeId);
    } catch {
      toast("Could not add that file. It may be too large for this device.");
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const media = mediaFilesFromClipboard(e.clipboardData);
    if (media.length) {
      e.preventDefault();
      void onFiles(media).then(() => toastMediaAdded(media));
      return;
    }
    const html = e.clipboardData.getData("text/html");
    if (html && activeText) {
      e.preventDefault();
      document.execCommand("insertHTML", false, sanitizeHtml(html));
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    const meta = e.metaKey || e.ctrlKey;
    const key = e.key.toLowerCase();

    if ((meta && e.key === "/") || (e.key === "?" && !meta && !e.altKey && !isTypingTarget(e.target))) {
      e.preventDefault();
      setHelpOpen((open) => !open);
      return;
    }

    if (meta && key === "s") {
      e.preventDefault();
      saveNow();
      return;
    }

    if (meta && e.shiftKey && key === "e") {
      e.preventDefault();
      exportMarkdown();
      return;
    }

    if (meta && key === "b") {
      e.preventDefault();
      runCommand("bold");
    }
    if (meta && key === "i") {
      e.preventDefault();
      runCommand("italic");
    }
    if (meta && key === "u") {
      e.preventDefault();
      runCommand("underline");
    }
  }

  function listen() {
    if (!note) return;
    if (ttsStatus === "paused") {
      tts.resume();
      return;
    }
    if (ttsStatus === "playing") {
      tts.pause();
      return;
    }
    const voice = pickEnglishFemaleVoice();
    setVoiceName(voice?.name ?? "English");
    const texts = note.blocks.filter(
      (block): block is Extract<Block, { type: "text" }> =>
        block.type === "text" && stripHtml(block.html).length > 0,
    );
    let start = 0;
    if (activeId) {
      const activeIndex = note.blocks.findIndex((block) => block.id === activeId);
      const first = texts.findIndex((block) => {
        const idx = note.blocks.findIndex((item) => item.id === block.id);
        return idx >= activeIndex;
      });
      if (first >= 0) start = first;
    }
    const queue = texts.slice(start).map((block) => ({ id: block.id, text: stripHtml(block.html) }));
    if (!queue.length) {
      toast("There is no text to read yet.");
      return;
    }
    if (typeof window === "undefined" || !window.speechSynthesis) {
      toast("Reading is not available in this browser.");
      return;
    }
    tts.start(queue, rate);
  }

  if (!ready) {
    return (
      <main className="flex min-h-dvh items-center justify-center text-sm text-muted">Opening note…</main>
    );
  }

  if (!note) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-serif text-2xl">This note is gone</p>
        <Button asChild variant="secondary">
          <Link to="/">Back to notes</Link>
        </Button>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-bg pb-24" onPaste={onPaste} onKeyDown={onKeyDown}>
      <header className="sticky top-0 z-20 border-b border-border bg-bg/92">
        <div className="mx-auto flex max-w-3xl items-center gap-1 px-2 py-2">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Back to notes">
            <Link to="/">
              <ChevronLeft />
            </Link>
          </Button>
          <input
            value={note.title}
            onChange={(e) => onTitle(e.target.value)}
            className="min-w-0 flex-1 bg-transparent font-serif text-lg font-medium tracking-tight text-fg outline-none"
            aria-label="Note title"
          />
          <span className="hidden w-12 text-right text-xs text-subtle sm:block">
            {saving === "saving" ? "Saving" : "Saved"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Keyboard shortcuts"
            onClick={() => setHelpOpen(true)}
          >
            <CircleHelp />
          </Button>
          <ThemeToggle />
          <ExportMarkdownButton note={note} />
          <Button type="button" variant="secondary" size="sm" onClick={listen}>
            <Volume2 />
            <span className="hidden sm:inline">
              {ttsStatus === "playing" ? "Pause" : ttsStatus === "paused" ? "Resume" : "Listen"}
            </span>
          </Button>
        </div>
        <div className="mx-auto max-w-3xl px-2 pb-2">
          <FormatToolbar
            text={activeText}
            onCommand={runCommand}
            onRole={onRole}
            onAlign={onAlign}
            onSize={onSize}
            onInsertImage={() => pickFile("image")}
            onInsertVideo={() => pickFile("video")}
          />
        </div>
      </header>

      <article
        className="folio-doc relative mx-auto my-4 max-w-3xl rounded-xl bg-paper px-5 py-8 shadow-border sm:my-8 sm:px-12 sm:py-12"
        onDragEnter={(e) => {
          if (![...e.dataTransfer.types].includes("Files")) return;
          fileDragCount.current += 1;
          setDraggingFile(true);
        }}
        onDragOver={(e) => {
          if (![...e.dataTransfer.types].includes("Files")) return;
          e.preventDefault();
          setDraggingFile(true);
        }}
        onDragLeave={() => {
          fileDragCount.current -= 1;
          if (fileDragCount.current <= 0) {
            fileDragCount.current = 0;
            setDraggingFile(false);
          }
        }}
        onDrop={(e) => {
          if (!e.dataTransfer.files?.length) return;
          e.preventDefault();
          fileDragCount.current = 0;
          setDraggingFile(false);
          void onFiles([...e.dataTransfer.files]);
        }}
      >
        {note.blocks.map((block) => (
          <div id={`block-${block.id}`} key={block.id}>
            <BlockShell
              selected={activeId === block.id}
              speaking={speakingId === block.id}
              onSelect={() => setActiveId(block.id)}
              onMove={(dir) => moveBlock(block.id, dir)}
              onRemove={() => removeBlock(block.id)}
              dragging={dragId === block.id}
              dropTarget={dropId === block.id}
              onDragStart={(e) => {
                setDragId(block.id);
                e.dataTransfer.setData("text/block-id", block.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragOver={(e) => {
                if (![...e.dataTransfer.types].includes("Files")) return;
                if (!dragId) return;
                e.preventDefault();
                setDropId(block.id);
              }}
              onDrop={(e) => {
                if (![...e.dataTransfer.types].includes("Files")) return;
                e.preventDefault();
                dropBlock(block.id);
              }}
              onDragEnd={() => {
                setDragId(null);
                setDropId(null);
              }}
              extraMenu={
                block.type === "image" || block.type === "video" ? (
                  <DropdownMenuItem onSelect={() => pickReplace(block.id, block.type)}>
                    Replace {block.type}
                  </DropdownMenuItem>
                ) : null
              }
            >
              {block.type === "text" ? (
                <TextBlockView
                  block={block}
                  onChange={(html) => onTextChange(block.id, html)}
                  onFocus={() => setActiveId(block.id)}
                />
              ) : block.type === "image" ? (
                <ImageBlockView
                  block={block}
                  selected={activeId === block.id}
                  onWidth={(width) =>
                    updateBlocks((blocks) =>
                      blocks.map((item) => (item.id === block.id && item.type === "image" ? { ...item, width } : item)),
                    )
                  }
                />
              ) : (
                <VideoBlockView
                  block={block}
                  selected={activeId === block.id}
                  onWidth={(width) =>
                    updateBlocks((blocks) =>
                      blocks.map((item) => (item.id === block.id && item.type === "video" ? { ...item, width } : item)),
                    )
                  }
                />
              )}
            </BlockShell>
          </div>
        ))}

        <button
          type="button"
          className="mt-4 w-full rounded-md px-2 py-6 text-left text-sm text-subtle hover:text-muted"
          onClick={() => {
            const last = note.blocks[note.blocks.length - 1];
            if (last?.type === "text" && isEmptyHtml(last.html)) {
              setActiveId(last.id);
              document.getElementById(`block-${last.id}`)?.querySelector<HTMLElement>("[contenteditable]")?.focus();
              return;
            }
            const fresh = emptyTextBlock({ id: nid("b") });
            updateBlocks((blocks) => [...blocks, fresh]);
            setActiveId(fresh.id);
          }}
        >
          Continue writing
        </button>
        {draggingFile ? (
          <div className="pointer-events-none absolute inset-3 flex items-center justify-center rounded-lg border border-dashed border-accent bg-paper/80">
            <p className="rounded-md bg-paper px-4 py-2 text-sm text-fg shadow-border">
              Drop pictures or video onto the page
            </p>
          </div>
        ) : null}
      </article>

      <input
        ref={fileRef}
        type="file"
        className="hidden"
        accept="image/*,video/*"
        multiple
        onChange={(e) => {
          void onFiles([...(e.target.files ?? [])]);
          e.target.value = "";
        }}
      />

      <TtsBar
        status={ttsStatus}
        rate={rate}
        voiceName={voiceName}
        onPause={() => tts.pause()}
        onResume={() => tts.resume()}
        onStop={() => tts.stop()}
        onRate={(next) => {
          setRate(next);
          tts.setRate(next);
        }}
      />

      <KeyboardShortcutsHelp open={helpOpen} onOpenChange={setHelpOpen} />
    </div>
  );
}
