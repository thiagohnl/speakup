# SpeakUp v3 — PROMPTS.md
## Full Claude Code Framework: STRUCTURE → IDEATE → PLAN → BUILD → TEST → DEPLOY

> Each section maps to one step in the Claude Code framework.
> Paste the prompts into Claude Code in VS Code in the order shown.
> Complete each step fully before moving to the next.

---

# STEP 1: STRUCTURE
## Set Up CLAUDE.md

Paste this content into a new file called `CLAUDE.md` in your project root.
This is the agent instruction file — Claude Code reads this before doing anything.

```markdown
# Agent Instructions

You operate within a 3-layer architecture that separates responsibilities to maximise reliability.
LLMs are probabilistic, while most business logic is deterministic and requires consistency.
This system solves that problem.

## 3-Layer Architecture

### Layer 1: Directive (What to do)
- SOPs written in Markdown, living in `directives/`
- They define objectives, inputs, tools/scripts to use, outputs, and edge cases
- Natural-language instructions, like you would give to a mid-level employee

### Layer 2: Orchestration (Decisions)
- Intelligent routing — read the directives, call execution tools in the right order
- Handle errors, ask clarifying questions, update directives with what you learn
- You are the glue between intent and execution

### Layer 3: Execution (Doing the work)
- Deterministic scripts in `execution/`
- Environment variables and API tokens stored in `.env`
- Handle API calls, data processing, file operations
- Reliable, testable, well-commented

## Operating Principles

### 1. Check existing tools first
Before writing a script, check `execution/`. Create new scripts only if none exist.

### 2. Self-correct when something breaks
- Read the error and stack trace
- Fix the script and test again
- If it uses paid tokens, ask the user first
- Update the directive with what you learned

### 3. Update directives as you learn
Directives are living documents. Update them when you discover API constraints,
better approaches, common errors, or timing expectations.
Do NOT create or overwrite directives without asking unless explicitly instructed.

## Self-Correction Loop
1. Fix it
2. Update the tool
3. Test the tool
4. Update the directive
5. The system is now stronger

## Web App Development

### Tech Stack
- Frontend: Next.js + React + Tailwind CSS
- Backend: Next.js API routes (no FastAPI needed for this project)

### Brand Guidelines
Before any frontend work, read `brand-guidelines.md` in the project root.
Use the specified fonts and colours to maintain brand consistency.

## Directory Structure

```
speakup/
├── frontend/          # Next.js app
│   ├── app/           # Next.js App Router
│   ├── components/    # React components
│   └── package.json
├── directives/        # Markdown SOPs
├── execution/         # Utility Python scripts (if needed)
├── data/              # Deck JSON files
├── .tmp/              # Intermediate files — never commit
├── .env               # API keys
└── brand-guidelines.md
```

## File Organisation

### Directory Rules
- `.tmp/` — all intermediate files. Never commit. Always regenerable.
- `execution/` — deterministic scripts (tools)
- `directives/` — Markdown SOPs (instruction set)
- `.env` — environment variables and API keys

Local files are for processing only.
Everything in `.tmp/` can be deleted and regenerated at any time.

## Summary
Your role:
- Read instructions (directives)
- Make decisions (orchestration)
- Call tools (execution)
- Handle errors
- Continuously improve the system

Be pragmatic. Be reliable. Self-correct.
```

### STRUCTURE Prompt (paste into Claude Code)

```
Initialise this project based on the CLAUDE.md file.

Read CLAUDE.md fully, then create this folder structure:

speakup/
├── CLAUDE.md                    (already exists)
├── brand-guidelines.md          (create — content in STRUCTURE.md)
├── .env                         (create with: ANTHROPIC_API_KEY=your_key)
├── .gitignore                   (create — include .env, .tmp/, node_modules/)
├── directives/
│   └── generate_deck.md         (create — SOP for enriching decks with Vinh data)
├── execution/                   (create empty folder — no scripts needed for v1)
├── .tmp/                        (create empty folder)
└── data/
    ├── vinh_giang.json          (create placeholder: { "all_phrases": [], "all_vocabulary": [] })
    └── decks/
        ├── job-interviews.json          (create: [])
        ├── church-prayer.json           (create: [])
        ├── church-announcements.json    (create: [])
        ├── presentations.json           (create: [])
        ├── storytelling.json            (create: [])
        └── general-confidence.json      (create: [])

Show the full directory tree when done.
```

