# SpeakUp — PROMPTS.md
## Sequential Build Instructions for Claude Code

---

> Follow these prompts in order. Complete each one fully before moving to the next.
> Each prompt is self-contained and references the STRUCTURE.md for context.
> Paste each block into Claude Code as a single message.

---

## PROMPT 01 — Project Scaffold

```
You are building "SpeakUp", a personal AI public speaking coach web app.
Read STRUCTURE.md and CLAUDE.md fully before starting.
This project follows the 3-layer Claude Code architecture: Directive → Orchestration → Execution.

Set up the project:

1. Create the full folder structure from STRUCTURE.md exactly:
   - directives/ with 5 empty .md files (transcribe_audio.md, analyse_speech.md, analyse_prayer.md, fetch_youtube_tips.md, live_conversation.md)
   - execution/ with 5 empty .py files (transcribe_audio.py, analyse_speech.py, analyse_prayer.py, fetch_youtube.py, count_fillers.py)
   - .tmp/ folder (add to .gitignore)
   - frontend/ as a Next.js 14 project with TypeScript and Tailwind CSS (App Router)

2. Inside frontend/:
   - Create app/api/ with route.ts stubs for: transcribe, analyse, analyse-prayer, youtube
   - Create components/ with empty .tsx stubs for all 7 components
   - Create lib/ with empty stubs for claude.ts, youtube.ts, analyser.ts, prayerScenarios.ts
   - Create types/index.ts with the SpeechMetrics and PrayerMetrics interfaces from STRUCTURE.md

3. Create .env in the project root with the three placeholder keys:
   OPENAI_API_KEY=your_openai_key
   ANTHROPIC_API_KEY=your_anthropic_key
   YOUTUBE_API_KEY=your_youtube_key

4. Create brand-guidelines.md in the project root using the content from STRUCTURE.md.

5. Add .env and .tmp/ to .gitignore.

6. Install frontend dependencies: cd frontend && npm install @anthropic-ai/sdk openai

Do not build any UI or write any logic yet. Scaffold only.
Confirm each file created and the full directory tree at the end.
```

---

## PROMPT 02 — Execution Scripts + Directives

```
Build the Layer 3 execution scripts and populate the Layer 1 directives.
Read CLAUDE.md and each directive stub before writing each script.

EXECUTION SCRIPTS (execution/):

1. execution/transcribe_audio.py
   - Accepts: audio file path as CLI argument
   - Uses OpenAI Whisper API (model: whisper-1)
   - Returns: JSON with { "transcript": "...", "duration_seconds": N }
   - Error handling: file too large (>25MB) → print error JSON, exit 1
   - Update directives/transcribe_audio.md with final inputs, outputs, edge cases

2. execution/analyse_speech.py
   - Accepts: transcript (string), scenario (string), mode ("live" or "review") as CLI args
   - Uses Anthropic SDK (claude-sonnet-4-20250514)
   - Uses the system prompts defined in STRUCTURE.md
   - Returns: SpeechMetrics as JSON
   - Error handling: malformed JSON from Claude → retry once with stricter prompt
   - Update directives/analyse_speech.md

3. execution/analyse_prayer.py
   - Accepts: transcript (string), scenario_id (string) as CLI args
   - Uses Anthropic SDK with the Prayer Mode prompt from STRUCTURE.md
   - Returns: PrayerMetrics as JSON
   - If transcript under 30 words → return { "error": "too_short" } without calling Claude
   - Update directives/analyse_prayer.md

4. execution/fetch_youtube.py
   - Accepts: query (string), max_results (int, default 9) as CLI args
   - Uses YouTube Data API v3
   - Returns: JSON array of { id, title, channelTitle, thumbnail, duration, viewCount }
   - Caches last result to .tmp/youtube_cache.json with a 1-hour TTL
   - Update directives/fetch_youtube_tips.md

5. execution/count_fillers.py
   - Accepts: transcript (string) as CLI arg
   - No API needed — pure Python string matching
   - Returns: JSON with { fillerWords: [...instances], fillerWordRate: N, justFillerCount: N }
   - Uses the filler word lists from STRUCTURE.md (general + prayer-specific)
   - Update directives (this one is referenced by both analyse_speech.md and analyse_prayer.md)

NEXT.JS API ROUTES (frontend/app/api/):
Each route reads from the relevant directive, runs the execution script via child_process, and returns the result.

6. app/api/transcribe/route.ts — POST, accepts FormData with audio file, runs transcribe_audio.py
7. app/api/analyse/route.ts — POST, accepts { transcript, scenario, mode }, runs analyse_speech.py
8. app/api/analyse-prayer/route.ts — POST, accepts { transcript, scenarioId }, runs analyse_prayer.py
9. app/api/youtube/route.ts — GET, accepts ?query=, runs fetch_youtube.py

All routes: handle errors gracefully, return { error: "..." } with appropriate HTTP status on failure.
```

