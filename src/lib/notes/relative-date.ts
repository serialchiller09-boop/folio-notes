import { isToday, isYesterday, startOfWeek } from "date-fns";
import type { Note } from "./types";

export type RelativeDateGroupId = "today" | "yesterday" | "earlier-this-week" | "older";

export type RelativeDateGroup = {
  id: RelativeDateGroupId;
  label: string;
  notes: Note[];
};

const GROUP_ORDER: RelativeDateGroupId[] = ["today", "yesterday", "earlier-this-week", "older"];

const GROUP_LABELS: Record<RelativeDateGroupId, string> = {
  today: "Today",
  yesterday: "Yesterday",
  "earlier-this-week": "Earlier this week",
  older: "Older",
};

/** Classify a note's `updatedAt` into a home-list section. Week starts Monday. */
export function relativeDateGroupId(updatedAt: number, now: Date = new Date()): RelativeDateGroupId {
  const date = new Date(updatedAt);
  if (isToday(date)) return "today";
  if (isYesterday(date)) return "yesterday";
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  if (date >= weekStart) return "earlier-this-week";
  return "older";
}

/** Partition notes into Today / Yesterday / Earlier this week / Older, preserving input order. */
export function groupNotesByRelativeDate(notes: Note[], now: Date = new Date()): RelativeDateGroup[] {
  const buckets: Record<RelativeDateGroupId, Note[]> = {
    today: [],
    yesterday: [],
    "earlier-this-week": [],
    older: [],
  };

  for (const note of notes) {
    buckets[relativeDateGroupId(note.updatedAt, now)].push(note);
  }

  return GROUP_ORDER.filter((id) => buckets[id].length > 0).map((id) => ({
    id,
    label: GROUP_LABELS[id],
    notes: buckets[id],
  }));
}