---

# STEP 2: IDEATE
## Explore Build Options

> Press Shift+Tab to enter Plan Mode before pasting this prompt.

```
I want to build a speaking drill app called SpeakUp.

Here is what it does:
The app shows a real-life situation (like "The interviewer asks: Tell me about yourself").
It then speaks a model phrase aloud using the browser's built-in text-to-speech.
I repeat the phrase out loud.
The app listens using the browser's built-in speech recognition and checks if I said it correctly.
Based on how many key words I got right, it shows a result: Nailed it, Close, or Try again.
I get a maximum of 2 retries per phrase, then it moves on.
Sessions are 5, 10, or 15 minutes long. A streak tracks daily usage.
Content comes from 6 pre-built decks: Job Interviews, Church Prayer, Church Announcements, Presentations, Storytelling, General Confidence.
This is a personal tool — no user accounts, no backend database, just localStorage.

Can you explore 3 different ways to build this, starting with the easiest one?
Do not start building yet — I just want to see the options.
Ask me about any APIs or tools you would need when we get to the build step.
```

---

# STEP 3: PLAN
## Create spec.md

> After choosing your preferred build option from IDEATE, paste this prompt.

```
We are going with the Next.js + Web Speech API approach (no paid APIs during sessions).

Create a spec.md file in the project root with:

1. What the app does (very specific — one paragraph)
2. The three screens and what each one contains:
   - Home screen: deck selector, session length, start button, streak badge
   - Drill screen: situation card, model phrase, listen button, mic button, result badge, progress bar
   - Summary screen: session stats, streak, missed words, drill again button
3. What it should look like: dark navy background, teal accent for most decks, gold for church decks, DM Serif Display for phrases, DM Sans for UI
4. The build broken into 3 steps:
   - Step 1: Visual shell with fake data — all screens look correct, no real speech or matching yet
   - Step 2: Core loop working — real speech synthesis, real speech recognition, real phrase matching
   - Step 3: Deck content + Vinh enrichment + polish + deploy
5. The drill session state machine: IDLE → SHOWING → SPEAKING → LISTENING → RESULT → NEXT → COMPLETE

Keep spec.md clear and specific. It is the instruction booklet for everything we build.
```

---

# STEP 4: BUILD
## Build in Three Phases

---

## BUILD PHASE 1 — Visual Shell with Fake Data

> This gets all three screens looking exactly right with hardcoded data.
> No speech, no matching, no real content yet. Just the visual experience.

```
Read CLAUDE.md, brand-guidelines.md, and spec.md fully before starting.

We are building Phase 1: the visual shell with fake data. No real speech or matching yet.

1. Create a new Next.js 14 project with TypeScript and Tailwind CSS (App Router) in the frontend/ folder.

2. Create frontend/types/index.ts with these interfaces:
   - DrillCard { id, deck, situation, phrase, tip, level }
   - MatchResult { passed, score, missedWords: string[] }
   - SessionResult { phraseId, passed, score, attempts }
   - UserProgress { streak, lastActiveDate, totalSessionsCompleted, totalPhrasesNailed, deckProgress }
   - DeckMeta { id, name, emoji, phraseCount, lastPlayed, accentColour }

3. Create all components as visual stubs (real layout, fake data):

   DeckCard.tsx — shows emoji, deck name, phrase count, last played, left border in accentColour
   StreakBadge.tsx — shows 🔥 + streak number (hardcoded to 3 for now)
   ProgressBar.tsx — a shrinking bar, hardcoded at 60% width, teal colour
   DrillCard.tsx — shows a hardcoded SITUATION and MODEL PHRASE (use a job interview example)
   MicButton.tsx — large circle button (80px min), teal, shows "Tap to speak" label
   ResultBadge.tsx — shows ✅ "Nailed it!" in green (hardcoded for now)
   SessionSummary.tsx — shows fake session stats: 12 phrases, 9 nailed, 5 day streak

4. Build the three screens:

   app/page.tsx (Home):
   - Header: "SpeakUp" left (DM Serif Display, teal), StreakBadge right
   - Subheading: "What are you training today?"
   - 2-column grid of 6 DeckCards (use DeckMeta hardcoded data for all 6 decks)
   - Session length pills: [5 min] [10 min] [15 min] — default 10 min selected
   - "Start Drilling" button — full width, teal, navigates to /drill

   app/drill/page.tsx (Drill):
   - ProgressBar at top (hardcoded 60%)
   - Card counter: "3 / 12"
   - DrillCard in the middle (hardcoded situation + phrase)
   - Bottom section showing: Listen button, MicButton, ResultBadge (all visible, fake state)
   - "Next" button below ResultBadge

   app/summary/page.tsx (Summary):
   - "Session Complete! 🎉"
   - 4 stat cards: Phrases drilled, Nailed first try, Streak, Best score
   - "Drill Again" button and "Change Deck" button

5. Apply brand-guidelines.md throughout:
   - Background: #0A0F1E on all screens
   - Teal: #00E5CC for primary actions and non-church decks
   - Gold: #C9922A for church-prayer and church-announcements deck borders
   - DM Serif Display for all phrase text
   - DM Sans for all UI text
   - Load both fonts in layout.tsx

Show the full file list when done. Do not implement any real speech or matching in this phase.
```

