import { stripHtml } from "./html";
import type { Note } from "./types";
import { buildZip } from "./zip";

/** Convert a text block's HTML to lightweight Markdown inline markup. */
function inlineMarkdown(html: string): string {
  if (typeof DOMParser === "undefined") return stripHtml(html);
  const doc = new DOMParser().parseFromString(html, "text/html");

  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as HTMLElement;
    const tag = el.tagName;
    const inner = [...el.childNodes].map(walk).join("");
    if (tag === "BR") return "\n";
    if (tag === "B" || tag === "STRONG") return inner ? `**${inner}**` : "";
    if (tag === "I" || tag === "EM") return inner ? `*${inner}*` : "";
    if (tag === "U") return inner;
    return inner;
  };

  return [...doc.body.childNodes]
    .map(walk)
    .join("")
    .replace(/\u00a0/g, " ")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function headingPrefix(role: "h1" | "h2" | "h3"): string {
  if (role === "h1") return "# ";
  if (role === "h2") return "## ";
  return "### ";
}

/** Serialize a Folio note to Markdown. Local media becomes placeholders. */
export function noteToMarkdown(note: Note): string {
  const lines: string[] = [];
  const title = note.title.trim() || "Untitled";
  lines.push(`# ${title}`, "");

  for (const block of note.blocks) {
    if (block.type === "text") {
      if (block.role === "paragraph") {
        const text = inlineMarkdown(block.html);
        if (!text) continue;
        lines.push(text, "");
      } else {
        const text = stripHtml(block.html);
        if (!text) continue;
        lines.push(`${headingPrefix(block.role)}${text}`, "");
      }
      continue;
    }

    if (block.type === "image") {
      const alt = (block.alt || "Image").replace(/\]/g, "\\]");
      lines.push(`![${alt}](folio-media:${block.mediaId})`, "");
      continue;
    }

    lines.push(`*[Video attached — folio-media:${block.mediaId}]*`, "");
  }

  return `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`;
}

function slugifyFilename(title: string): string {
  const slug = title
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "untitled";
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Download the current note as a `.md` file in the browser. */
export function downloadNoteMarkdown(note: Note): void {
  const markdown = noteToMarkdown(note);
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  triggerDownload(blob, `${slugifyFilename(note.title)}.md`);
}

/** Unique `.md` filenames for a batch export (title collisions get -2, -3, …). */
export function uniqueMarkdownFilenames(notes: Note[]): string[] {
  const used = new Map<string, number>();
  return notes.map((note) => {
    const base = slugifyFilename(note.title);
    const count = (used.get(base) ?? 0) + 1;
    used.set(base, count);
    return count === 1 ? `${base}.md` : `${base}-${count}.md`;
  });
}

function zipStamp(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Download every note as Markdown files inside a ZIP archive. */
export function downloadAllNotesMarkdown(notes: Note[]): void {
  if (!notes.length) return;
  const encoder = new TextEncoder();
  const names = uniqueMarkdownFilenames(notes);
  const entries = notes.map((note, i) => ({
    name: names[i]!,
    data: encoder.encode(noteToMarkdown(note)),
    modifiedAt: new Date(note.updatedAt),
  }));
  const blob = buildZip(entries);
  triggerDownload(blob, `folio-notes-${zipStamp()}.zip`);
}
