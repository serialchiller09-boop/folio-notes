import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export type ShortcutRow = {
  action: string;
  keys: string;
};

const DEFAULT_SHORTCUTS: ShortcutRow[] = [
  { action: "Bold", keys: "⌘/Ctrl + B" },
  { action: "Italic", keys: "⌘/Ctrl + I" },
  { action: "Underline", keys: "⌘/Ctrl + U" },
  { action: "Save now", keys: "⌘/Ctrl + S" },
  { action: "Export Markdown", keys: "⌘/Ctrl + Shift + E" },
  { action: "Keyboard shortcuts", keys: "? or ⌘/Ctrl + /" },
];

export function KeyboardShortcutsHelp({
  open,
  onOpenChange,
  shortcuts = DEFAULT_SHORTCUTS,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts?: ShortcutRow[];
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(94vw,380px)] p-5" showClose>
        <DialogTitle className="pr-8">Keyboard shortcuts</DialogTitle>
        <ul className="mt-4 space-y-2">
          {shortcuts.map((row) => (
            <li key={row.action} className="flex items-center justify-between gap-4 text-sm">
              <span className="text-muted">{row.action}</span>
              <kbd className="rounded-md bg-surface px-2 py-1 font-sans text-xs text-fg shadow-border">
                {row.keys}
              </kbd>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

/** True when the event target is an editable field (skip bare `?` there). */
export function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  return target.isContentEditable;
}