---

## BUILD PHASE 2 — Core Loop Working

> Now we wire up the real speech, real matching, and real session logic.

```
Read CLAUDE.md and spec.md before starting.

Phase 1 is complete. Now build Phase 2: the real core loop.

1. frontend/lib/phraseMatch.ts
   Implement fuzzy matching:
   - normalise(text): lowercase, remove punctuation, split to words, filter words under 3 chars
   - extractKeyWords(words): remove these stop words: the, and, is, to, a, in, of, for, that, it, be, with, as, at, this, by, from, or, an, are, was, were, been, has, have, had, do, did, will, would, could, should, may, might, shall, can, not, but, if, so, yet, nor, both, either
   - checkPhrase(spoken, model): returns MatchResult { passed, score, missedWords }
     score >= 0.6 → passed: true
     score >= 0.35 → passed: false (close)
     score < 0.35 → passed: false (try again)

2. frontend/lib/speechSynthesis.ts
   - speakPhrase(text, onEnd): uses SpeechSynthesisUtterance, rate 0.85
     Prefers 'Google UK English Female', 'Samantha', or lang 'en-GB' voice
     Calls onEnd when done
   - stopSpeaking(): calls speechSynthesis.cancel()
   - Guard against SSR: check typeof window !== 'undefined'

3. frontend/lib/speechRecognition.ts
   - isSupported(): returns true if SpeechRecognition exists in window
   - listenForPhrase(onResult, onError): starts recognition, lang en-US
     If no result in 10 seconds: call onError automatically
     Guard against SSR

4. frontend/lib/userProgress.ts
   localStorage key: 'speakup_progress'
   - getProgress(): UserProgress — reads localStorage, returns default if empty
   - saveProgress(p): void
   - updateStreak(): increment if active today, reset if gap over 1 day
   - recordSession(deck, results: SessionResult[]): updates all totals and deckProgress
   - getDeckLastPlayed(deck): string | null
   - getStreak(): number

5. frontend/lib/decks.ts
   - Import all 6 deck JSON files statically (they are empty arrays for now — that is fine)
   - getDeckMeta(): DeckMeta[] — returns all 6 with name, emoji, phraseCount, accentColour
     Church decks get accentColour '#C9922A', all others '#00E5CC'
   - getDeck(deckId): DrillCard[]
   - getShuffledDeck(deckId): DrillCard[] — Fisher-Yates shuffled copy

6. frontend/app/api/generate-deck/route.ts
   POST { deck: string }
   - Load hardcoded deck from decks.ts
   - If vinh_giang.json has all_phrases with items: merge up to 10 relevant cards
     Convert to DrillCard format, id prefix 'vinh-'
   - Shuffle merged array and return
   - Never crash — always return something

7. Wire up app/drill/page.tsx with the real state machine:
   States: IDLE → SHOWING → SPEAKING → LISTENING → RESULT → NEXT → COMPLETE
   - On load: read ?deck and ?minutes from URL, load deck from sessionStorage 'current_deck'
   - Start countdown timer on first card
   - SHOWING: show phrase, "Listen" button calls speakPhrase()
   - SPEAKING: auto-transition to LISTENING after TTS ends (0.5s pause)
   - LISTENING: MicButton pulses, listenForPhrase() runs, calls checkPhrase on result
   - RESULT: ResultBadge appears (scale animation), show tip text
     score >= 0.6: ✅ green "Nailed it!"
     score >= 0.35: 🟡 amber "So close! Missed: [words]"
     score < 0.35: 🔁 red "Try again" (if attempts < 2) or "Moving on..." (if >= 2)
   - NEXT: load next card, slide in from right (CSS translateX animation)
   - COMPLETE: navigate to /summary, save SessionResult array to sessionStorage 'session_results'
   Max 2 retries per card. Track SessionResult per card.

8. Wire up app/summary/page.tsx:
   - Read session_results from sessionStorage (redirect to home if missing)
   - Call recordSession() and updateStreak()
   - Show real stats, most missed words, motivational line based on streak
   - "Drill Again" → home with same deck, "Change Deck" → home

9. Wire up app/page.tsx:
   - Use getDeckMeta() for real deck data
   - Use getDeckLastPlayed() for last played dates
   - On "Start Drilling": POST to /api/generate-deck, store result in sessionStorage 'current_deck'
   - Navigate to /drill?deck=X&minutes=Y
   - Show amber warning if isSupported() is false

All TypeScript must compile clean. Run npm run build at the end and fix any errors.
```

