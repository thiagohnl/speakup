# Agent Instructions

You operate within a 3-layer architecture that separates responsibilities to maximise reliability.
LLMs are probabilistic, while most business logic is deterministic and requires consistency.
This system solves that problem.

## 3-Layer Architecture

### Layer 1: Directive (What to do)
- SOPs written in Markdown, living in `directives/`
- They define objectives, inputs, scripts to use, outputs, and edge cases
- Natural-language instructions, like you'd give to a mid-level employee
- Current directives: transcribe_audio.md, analyse_speech.md, analyse_prayer.md, fetch_youtube_tips.md, live_conversation.md

### Layer 2: Orchestration (Decisions — your job)
- Read the directives, call execution modules in the right order, handle errors
- You are the glue between intent and execution
- The Next.js API routes are Layer 2 — they orchestrate calls to execution modules in lib/

### Layer 3: Execution (Doing the work)
- TypeScript modules in `frontend/lib/`
- API keys stored in `.env`
- Handle API calls (Whisper, Claude, YouTube), data processing
- Reliable, testable, well-commented

## Operating Principles

### 1. Check existing tools first
Before writing a module, check `frontend/lib/` for an existing one per the directive.
Create new modules only if none exist.

### 2. Self-correct when something breaks
- Read the error and stack trace
- Fix the module and test again
- If it uses paid API tokens, ask before retrying
- Update the directive with what you learned (API limits, timing, edge cases)

### 3. Update directives as you learn
Directives are living documents. Update them when you discover better approaches or constraints.
Do NOT overwrite directives without asking unless explicitly instructed.

## Self-Correction Loop
1. Fix it
2. Update the tool
3. Test the tool
4. Update the directive
5. The system is now stronger

## Project: SpeakUp
Personal AI public speaking coach. Four modes: Live Practice, Recording Review, Tips Feed, Prayer Mode.
Read STRUCTURE.md for full architecture before making any changes.

## Tech Stack
- Frontend: Next.js 14 + React + Tailwind CSS (App Router)
- Backend: Next.js API routes calling TypeScript execution modules
- Transcription: OpenAI Whisper API (`frontend/lib/claude.ts`)
- AI Analysis: Anthropic Claude API (`frontend/lib/claude.ts`)
- Video: YouTube Data API v3 (`frontend/lib/youtube.ts`)

## Brand Guidelines
Before any frontend work, check `brand-guidelines.md` in the project root and follow it exactly.

## Architecture Rules
- API keys (OpenAI, Anthropic) must NEVER be used client-side. Always route through `app/api/` server routes.
- YouTube API key is acceptable client-side for personal use.
- ScoreCard.tsx and TranscriptView.tsx are shared — do not duplicate them.
- PrayerScoreCard.tsx is prayer-specific — do not use it outside Prayer Mode.
- prayerScenarios.ts is the single source of truth for all scenarios.
- `.tmp/` is for intermediate files only — never commit, always regenerable.

## Prayer-Specific Filler Words
Detect separately from standard fillers: "Lord just", "Father just", "God just"
Report these in justFillerCount in PrayerMetrics, not in the standard fillerWordList.

## When in doubt
Ask before changing folder structure, adding dependencies, or modifying directives.
Be pragmatic. Be reliable. Self-correct.
