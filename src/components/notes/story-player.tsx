import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, Pencil, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ImageBlockView } from "@/components/notes/image-block";
import { VideoBlockView } from "@/components/notes/video-block";
import { TtsBar } from "@/components/notes/tts-bar";
import { ThemeToggle } from "@/components/notes/theme-toggle";
import { isEmptyHtml, stripHtml } from "@/lib/notes/html";
import { useNotesStore } from "@/lib/notes/store";
import { pickEnglishFemaleVoice, tts, type TtsStatus } from "@/lib/notes/tts";
import type { Block, FontSize, TextRole } from "@/lib/notes/types";
import { cn } from "@/lib/utils";

const roleClass: Record<TextRole, string> = {
  paragraph: "font-serif font-normal",
  h1: "folio-chapter font-serif text-3xl font-medium tracking-tight sm:text-4xl",
  h2: "font-serif text-2xl font-medium tracking-tight",
  h3: "font-serif text-xl font-medium",
};

const sizeClass: Record<FontSize, string> = {
  sm: "text-base leading-relaxed",
  md: "text-lg leading-relaxed",
  lg: "text-xl leading-relaxed",
  xl: "text-2xl leading-relaxed",
};

const alignClass = {
  left: "text-left",
  center: "text-center",
  right: "text-right",
} as const;

function ReadText({
  block,
  speaking,
}: {
  block: Extract<Block, { type: "text" }>;
  speaking: boolean;
}) {
  if (isEmptyHtml(block.html)) return null;
  return (
    <div
      id={`block-${block.id}`}
      className={cn(
        "w-full px-1 py-1 text-fg",
        block.role === "paragraph" ? sizeClass[block.fontSize] : roleClass[block.role],
        block.role !== "paragraph" && "leading-snug",
        alignClass[block.align],
        speaking && "rounded-sm bg-highlight",
      )}
      dangerouslySetInnerHTML={{ __html: block.html || "" }}
    />
  );
}

export function StoryPlayer({ noteId }: { noteId: string }) {
  const hydrate = useNotesStore((s) => s.hydrate);
  const ready = useNotesStore((s) => s.ready);
  const notes = useNotesStore((s) => s.notes);
  const note = notes.find((item) => item.id === noteId);

  const [ttsStatus, setTtsStatus] = useState<TtsStatus>("idle");
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [rate, setRate] = useState(1);
  const [voiceName, setVoiceName] = useState("");

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
    const queue = note.blocks
      .filter((block): block is Extract<Block, { type: "text" }> => block.type === "text")
      .map((block) => ({ id: block.id, text: stripHtml(block.html) }))
      .filter((item) => item.text.length > 0);
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
    return <main className="flex min-h-dvh items-center justify-center text-sm text-muted">Opening story…</main>;
  }

  if (!note) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="font-serif text-2xl">This story is gone</p>
        <Button asChild variant="secondary">
          <Link to="/">Back to library</Link>
        </Button>
      </main>
    );
  }

  return (
    <div className="min-h-dvh bg-bg pb-24">
      <header className="sticky top-0 z-20 border-b border-border bg-bg/92">
        <div className="mx-auto flex max-w-3xl items-center gap-1 px-2 py-2">
          <Button asChild variant="ghost" size="icon-sm" aria-label="Back to library">
            <Link to="/">
              <ChevronLeft />
            </Link>
          </Button>
          <p className="min-w-0 flex-1 truncate font-serif text-lg font-medium tracking-tight text-fg">
            {note.title || "Untitled"}
          </p>
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm">
            <Link to="/note/$noteId" params={{ noteId }} search={{ view: "write" }}>
              <Pencil />
              <span className="hidden sm:inline">Write</span>
            </Link>
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={listen}>
            <Volume2 />
            <span className="hidden sm:inline">
              {ttsStatus === "playing" ? "Pause" : ttsStatus === "paused" ? "Resume" : "Listen to Story"}
            </span>
          </Button>
        </div>
      </header>

      <article className="folio-doc folio-reader mx-auto my-4 max-w-3xl px-5 py-10 sm:my-10 sm:px-12 sm:py-16">
        <h1 className="mb-10 font-serif text-4xl font-medium tracking-tight text-fg sm:text-5xl">
          {note.title || "Untitled"}
        </h1>
        {note.blocks.map((block) =>
          block.type === "text" ? (
            <ReadText key={block.id} block={block} speaking={speakingId === block.id} />
          ) : block.type === "image" ? (
            <figure key={block.id} id={`block-${block.id}`} className="folio-evidence my-8">
              <ImageBlockView block={block} selected={false} readOnly onWidth={() => undefined} />
            </figure>
          ) : (
            <figure key={block.id} id={`block-${block.id}`} className="folio-evidence my-8">
              <VideoBlockView block={block} selected={false} readOnly onWidth={() => undefined} />
            </figure>
          ),
        )}
      </article>

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
    </div>
  );
}