---

## PROMPT 03 — Home Screen

```
Build the home screen (app/page.tsx).

Design direction from STRUCTURE.md: dark navy background (#0A0F1E), electric teal accent (#00E5CC), amber (#F59E0B), DM Serif Display + DM Sans fonts (load from Google Fonts in layout.tsx).

The home screen has:
1. App name "SpeakUp" in large display font, top left
2. Tagline: "Train your voice. Own the room."
3. Three large ModeCard components stacked vertically (mobile-first):
   - Live Practice (mic icon, teal) — links to /live
   - Recording Review (upload icon, amber) — links to /review
   - Tips Feed (play icon, purple) — links to /tips
4. ModeCard.tsx component:
   - Takes: title, description, icon, colour, href
   - Tap/click navigates to the mode
   - Press animation on tap
   - Shows a one-line description under the title

5. Bottom navigation bar (fixed):
   - Three icons: Mic (/live), Upload (/review), BookOpen (/tips)
   - Active state highlighted in teal
   - Built as a reusable component: components/BottomNav.tsx

Mobile-first layout. No horizontal scrolling. Large tap targets (min 48px).
Import Google Fonts in app/layout.tsx.
```

---

## PROMPT 04 — Recording Review Mode

```
Build the Recording Review Mode (app/review/page.tsx).

This is the simpler of the two practice modes — build it before Live Mode.

Flow:
1. Scenario selector (4 buttons): Job Interview / Pitch / Storytelling / Open Practice
2. Record or Upload section:
   - "Record" button: uses MediaRecorder API to capture microphone audio
   - Shows a live timer while recording
   - "Stop" ends recording, stores Blob
   - "Upload" button: accepts .mp3, .mp4, .wav, .m4a, .webm
3. On audio ready: show preview player and "Analyse" button
4. On Analyse click:
   - Show loading state with animated spinner
   - Call lib/whisper.ts to transcribe
   - Call lib/analyser.ts for local metrics
   - Call lib/claude.ts for AI analysis
   - Navigate to scorecard view

Scorecard view (same page, different state):
- Build ScoreCard.tsx component with:
  - Large number callout: WPM (with good/warning/alert colour coding: green 120-160, amber <120 or >180, red >200)
  - Filler word count + list of detected instances
  - Clarity score (1-10 visual bar)
  - Vocabulary richness (1-10 visual bar)
  - "What you did well" box (green tint)
  - "Top 3 Tips" box (teal numbered list)
- TranscriptView.tsx:
  - Shows full transcript
  - Filler words highlighted in amber

Add "Try Again" button at bottom to reset.
```

---

## PROMPT 05 — Live Practice Mode

