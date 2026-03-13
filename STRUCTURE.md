# SpeakUp v3 — STRUCTURE
## Step 1 of the Claude Code Framework

---

## What is this app?

A Duolingo-style speaking drill app for public speaking confidence.
One core loop: app shows a situation, speaks a model phrase aloud, you repeat it,
the app listens and checks if you said it correctly, then moves to the next phrase.
Short daily sessions. Streak tracking. No complex analysis. Just reps.

Personal use only. Mobile web browser. No backend, no accounts, no paid APIs during sessions.

---

## 3-Layer Architecture (from CLAUDE.md)

### Layer 1: Directives (directives/)
Markdown SOPs — what to do and why.
Preserved and improved over time as the system learns.

### Layer 2: Orchestration (Next.js app / Claude Code)
Reads directives, routes to execution tools in the right order,
handles errors, asks clarifying questions, updates directives with what it learns.

### Layer 3: Execution (execution/)
Deterministic Python scripts for any server-side or data processing tasks.
Reliable, testable, well-commented.

---

## Folder Structure

```
speakup/
├── CLAUDE.md                        # Agent instructions (3-layer architecture)
├── brand-guidelines.md              # Fonts, colours, design rules
├── spec.md                          # Built during PLAN step
├── .env                             # ANTHROPIC_API_KEY
├── .gitignore                       # .env, .tmp/, node_modules/
│
├── directives/                      # Layer 1: SOPs
│   └── generate_deck.md             # How to enrich decks from vinh_giang.json
│
├── execution/                       # Layer 3: Python scripts
│   └── (none for v1 — all logic runs client-side in the browser)
│
├── .tmp/                            # Intermediate files — never commit
│
├── data/
│   ├── vinh_giang.json              # Pipeline output (optional enrichment)
│   └── decks/
│       ├── job-interviews.json
│       ├── church-prayer.json
│       ├── church-announcements.json
│       ├── presentations.json
│       ├── storytelling.json
│       └── general-confidence.json
│
└── frontend/                        # Next.js App — Layer 2
    ├── app/
    │   ├── layout.tsx
    │   ├── globals.css
    │   ├── page.tsx                 # Home — pick deck + session length
    │   ├── drill/page.tsx           # Core drill loop (main experience)
    │   ├── summary/page.tsx         # Post-session summary
    │   └── api/
    │       └── generate-deck/
    │           └── route.ts         # Enriches decks from vinh_giang.json via Claude API
    ├── components/
    │   ├── DeckCard.tsx
    │   ├── DrillCard.tsx
    │   ├── MicButton.tsx
    │   ├── ResultBadge.tsx
    │   ├── ProgressBar.tsx
    │   ├── StreakBadge.tsx
    │   └── SessionSummary.tsx
    ├── lib/
    │   ├── decks.ts                 # Loads and merges deck JSON files
    │   ├── speechSynthesis.ts       # Web Speech API TTS wrapper
    │   ├── speechRecognition.ts     # Web Speech API STT wrapper
    │   ├── phraseMatch.ts           # Fuzzy matching logic
    │   └── userProgress.ts          # localStorage streak + session history
    └── types/
        └── index.ts                 # DrillCard, MatchResult, SessionResult, UserProgress
```

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 App Router | Consistent with CLAUDE.md default |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Mobile-first |
| Text-to-Speech | Web Speech API SpeechSynthesis | Free, browser-native |
| Speech-to-Text | Web Speech API SpeechRecognition | Free, browser-native |
| Phrase Matching | Custom fuzzy match (phraseMatch.ts) | No API needed per session |
| Content | data/decks/*.json | Pre-built, works offline |
| Progress | localStorage | No backend needed |
| Hosting | Vercel | Free tier |

No paid API calls happen during drill sessions. Everything runs in the browser.
ANTHROPIC_API_KEY is only used by the generate-deck API route — called once per deck, not per session.

---

## The Six Decks

| Deck | ID | Cards | Colour Accent |
|---|---|---|---|
| 💼 Job Interviews | job-interviews | 30 | Teal #00E5CC |
| 🙏 Church Prayer | church-prayer | 20 | Gold #C9922A |
| 📢 Church Announcements | church-announcements | 15 | Gold #C9922A |
| 🎤 Presentations | presentations | 25 | Teal #00E5CC |
| 💬 Storytelling | storytelling | 20 | Teal #00E5CC |
| 🗣️ General Confidence | general-confidence | 25 | Teal #00E5CC |

---

## Drill Card Data Shape

```json
{
  "id": "ji-001",
  "deck": "job-interviews",
  "situation": "The interviewer asks: Tell me about yourself.",
  "phrase": "I am an operations professional with over ten years in B2B SaaS, helping companies scale their revenue processes and improve customer outcomes.",
  "tip": "Pause naturally after 'SaaS' — let the interviewer absorb your background.",
  "level": "beginner"
}
```

---

## Phrase Matching Logic (phraseMatch.ts)

- Normalise both texts: lowercase, strip punctuation, remove words under 3 characters
- Extract key words: remove common stop words (the, and, is, to, etc.)
- Compare spoken key words against model key words
- Score = matched / total key words

| Score | Result |
|---|---|
| 60% or above | ✅ Nailed it — pass, move to next card |
| 35–59% | 🟡 Close — show missed words, allow retry |
| Under 35% | 🔁 Try again — max 2 retries, then force next |

---

## Drill Session State Machine

```
IDLE → SHOWING → SPEAKING → LISTENING → RESULT → NEXT → COMPLETE
```

- SHOWING: situation + phrase displayed, "Listen" button available
- SPEAKING: SpeechSynthesis reads phrase aloud, auto-transitions when done
- LISTENING: mic active, listenForPhrase() running, user repeats
- RESULT: MatchResult shown with coaching tip
- NEXT: brief pause, next card loads with slide-in animation
- COMPLETE: timer elapsed, session data saved, navigate to /summary

---

## Brand Guidelines (carried into brand-guidelines.md)

```
Background:     #0A0F1E   deep navy
Primary:        #00E5CC   electric teal (all non-church decks)
Prayer accent:  #C9922A   warm gold (church-prayer, church-announcements)
Success:        #22C55E   green — Nailed it
Warning:        #F59E0B   amber — Close
Error:          #EF4444   red — Try again
Text primary:   #F1F5F9
Text muted:     #94A3B8

Heading font:   DM Serif Display
Body font:      DM Sans
Min tap target: 48px
MicButton min:  80px diameter
Mobile-first:   375px minimum width
```

---

## Environment Variables

```bash
ANTHROPIC_API_KEY=your_key   # console.anthropic.com
```

---

## Directives to Create

### directives/generate_deck.md
Objective: Enrich a hardcoded drill deck with additional cards from vinh_giang.json.
Input: deck ID (string), hardcoded deck array, vinh_giang.json
Output: merged and shuffled array of DrillCards
Edge cases: vinh_giang.json empty or missing → return hardcoded deck only. Never crash.
Script: No execution script needed — logic lives in app/api/generate-deck/route.ts
