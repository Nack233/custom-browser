---
name: media-stream-sniffer
description: >-
  Use this skill when the user requests to support sniffing or downloading videos, audio, or streams from new platforms (like HLS/m3u8, MP4, DASH, YouTube, or anime/manga sites).
---

# Media Stream Sniffer & Extractor Skill

This skill guides the agent through adding and debugging media capture logic in Bocchy Browser's `MediaSniffer` engine.

---

## 🎯 Architectural Overview

Media capture in Bocchy operates in two cooperative pipelines:
1. **Network Sniffer (`src/main/mediaSniffer.ts`):** Listens on `onHeadersReceived` to intercept streaming segments, audio streams, and direct media files before they finish downloading.
2. **DOM Extractor (`extractFromDom`):** Injected script that queries HTML5 `<video>`, `<audio>`, embedded player iframes, and poster images.

---

## 🛠️ Step 1: Extending the Network Sniffer

In `src/main/mediaSniffer.ts`:

1. **Keep Early-Returns Fast (CPU Protection):**
   * Only proceed if HTTP `content-type` matches:
     ```typescript
     const isMedia =
       contentType.startsWith('video/') ||
       contentType.startsWith('audio/') ||
       contentType.includes('mpegurl') ||
       contentType.includes('octet-stream');
     ```
   * Never process HTML, CSS, JS, JSON, or font payloads.

2. **Stream Formats Handling:**
   * **HLS (`.m3u8`):** Capture master playlist (`#EXTM3U`). Label quality (1080p, 720p) from bandwidth attributes if present.
   * **Direct MP4 / WebM:** Intercept headers, grab `content-length` for file size estimation.
   * **Chunked Blob / Segment URLs:** Identify base URL and filter out miniature sub-chunks (e.g. `< 50KB` audio pings).

---

## 🌐 Step 2: Extending DOM Extractor (`extractFromDom`)

If the website hides stream URLs inside a custom JavaScript player:
1. Locate the video instance:
   ```javascript
   const video = document.querySelector('video');
   const src = video?.currentSrc || video?.src;
   ```
2. Check for custom player instances:
   * YouTube: `document.getElementById('movie_player')`
   * JWPlayer: `window.jwplayer?.()`
   * VideoJS: `window.videojs?.()`
3. Extract title from `document.title`, `meta[property="og:title"]`, or `<h1>` heading.

---

## 📦 Step 3: Packaging & Downloader Pipeline

* Single media: Stream directly to disk via `src/main/downloadManager.ts`.
* Multiple images/manga chapters: Bundle into `.zip` using `JSZip` in memory and save as a unified download.

---

## 🧪 Step 4: Verification

1. Run compiler check:
   ```bash
   npm run build
   ```
2. Verify CPU remains minimal (< 2% idle) while watching YouTube or streaming media.
