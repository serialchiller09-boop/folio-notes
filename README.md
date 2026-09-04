# Folio

A quiet multimedia notebook for writing, pictures, and video. Notes are one continuous page — text, images, and clips sit in the same flow. Playback and text-to-speech stay on the page.

## What it does

- Continuous document editor (no pages)
- Basic formatting: bold, italic, underline, headings, size, alignment
- Insert or paste images and videos
- Inline video player with poster, seek, volume, and fullscreen
- Autosave to IndexedDB on this device
- Search, rename, duplicate, delete
- Export the current note as Markdown (`.md`) — text keeps bold/italic structure; images and video become local placeholders
- Text-to-speech with a preferred English female voice, play/pause, speed, and paragraph highlight

## What's new

- **Markdown export** — From an open note, use **Export** in the header to download a `.md` file of the title and body. Handy for backups or pasting into other apps. Embedded pictures and clips are referenced as `folio-media:` placeholders (media stays on this device in IndexedDB).
- **Paste polish** — Pasting a screenshot or clipboard image now also checks clipboard items (not only the Files list), and shows a short confirmation toast.
- **Search matching** — Note search now strips HTML the same way previews do, so queries match visible text more reliably.

## Local development

```bash
npm install
npm run dev
```

Notes and media stay in the browser. Deleting a note removes its unused media.
