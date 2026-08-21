import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { FontSize, TextBlock as TextBlockType, TextRole } from "@/lib/notes/types";

const roleClass: Record<TextRole, string> = {
  paragraph: "font-serif font-normal",
  h1: "font-serif text-3xl font-medium tracking-tight sm:text-4xl",
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

export function TextBlockView({
  block,
  onChange,
  onFocus,
  onKeyDown,
}: {
  block: TextBlockType;
  onChange: (html: string) => void;
  onFocus: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLDivElement>) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (document.activeElement === el) return;
    if (el.innerHTML !== (block.html || "")) {
      el.innerHTML = block.html || "";
    }
  }, [block.html, block.id]);

  return (
    <div
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      role="textbox"
      aria-label={block.role === "paragraph" ? "Paragraph" : `Heading ${block.role}`}
      data-placeholder={block.role === "paragraph" ? "Start writing…" : "Heading"}
      onFocus={onFocus}
      onInput={() => onChange(ref.current?.innerHTML ?? "")}
      onKeyDown={onKeyDown}
      spellCheck
      className={cn(
        "min-h-8 w-full px-2 py-1 text-fg",
        block.role === "paragraph" ? sizeClass[block.fontSize] : roleClass[block.role],
        block.role !== "paragraph" && "leading-snug",
        alignClass[block.align],
      )}
    />
  );
}
