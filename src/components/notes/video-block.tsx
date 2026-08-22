import { useEffect, useRef, useState } from "react";
import { Maximize2, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { ResizableMedia } from "@/components/notes/image-block";
import { useMediaUrl } from "@/hooks/use-media-url";
import type { VideoBlock as VideoBlockType } from "@/lib/notes/types";
import { cn } from "@/lib/utils";

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function VideoBlockView({
  block,
  selected,
  onWidth,
}: {
  block: VideoBlockType;
  selected: boolean;
  onWidth: (width: number) => void;
}) {
  const src = useMediaUrl(block.mediaId);
  const poster = useMediaUrl(block.posterMediaId);
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(0);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [show, setShow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = muted;
  }, [volume, muted]);

  // When the blob URL arrives, force a load so mobile WebViews pick up metadata
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;
    setError(null);
    setReady(false);
    setDuration(0);
    setCurrent(0);
    setPlaying(false);
    video.src = src;
    try {
      video.load();
    } catch {
      // ignore
    }
  }, [src]);

  useEffect(() => {
    if (!playing) {
      setShow(true);
      return;
    }
    const t = window.setTimeout(() => setShow(false), 1800);
    return () => window.clearTimeout(t);
  }, [playing, current, show]);

  function syncDuration(video: HTMLVideoElement) {
    const d = video.duration;
    if (Number.isFinite(d) && d > 0) {
      setDuration(d);
      setReady(true);
    }
  }

  async function togglePlay() {
    const video = videoRef.current;
    if (!video || error) return;
    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch {
      setError("Playback failed. Try an MP4 (H.264) file.");
    }
  }

  async function fullscreen() {
    const node = wrapRef.current;
    const video = videoRef.current as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    try {
      if (node?.requestFullscreen) await node.requestFullscreen();
      else video?.webkitEnterFullscreen?.();
    } catch {
      video?.webkitEnterFullscreen?.();
    }
  }

  return (
    <>
      <ResizableMedia width={block.width} onWidth={onWidth} selected={selected}>
        <div
          ref={wrapRef}
          className="relative overflow-hidden rounded-md bg-fg"
          onMouseMove={() => setShow(true)}
          onPointerDown={() => setShow(true)}
        >
          <video
            ref={videoRef}
            poster={poster || undefined}
            playsInline
            preload="auto"
            className="media-frame max-h-[70vh] w-full bg-fg"
            onClick={(e) => {
              e.stopPropagation();
              void togglePlay();
            }}
            onPlay={() => setPlaying(true)}
            onPause={() => setPlaying(false)}
            onTimeUpdate={(e) => setCurrent(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => syncDuration(e.currentTarget)}
            onDurationChange={(e) => syncDuration(e.currentTarget)}
            onLoadedData={(e) => {
              syncDuration(e.currentTarget);
              setReady(true);
            }}
            onCanPlay={(e) => {
              syncDuration(e.currentTarget);
              setReady(true);
            }}
            onError={() => {
              setError("This video can't play here. Use an MP4 encoded with H.264.");
              setReady(false);
              setDuration(0);
            }}
          />

          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-fg/90 px-4 text-center">
              <p className="text-sm text-bg">{error}</p>
              <p className="text-xs text-bg/70">Phone camera clips are often HEVC and won't play in the browser.</p>
            </div>
          ) : !src || (!ready && !poster) ? (
            <div className="absolute inset-0 flex items-center justify-center bg-fg/80">
              <p className="text-sm text-bg/80">{src ? "Loading video…" : "Preparing video…"}</p>
            </div>
          ) : null}

          {!error ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void togglePlay();
              }}
              className={cn(
                "absolute inset-0 flex items-center justify-center transition-opacity duration-200",
                playing && !show ? "opacity-0" : "opacity-100",
              )}
              aria-label={playing ? "Pause" : "Play"}
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-fg/75 text-bg shadow-border">
                {playing ? <Pause className="size-6" /> : <Play className="size-6 translate-x-0.5" />}
              </span>
            </button>
          ) : null}

          {!error ? (
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 from-fg/80 to-transparent bg-gradient-to-t px-3 pb-3 pt-8 text-bg transition-opacity duration-200",
                playing && !show ? "opacity-0" : "opacity-100",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="range"
                min={0}
                max={duration > 0 ? duration : 1}
                step={0.05}
                value={current}
                disabled={duration <= 0}
                onChange={(e) => {
                  const next = Number(e.target.value);
                  if (videoRef.current) videoRef.current.currentTime = next;
                  setCurrent(next);
                }}
                className="folio-range w-full"
                aria-label="Seek"
              />
              <div className="mt-2 flex items-center gap-2 text-xs tabular-nums">
                <button
                  type="button"
                  className="flex size-9 items-center justify-center rounded-sm hover:bg-bg/15"
                  onClick={() => void togglePlay()}
                  aria-label={playing ? "Pause" : "Play"}
                >
                  {playing ? <Pause className="size-4" /> : <Play className="size-4 translate-x-px" />}
                </button>
                <span>
                  {formatTime(current)} / {formatTime(duration)}
                </span>
                <button
                  type="button"
                  className="ml-1 flex size-9 items-center justify-center rounded-sm hover:bg-bg/15"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? "Unmute" : "Mute"}
                >
                  {muted || volume === 0 ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={muted ? 0 : volume}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setVolume(v);
                    setMuted(v === 0);
                  }}
                  className="folio-range hidden w-20 sm:block"
                  aria-label="Volume"
                />
                <button
                  type="button"
                  className="ml-auto flex size-9 items-center justify-center rounded-sm hover:bg-bg/15"
                  onClick={() => void fullscreen()}
                  aria-label="Full screen"
                >
                  <Maximize2 className="size-4" />
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </ResizableMedia>
    </>
  );
}