```
Build the Live Practice Mode (app/live/page.tsx).

Flow:
1. Scenario selector (same 4 options as Review Mode)
2. "Start Session" button launches the conversation

Conversation loop:
- AI speaks first (show AI message as a speech bubble, use browser SpeechSynthesis API to speak it aloud)
- User responds via microphone (Web Speech API: SpeechRecognition for live transcription)
- Show live transcript text as user speaks (interim results)
- "Done" button or 3-second silence detection ends user turn
- User transcript sent to lib/claude.ts for quick per-turn analysis
- Show mini scorecard for that turn (pace, filler count, confidence: 1-10)
- AI generates next response/question
- Loop continues for max 10 turns

Build WaveformVisualiser.tsx:
- Uses Web Audio API + AnalyserNode
- Animated bars reacting to microphone volume
- Show only when user is speaking

Session End:
- After 10 turns OR user clicks "End Session"
- Aggregate all per-turn metrics into a final session ScoreCard
- Show full ScoreCard (reuse ScoreCard.tsx from PROMPT 04)
- Show full TranscriptView with all turns labelled (You / Coach)

Notes:
- Web Speech API is browser-native, no API key needed
- Fallback: if SpeechRecognition not available, show a message and offer upload instead
- SpeechSynthesis voice: prefer "Google UK English Female" or first available English voice
```

---

## PROMPT 06 — Tips Feed

```
Build the Tips Feed (app/tips/page.tsx).

Layout:
1. Search bar at top (full width, mobile-friendly)
2. On load: call lib/youtube.ts getDefaultFeed() and show results
3. On search: call searchVideos(query) with user input

Build TipCard.tsx component:
- YouTube thumbnail (16:9 ratio, rounded corners)
- Video title (max 2 lines, truncated)
- Channel name
- View count (formatted: "1.2M views")
- Duration badge (top right of thumbnail)
- Tap opens video in new tab (youtube.com/watch?v=ID)

Loading state: show 6 skeleton cards (grey animated pulse)
Empty state: "No videos found. Try a different search."
Error state: "Could not load videos. Check your YouTube API key."

Hardcode these 5 topic pills as quick-filter buttons below the search bar:
- Confidence | Interview Tips | Storytelling | Presentations | Vocal Tone

Tapping a pill searches that term immediately.
```

---

## PROMPT 06b — Prayer Mode

```
Build the Prayer Mode (app/prayer/page.tsx).

This mode has four sub-modes shown as tabs at the top of the page:
Scenario | Recording | Tips | Phrase Bank

--- TAB 1: Scenario Practice ---

1. Show the scenario cards from prayerScenarios.ts — each card shows:
   - Scenario label
   - Setting description (1-2 lines, truncated)
   - Target duration badge
   - "Practice" button

2. On selecting a scenario:
   - Display the full setting as a "scene setter" card (warm amber/gold tint, different from the navy)
   - Text input (large textarea) AND a record button (microphone, same as review mode)
   - Label: "Speak or type your prayer"
   - Submit button: "Get Feedback"

3. On submit:
   - If recorded: transcribe via Whisper API (lib/whisper.ts)
   - Send transcript + scenario to Claude via lib/claude.ts using the Prayer Mode prompt from STRUCTURE.md
   - Show PrayerScoreCard.tsx:
     - Structure score (4-part breakdown visual: Address / Acknowledgement / Intercession / Close — green tick or grey circle for each)
     - "Just" filler count (highlighted in red if > 3)
     - Standard filler word count
     - Length rating badge (Too Short / Ideal / Too Long)
     - Warmth score bar (1-10)
     - Clarity score bar (1-10)
     - "What you did well" (green box)
     - "Top 3 Tips" (numbered, teal)
   - "Try Again" button resets to scenario selection

--- TAB 2: Recording Review ---
Reuse the exact same record/upload flow from app/review/page.tsx.
But use PrayerScoreCard.tsx for output instead of ScoreCard.tsx.
Add a scenario selector at the top so Claude knows context.

--- TAB 3: YouTube Tips ---
Reuse TipCard.tsx.
Default search queries:
  - "how to pray in public church"
  - "leading congregational prayer tips"
  - "public prayer confidence"
Quick filter pills: Opening Prayer | Closing Prayer | Intercession | Announcements | Confidence

--- TAB 4: Phrase Bank ---
Build PhraseBank.tsx with four collapsible sections:
  - Opening Addresses (6 examples)
  - Acknowledgement Lines (6 examples — lines that recognise who God is before asking)
  - Transition Phrases (4 examples — moving from praise to intercession)
  - Strong Closings (4 examples)

Each phrase has a "Copy" button.
Add a disclaimer at top: "These are inspiration, not scripts. Let them spark your own words."

Design note for Prayer Mode:
Keep the same dark navy base but add a warm gold accent (#C9922A) specifically for this mode
to differentiate it visually from the coaching modes. The scene setter card should feel
different — like stepping into a church context, not a boardroom.
```

