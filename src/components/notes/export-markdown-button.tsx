import { Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadNoteMarkdown } from "@/lib/notes/markdown";
import type { Note } from "@/lib/notes/types";

export function ExportMarkdownButton({ note }: { note: Note }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="Export as Markdown"
      onClick={() => {
        downloadNoteMarkdown(note);
        toast("Markdown downloaded");
      }}
    >
      <Download />
      <span className="hidden sm:inline">Export</span>
    </Button>
  );
}