---

## BUILD PHASE 3 — Deck Content + Polish + Deploy Prep

```
Read CLAUDE.md, brand-guidelines.md, and spec.md before starting.

Phase 2 is complete. Now build Phase 3: real content, polish, and deploy prep.

1. Populate all 6 deck JSON files with real drill content.
   Each card follows DrillCard interface. Phrase length: 15-40 words. Tip: one coaching line.

   data/decks/job-interviews.json — 30 cards
   Situations: Tell me about yourself, Greatest strength, Describe a challenge,
   Why this company, Why should we hire you, Where do you see yourself in 5 years
   10 beginner, 10 intermediate, 10 advanced

   data/decks/church-prayer.json — 20 cards
   Situations: Open Sunday service, Close service, Prayer before communion,
   Prayer for the sick, Open a prayer meeting
   Real prayer language — not generic. Include tip about avoiding "Lord just..." filler.

   data/decks/church-announcements.json — 15 cards
   Situations: Announce an event, Welcome visitors, Introduce a speaker,
   Give 3 announcements, Close announcements

   data/decks/presentations.json — 25 cards
   Situations: Open a presentation, Transition between points, Handle a tough question,
   Close with a call to action, Open with a story

   data/decks/storytelling.json — 20 cards
   Situations: Hook in 10 seconds, Set a scene, Build tension, Land the lesson, Make a point

   data/decks/general-confidence.json — 25 cards
   Situations: Introduce yourself at a networking event, Disagree respectfully,
   Ask a question in a group, Give a genuine compliment, Handle an awkward silence

2. Mobile polish at 375px:
   - No horizontal scroll on any screen
   - Bottom of drill screen uses padding-bottom: env(safe-area-inset-bottom)
   - DrillCard slides in from right: CSS translateX(100%) → translateX(0), 250ms ease-out
   - ResultBadge scales in: scale(0) → scale(1), 200ms
   - MicButton pulsing ring animation while LISTENING state is active

3. Church deck theming:
   When deck is church-prayer or church-announcements:
   - ProgressBar colour: #C9922A
   - MicButton colour: #C9922A
   All other decks: teal #00E5CC

4. Fallback for browsers without Web Speech API (Firefox, Safari):
   In LISTENING state: show a textarea "Type what you would say:" + Submit button
   Run checkPhrase on typed input — same logic as spoken input

5. directives/generate_deck.md
   Write the full SOP for how to enrich decks with Vinh content once vinh_giang.json is populated.
   Include: objective, inputs, outputs, deck-to-topic mapping, edge cases.

6. Create .env.example:
   ANTHROPIC_API_KEY=     # console.anthropic.com

7. Update README.md:
   - What the app does (3 sentences)
   - Setup: npm install, copy .env.example to .env, add key, npm run dev
   - Deploy: push to GitHub, connect to Vercel, add ANTHROPIC_API_KEY env var

8. Final build check:
   Run npm run build — fix all TypeScript errors before declaring done.

Show final file count per deck when done.
```

---

# STEP 5: TEST
## Manual QA Checklist

