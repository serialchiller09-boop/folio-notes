# Folio

A novel with cinematic evidence. Write one continuous story. Photographs and videos sit inside the prose. Read it like a book.

## What it does

- Continuous document editor — type, insert a photo or video at the cursor, keep writing
- Story reader — scroll from beginning to end. No pages. No Next
- Chapters as landmarks inside the same story
- Inline photographs (tap to examine) and video
- Autosave to IndexedDB on this device
- Search, rename, duplicate, delete, pin
- Export the current story as Markdown (`.md`)
- Listen to Story — text-to-speech follows the prose

## Write. Insert. Keep writing.

Place the cursor in a paragraph, insert a photograph or video, and continue typing immediately after it. Blocks are an implementation detail. The story is one piece of writing.

## Scroll. Read. Watch. Read.

**Read** opens StoryPlayer: a continuous vertical story. Text, photographs, videos, and chapter headings appear in order. Stop anywhere. Scroll back. Replay a clip. Listen if you want — audio is an enhancement, not the structure.

## Local development

```bash
npm install
npm run dev
```

Stories and media stay in the browser. Deleting a story removes its unused media.
