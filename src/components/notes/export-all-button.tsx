import { Archive } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadAllNotesMarkdown } from "@/lib/notes/markdown";
import type { Note } from "@/lib/notes/types";

export function ExportAllButton({ notes }: { notes: Note[] }) {
  const disabled = notes.length === 0;

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      disabled={disabled}
      aria-label="Export all notes as Markdown ZIP"
      title={disabled ? "No notes to export" : "Export all as Markdown ZIP"}
      onClick={() => {
        if (!notes.length) return;
        downloadAllNotesMarkdown(notes);
        toast(
          notes.length === 1
            ? "Downloaded 1 note as ZIP"
            : `Downloaded ${notes.length} notes as ZIP`,
        );
      }}
    >
      <Archive />
    </Button>
  );
}
