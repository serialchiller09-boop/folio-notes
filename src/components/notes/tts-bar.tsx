import { Pause, Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { TtsStatus } from "@/lib/notes/tts";

export function TtsBar({
  status,
  rate,
  voiceName,
  onPause,
  onResume,
  onStop,
  onRate,
}: {
  status: TtsStatus;
  rate: number;
  voiceName: string;
  onPause: () => void;
  onResume: () => void;
  onStop: () => void;
  onRate: (rate: number) => void;
}) {
  if (status === "idle") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-paper/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-3xl items-center gap-3">
        {status === "playing" ? (
          <Button type="button" variant="secondary" size="icon-sm" onClick={onPause} aria-label="Pause reading">
            <Pause />
          </Button>
        ) : (
          <Button type="button" variant="secondary" size="icon-sm" onClick={onResume} aria-label="Resume reading">
            <Play />
          </Button>
        )}
        <Button type="button" variant="ghost" size="icon-sm" onClick={onStop} aria-label="Stop reading">
          <Square className="size-3.5" />
        </Button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-fg">{status === "paused" ? "Paused" : "Reading"}</p>
          <p className="truncate text-xs text-muted">{voiceName || "English"}</p>
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          Speed
          <input
            type="range"
            min={0.7}
            max={1.5}
            step={0.05}
            value={rate}
            onChange={(e) => onRate(Number(e.target.value))}
            className="folio-range w-24"
            aria-label="Speaking speed"
          />
          <span className="w-8 tabular-nums text-fg">{rate.toFixed(2).replace(/0$/, "")}x</span>
        </label>
      </div>
    </div>
  );
}
