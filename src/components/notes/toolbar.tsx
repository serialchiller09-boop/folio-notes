import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Heading1,
  Heading2,
  ImagePlus,
  Italic,
  Type,
  Underline,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import type { Align, FontSize, TextBlock, TextRole } from "@/lib/notes/types";
import { cn } from "@/lib/utils";

function Tool({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onMouseDown={(e) => e.preventDefault()}
          onClick={onClick}
          aria-label={label}
          className={cn(active && "bg-fg/8 text-fg")}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export function FormatToolbar({
  text,
  onCommand,
  onRole,
  onAlign,
  onSize,
  onInsertImage,
  onInsertVideo,
}: {
  text: TextBlock | null;
  onCommand: (cmd: string) => void;
  onRole: (role: TextRole) => void;
  onAlign: (align: Align) => void;
  onSize: (size: FontSize) => void;
  onInsertImage: () => void;
  onInsertVideo: () => void;
}) {
  return (
    <div className="min-w-0 overflow-x-auto">
      <div className="flex w-max items-center gap-0.5 pr-2">
      <Tool label="Bold" onClick={() => onCommand("bold")}>
        <Bold />
      </Tool>
      <Tool label="Italic" onClick={() => onCommand("italic")}>
        <Italic />
      </Tool>
      <Tool label="Underline" onClick={() => onCommand("underline")}>
        <Underline />
      </Tool>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <DropdownMenu>
        <Tooltip>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onMouseDown={(e) => e.preventDefault()}
                aria-label="Heading"
              >
                {text?.role === "h1" ? <Heading1 /> : text?.role === "h2" ? <Heading2 /> : <Type />}
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent>Style</TooltipContent>
        </Tooltip>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onRole("paragraph")}>Paragraph</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onRole("h1")}>Heading 1</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onRole("h2")}>Heading 2</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onRole("h3")}>Heading 3</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            className="px-2 text-xs"
          >
            {text?.fontSize === "sm" ? "S" : text?.fontSize === "lg" ? "L" : text?.fontSize === "xl" ? "XL" : "M"}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onSelect={() => onSize("sm")}>Small</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onSize("md")}>Medium</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onSize("lg")}>Large</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => onSize("xl")}>Extra large</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Tool label="Align left" onClick={() => onAlign("left")} active={text?.align === "left"}>
        <AlignLeft />
      </Tool>
      <Tool label="Align center" onClick={() => onAlign("center")} active={text?.align === "center"}>
        <AlignCenter />
      </Tool>
      <Tool label="Align right" onClick={() => onAlign("right")} active={text?.align === "right"}>
        <AlignRight />
      </Tool>
      <Separator orientation="vertical" className="mx-1 h-6" />
      <Tool label="Insert image" onClick={onInsertImage}>
        <ImagePlus />
      </Tool>
      <Tool label="Insert video" onClick={onInsertVideo}>
        <Video />
      </Tool>
      </div>
    </div>
  );
}