```
Run npm run dev and test the complete flow manually.

Test 1 — Full drill session:
Home → select Job Interviews → 5 min → Start Drilling
→ hear phrase spoken aloud
→ repeat phrase out loud
→ get a result (Nailed it / Close / Try again)
→ tap Next
→ complete session
→ see summary screen with real stats
→ tap Drill Again → return to home

Test 2 — Church deck theming:
Home → select Church Prayer → 10 min → Start Drilling
→ verify progress bar is GOLD not teal
→ verify MicButton is GOLD not teal
→ complete a few cards → confirm gold throughout

Test 3 — Streak:
Complete a session. Refresh the page.
Confirm streak badge on home screen shows 1.
Complete another session same day — streak should remain 1 (not increment twice).

Test 4 — No mic (fallback):
If testing on Firefox: drill screen should show textarea input instead of mic button.
Typing the phrase and submitting should trigger phrase matching.

Test 5 — Edge cases:
Start a 5-minute session and let the timer run out mid-phrase.
Confirm it completes the current phrase then navigates to summary.
Confirm session_results in sessionStorage is cleared after summary loads.

Fix any failures and update directives/generate_deck.md with anything you learn.
```

---

# STEP 6: DEPLOY
## Push to Vercel

```
Read CLAUDE.md before starting.

Deploy SpeakUp to Vercel.

1. Verify npm run build passes clean with zero TypeScript errors.

2. Confirm these files exist:
   .env.example with ANTHROPIC_API_KEY=
   .gitignore includes .env and .tmp/
   README.md with setup and deploy instructions

3. Initialise a git repository if not already done:
   git init
   git add .
   git commit -m "SpeakUp v3 — initial build"

4. Push to GitHub:
   Create a new repo at github.com (do not initialise with README)
   Follow GitHub's instructions to push an existing repo

5. Connect to Vercel:
   Go to vercel.com → Add New Project → Import from GitHub
   Select the speakup repo
   Framework: Next.js (auto-detected)
   Root directory: frontend/
   Add environment variable: ANTHROPIC_API_KEY = your key
   Deploy

6. After deploy:
   Test the live URL on a real mobile phone in Chrome
   Confirm speech synthesis speaks phrases aloud
   Confirm mic button works and phrase matching returns results
   Confirm streak persists across page reloads (localStorage working)

7. Deployment checklist:
   [ ] npm run build passes clean
   [ ] All 6 deck JSON files have content
   [ ] .env.example created
   [ ] README updated
   [ ] Live URL tested on mobile Chrome
   [ ] Streak persists across reloads
   [ ] Church decks show gold colour scheme
```

---

# REFERENCE: CLAUDE.md for Project Root

> Paste this as CLAUDE.md at the start of the project (STRUCTURE step).
> It tells Claude Code exactly how to operate on this project.

```markdown
# Agent Instructions

You operate within a 3-layer architecture that separates responsibilities to maximise reliability.
Read STRUCTURE.md and brand-guidelines.md before any frontend work.
Read the relevant directive in directives/ before running any task.

## What this app does
SpeakUp is a speaking drill app. One core loop:
show situation → speak model phrase → user repeats → fuzzy match check → result → next card.
Sessions are 5, 10, or 15 minutes. Content from 6 pre-built JSON decks.

## Architecture Rules
- phraseMatch.ts is the ONLY place that compares spoken vs model phrase
- speechSynthesis.ts is the ONLY place that calls SpeechSynthesis
- speechRecognition.ts is the ONLY place that calls SpeechRecognition
- userProgress.ts is the ONLY place that reads/writes localStorage
- decks.ts is the ONLY place that imports deck JSON files
- No API calls during the drill session — everything runs client-side
- data/decks/*.json are read-only in the app — never write to them from frontend

## Drill Screen State Machine
IDLE → SHOWING → SPEAKING → LISTENING → RESULT → NEXT → COMPLETE
Never skip states. Handle each transition explicitly.

## Phrase Matching Rules
60% key word match = pass. 35–59% = close (offer retry). Under 35% = try again.
Max 2 retries per card, then force move to next card.

## Brand Rules
Always check brand-guidelines.md before frontend work.
Church decks (church-prayer, church-announcements) use GOLD #C9922A.
All other decks use TEAL #00E5CC.

## Self-Correction Loop
When something breaks: fix it → update the tool → test → update the directive → system is stronger.

## When in doubt
Ask before adding dependencies or changing the drill state machine.
Keep it simple. The core loop is the product.
```