---

## PROMPT 07 — Polish and Mobile QA

```
Final polish pass across all pages.

1. Ensure BottomNav.tsx highlights the correct tab on every page — now 4 icons: Mic, Upload, BookOpen, Cross (or HandsPraying from lucide-react)
2. Update home screen (app/page.tsx) to show 4 ModeCards — add Prayer Mode card with gold accent colour (#C9922A) and a hands/cross icon
3. Add page transitions: simple fade-in on route change (use CSS animation)
4. Test and fix any layout issues on 375px width (iPhone SE)
5. Add a global error boundary in app/layout.tsx
6. Add meta tags in layout.tsx: title "SpeakUp", description, viewport
7. Add a simple loading.tsx for each route (shows spinner)
8. Ensure all buttons have min-height: 48px for touch targets
9. Add a "How it works" collapsed section on the home page:
   - 4 steps: Pick a mode → Pick a scenario → Practice → Get feedback
10. In review/page.tsx: if Whisper API fails, show a clear error with retry button
11. In live/page.tsx: if SpeechRecognition is not supported (Firefox/Safari), show fallback message with link to Chrome
12. In prayer/page.tsx: ensure the Phrase Bank copy buttons work on mobile (use navigator.clipboard with fallback)

Run through the full flow on mobile viewport and fix anything that breaks.
```

---

## PROMPT 08 — Deploy to Vercel

```
Prepare the app for Vercel deployment.

1. Create a production-ready .env.example file listing all three keys with placeholder values and comments explaining where to get each:
   - OPENAI_API_KEY: openai.com/api-keys
   - ANTHROPIC_API_KEY: console.anthropic.com
   - YOUTUBE_API_KEY: console.cloud.google.com → YouTube Data API v3

2. Update README.md with:
   - Project description
   - Local setup instructions (npm install, .env.local setup, npm run dev)
   - Deploy to Vercel instructions
   - Feature list

3. Confirm next.config.ts has no issues for Vercel deployment

4. Check all API routes are using server-side calls (API keys never exposed to client)
   - Whisper and Claude calls must go through Next.js API routes (app/api/)
   - YouTube calls can be client-side (YouTube API key is public-safe for personal use)

5. Create app/api/transcribe/route.ts — server route for Whisper
6. Create app/api/analyse/route.ts — server route for Claude
   These protect the OpenAI and Anthropic keys server-side.

Output a deployment checklist as a comment at the bottom of README.md.
```

---

## CLAUDE.md (paste this into your project root)

```markdown
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
- Read the directives, call execution scripts in the right order, handle errors
- You are the glue between intent and execution
- Example: you don't call Whisper yourself — you read `directives/transcribe_audio.md`, then run `execution/transcribe_audio.py`
- The Next.js API routes are also Layer 2 — they orchestrate calls to execution scripts

### Layer 3: Execution (Doing the work)
- Deterministic Python scripts in `execution/`
- API keys stored in `.env`
- Handle API calls (Whisper, Claude, YouTube), data processing, file operations
- Reliable, testable, well-commented

## Operating Principles

### 1. Check existing tools first
Before writing a script, check `execution/` for an existing one per the directive.
Create new scripts only if none exist.

### 2. Self-correct when something breaks
- Read the error and stack trace
- Fix the script and test again
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
- Backend: Next.js API routes calling Python execution scripts
- Transcription: OpenAI Whisper API (`execution/transcribe_audio.py`)
- AI Analysis: Anthropic Claude API (`execution/analyse_speech.py`, `execution/analyse_prayer.py`)
- Video: YouTube Data API v3 (`execution/fetch_youtube.py`)

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
```
