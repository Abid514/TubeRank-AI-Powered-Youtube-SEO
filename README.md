# TubeRank — Turn Long YouTube Videos into Viral Short Clips

> AI-powered clip detection for TikTok, Instagram Reels, and YouTube Shorts.

## What it does

TubeRank analyzes any public YouTube long-form video and automatically surfaces the moments most likely to perform well as short-form content. Paste a URL, get a ranked list of clips, then download the ones you want.

## Features

- **AI clip detection** — finds strong hooks, engaging body segments, punchlines, emotional peaks, and clear CTAs
- **Platform modes** — optimize for TikTok, Instagram Reels, or YouTube Shorts
- **Viral scoring** — each clip gets a score based on hook strength, engagement, shareability, and platform fit
- **Auto captions & hashtags** — one-click copy for posts
- **Multiple clip options** — generate several candidates from a single video
- **One-click export** — download trimmed clips in high quality

## Tech stack

- [TanStack Start](https://tanstack.com/start) — full-stack React framework
- [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS v4](https://tailwindcss.com/) — styling
- [shadcn/ui](https://ui.shadcn.com/) — UI components
- [Supabase](https://supabase.com/) — backend, auth, and storage
- [youtube-transcript](https://github.com/Kakulukian/youtube-transcript) — transcript extraction

## Getting started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 20+
- A Supabase project

### Install

```bash
bun install
```

### Environment variables

Create a `.env` file in the project root:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

### Run locally

```bash
bun dev
```

Open [http://localhost:8080](http://localhost:8080).

### Build

```bash
bun run build
```

## Project structure

```
src/
  components/       # React components
    ui/             # shadcn/ui primitives
    Header.tsx
    ResultsView.tsx
    ScoreGauge.tsx
    ViralClipsView.tsx
  lib/              # Utilities and server functions
    seo.functions.ts
    utils.ts
  routes/           # TanStack file-based routes
    __root.tsx
    index.tsx
  styles.css        # Tailwind entry + theme tokens
```

## How it works

1. The user pastes a YouTube URL on the home page.
2. A server function fetches the video transcript and metadata.
3. The transcript is analyzed for viral moments using heuristics and AI scoring.
4. Clips are ranked and presented with start/end timestamps, scores, captions, and hashtags.
5. The user selects clips and downloads them for posting.

## Limitations

- Only videos with available transcripts or captions can be analyzed.
- The current flow returns detected clip windows; actual video cutting and download happen client-side or via an external pipeline.

## License

MIT

