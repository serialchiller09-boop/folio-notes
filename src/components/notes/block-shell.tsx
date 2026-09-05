import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BlockShell({
  selected,
  speaking,
  onSelect,
  onRemove,
  canRemove,
  children,
}: {
  selected: boolean;
  speaking?: boolean;
  onSelect: () => void;
  onRemove: () => void;
  canRemove?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        "group/block relative",
        speaking && "rounded-sm bg-highlight",
      )}
    >
      {children}
      {canRemove ? (
        <div
          className={cn(
            "absolute -right-1 top-1 opacity-0 transition-opacity group-hover/block:opacity-100",
            selected && "opacity-100",
          )}
        >
          <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove from story" onClick={onRemove}>
            <Trash2 />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
