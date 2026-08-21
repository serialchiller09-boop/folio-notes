import { createFileRoute } from "@tanstack/react-router";
import { NoteEditor } from "@/components/notes/editor";

export const Route = createFileRoute("/note/$noteId")({
  component: NotePage,
});

function NotePage() {
  const { noteId } = Route.useParams();
  return <NoteEditor noteId={noteId} />;
}
