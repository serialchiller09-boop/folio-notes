import { createFileRoute } from "@tanstack/react-router";
import { NoteEditor } from "@/components/notes/editor";
import { StoryPlayer } from "@/components/notes/story-player";

type NoteSearch = {
  view?: "write" | "read";
};

export const Route = createFileRoute("/note/$noteId")({
  validateSearch: (search: Record<string, unknown>): NoteSearch => ({
    view: search.view === "read" ? "read" : "write",
  }),
  component: NotePage,
});

function NotePage() {
  const { noteId } = Route.useParams();
  const { view } = Route.useSearch();
  if (view === "read") return <StoryPlayer noteId={noteId} />;
  return <NoteEditor noteId={noteId} />;
}
