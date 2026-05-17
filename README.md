# 🎬 Subscraft AI

AI-powered subtitle generator for videos — built with Next.js 14.

## ✨ Features

- 🎙 Live speech recognition (Browser Speech API — free)
- 📝 Word-by-word, karaoke, typewriter, fade, pop, bounce animations
- 🌍 16+ languages including Hinglish
- ✥ Free subtitle positioning — drag on video
- ✏️ Professional subtitle editor (add, split, merge, reorder)
- 🎬 Preview with sync editor & offset control
- ⬇ Export SRT, VTT, TXT
- 🔥 Render & download MP4 with burned subtitles
- 🎨 Full style customisation — font, color, size, stroke

## 🚀 Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

> **Note:** Speech recognition requires **Google Chrome**

## 🛠 Tech Stack

- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- Web Speech API
- ffmpeg.wasm
- Canvas API + MediaRecorder

## 📦 Export Formats

| Format | Use case |
|--------|----------|
| SRT | YouTube, VLC, Premiere |
| VTT | Web players, HTML5 |
| TXT | Transcript only |
| MP4 | Burned subtitles |

## 🎯 How to Use

1. Upload a video file
2. Select language + words per segment
3. Click **Start Subtitling** and play the video
4. Edit subtitles in the **Subs** tab
5. Customise style in the **Style** tab
6. Preview & sync in the **Preview** tab
7. Export or burn in **Export** / **Burn** tabs

## 📝 License

MIT
