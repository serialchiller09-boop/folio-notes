import { nid } from "@/lib/utils";
import { fetchAsFile, putFile } from "./media";
import { emptyTextBlock, type Note } from "./types";

async function safeMedia(path: string, name: string, mime: string) {
  try {
    const file = await fetchAsFile(path, name, mime);
    return putFile(file);
  } catch {
    return null;
  }
}

export async function buildSeedNotes(): Promise<Note[]> {
  const now = Date.now();
  const [desk, lane, pen, pages] = await Promise.all([
    safeMedia("/samples/desk.jpg", "desk.jpg", "image/jpeg"),
    safeMedia("/samples/lane.jpg", "lane.jpg", "image/jpeg"),
    safeMedia("/samples/pen.jpg", "pen.jpg", "image/jpeg"),
    safeMedia("/samples/pages.mp4", "pages.mp4", "video/mp4"),
  ]);

  const welcome: Note = {
    id: nid("n"),
    title: "Welcome to Folio",
    createdAt: now - 1000 * 60 * 60 * 8,
    updatedAt: now - 1000 * 60 * 12,
    thumbnailMediaId: desk?.id ?? null,
    blocks: [
      emptyTextBlock({
        role: "h1",
        fontSize: "xl",
        html: "A notebook that holds more than words",
      }),
      emptyTextBlock({
        html: "Folio is a continuous page for writing, pictures, and video. There are no pages to flip and no project to assemble. Open a note, type, paste an image, drop a clip, keep going.",
      }),
      ...(desk
        ? [
            {
              id: nid("b"),
              type: "image" as const,
              mediaId: desk.id,
              width: 100,
              alt: "Open notebook on a walnut desk beside a film camera",
            },
          ]
        : []),
      emptyTextBlock({
        html: "Images sit in the flow of the text. Tap one to view it larger. Drag the corner to resize. Replace or remove it from the block menu.",
      }),
      emptyTextBlock({
        role: "h2",
        html: "Video belongs on the page",
      }),
      emptyTextBlock({
        html: "A clip is not an attachment hiding in a gallery. It plays right here, between paragraphs, with a poster, a seek bar, volume, and fullscreen.",
      }),
      ...(pages
        ? [
            {
              id: nid("b"),
              type: "video" as const,
              mediaId: pages.id,
              width: 100,
              posterMediaId: desk?.id,
            },
          ]
        : []),
      emptyTextBlock({
        role: "h2",
        html: "Listen back",
      }),
      emptyTextBlock({
        html: "Press Listen to hear the note in a clear English voice. Playback starts from the paragraph you are in, skips pictures and video, and highlights the line being read. Adjust the speed from the bar at the bottom.",
      }),
      emptyTextBlock({
        role: "h2",
        html: "A few things to try",
      }),
      emptyTextBlock({
        html: "Paste a photo from the clipboard. Drop a video file onto this page. Select a sentence and mark it bold. Rename the note from the title. Duplicate it from the home screen if you want a spare.",
      }),
      emptyTextBlock({
        html: "Everything saves as you write.",
      }),
    ],
  };

  const story: Note = {
    id: nid("n"),
    title: "The lane at dusk",
    createdAt: now - 1000 * 60 * 60 * 26,
    updatedAt: now - 1000 * 60 * 50,
    thumbnailMediaId: lane?.id ?? null,
    blocks: [
      emptyTextBlock({
        role: "h1",
        fontSize: "xl",
        html: "The lane at dusk",
      }),
      emptyTextBlock({
        html: "The cobbles held the last of the rain. Hedgerows closed over the path until the cottage window was the only warm thing left in the county, a square of amber that made the fog look thicker rather than thinner.",
      }),
      ...(lane
        ? [
            {
              id: nid("b"),
              type: "image" as const,
              mediaId: lane.id,
              width: 100,
              alt: "Foggy English lane at dusk with a distant cottage window",
            },
          ]
        : []),
      emptyTextBlock({
        html: "I had meant to turn back at the stile. Instead I kept the window in front of me, counting the seconds between the drip from the blackthorn and the next, as if the lane itself were keeping time.",
      }),
      emptyTextBlock({
        html: "Someone had been writing at that table. The lamp was still on. A pen lay across a page that had not yet dried.",
      }),
      ...(pen
        ? [
            {
              id: nid("b"),
              type: "image" as const,
              mediaId: pen.id,
              width: 88,
              alt: "Fountain pen resting on wet ink",
            },
          ]
        : []),
      emptyTextBlock({
        html: "I did not knock. I stood in the wet and listened to the house settle, and I thought about the sentence that had been left unfinished, the one that would not wait until morning.",
      }),
    ],
  };

  return [welcome, story];
}
