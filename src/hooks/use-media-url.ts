import { useEffect, useState } from "react";
import { getMediaUrl } from "@/lib/notes/media";

export function useMediaUrl(mediaId?: string | null) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!mediaId) {
      setUrl("");
      return;
    }
    let cancelled = false;
    void getMediaUrl(mediaId).then((next) => {
      if (!cancelled) setUrl(next);
    });
    return () => {
      cancelled = true;
    };
  }, [mediaId]);

  return url;
}
