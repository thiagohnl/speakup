# SpeakUp

A personal AI-powered public speaking coach that lives in the browser. Mobile-first, no accounts needed.

## Features

- **Live Practice** — Real-time AI conversation practice with speech recognition
- **Recording Review** — Record or upload audio, get detailed analysis via Whisper + Claude
- **Tips Feed** — Curated YouTube videos on public speaking
- **Prayer Mode** — Practice church speaking with scenario-based coaching, phrase bank, and prayer-specific scoring

## Tech Stack

- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- OpenAI Whisper API (transcription)
- Anthropic Claude API (analysis + conversation)
- YouTube Data API v3 (tips feed)
- Web Speech API (live mode speech recognition)

## Local Setup

```bash
cd frontend
cp .env.example .env.local
# Fill in your API keys in .env.local
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API Keys

| Key | Where to get it |
|-----|----------------|
| OPENAI_API_KEY | [platform.openai.com/api-keys](https://platform.openai.com/api-keys) |
| ANTHROPIC_API_KEY | [console.anthropic.com](https://console.anthropic.com/) |
| YOUTUBE_API_KEY | [console.cloud.google.com](https://console.cloud.google.com/) — Enable YouTube Data API v3 |

## Deploy to Vercel

1. Push this repo to GitHub
2. Import into [Vercel](https://vercel.com)
3. Set **Root Directory** to `frontend`
4. Add environment variables (OPENAI_API_KEY, ANTHROPIC_API_KEY, YOUTUBE_API_KEY)
5. Deploy

## Architecture

3-layer system: Directives (markdown SOPs in `directives/`) -> Orchestration (Next.js API routes) -> Execution (TypeScript modules in `frontend/lib/`).

API keys are server-side only (routed through `/api/` routes). YouTube key is safe for client-side personal use.
