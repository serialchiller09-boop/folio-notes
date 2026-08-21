import { ArrowDown, ArrowUp, GripVertical, MoreHorizontal, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function BlockShell({
  selected,
  speaking,
  onSelect,
  onMove,
  onRemove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  dragging,
  dropTarget,
  extraMenu,
  children,
}: {
  selected: boolean;
  speaking?: boolean;
  onSelect: () => void;
  onMove: (dir: -1 | 1) => void;
  onRemove: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  dragging?: boolean;
  dropTarget?: boolean;
  extraMenu?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      onClick={onSelect}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={cn(
        "group/block relative rounded-lg px-1 py-1 transition-colors",
        selected && "bg-fg/4",
        speaking && "bg-highlight",
        dragging && "opacity-40",
        dropTarget && "before:absolute before:inset-x-3 before:-top-px before:h-0.5 before:bg-accent",
      )}
    >
      <button
        type="button"
        draggable
        aria-label="Move block"
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        className="absolute -left-7 top-1 hidden size-8 items-center justify-center rounded-sm text-subtle hover:bg-fg/6 hover:text-fg sm:flex sm:opacity-0 sm:group-hover/block:opacity-100"
      >
        <GripVertical className="size-4" />
      </button>
      {children}
      <div
        className={cn(
          "absolute -right-2 top-0 opacity-0 group-hover/block:opacity-100",
          selected && "opacity-100",
        )}
      >
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Block actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onMove(-1)}>
              <ArrowUp className="size-4" />
              Move up
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onMove(1)}>
              <ArrowDown className="size-4" />
              Move down
            </DropdownMenuItem>
            {extraMenu}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onSelect={onRemove}>
              <Trash2 className="size-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
