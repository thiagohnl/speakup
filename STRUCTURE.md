# SpeakUp — Public Speaking Coach App
## STRUCTURE Document

---

## Vision

A personal AI-powered public speaking coach that lives in the browser (mobile-first).
Four modes: live AI conversation practice, recorded speech review, a curated tips feed, and a dedicated Prayer Mode for church speaking practice.
No accounts, no backend database — all state in memory or localStorage. Fast to build, fast to use.

---

## 3-Layer Architecture

Following the Claude Code framework: Directive → Orchestration → Execution.

**Layer 1: Directive** — Markdown SOPs in `directives/` telling Claude what to do and why.
**Layer 2: Orchestration** — Claude reads directives, routes to the right execution tools, handles errors.
**Layer 3: Execution** — Deterministic Python scripts in `execution/` doing the actual API calls and processing.

```
speakup/
├── CLAUDE.md                         # Agent instructions (3-layer architecture)
├── brand-guidelines.md               # Design system: colours, fonts, design rules
├── .env                              # API keys (never committed)
├── .gitignore
│
├── directives/                       # LAYER 1: Markdown SOPs (what to do)
│   ├── transcribe_audio.md           # How to call Whisper and handle errors
│   ├── analyse_speech.md             # How to send transcript to Claude for scoring
│   ├── analyse_prayer.md             # Prayer-specific analysis SOP
│   ├── fetch_youtube_tips.md         # How to query YouTube Data API v3
│   └── live_conversation.md          # How to run a live practice session
│
├── execution/                        # LAYER 3: Deterministic scripts (doing the work)
│   ├── transcribe_audio.py           # Calls Whisper API, returns transcript
│   ├── analyse_speech.py             # Calls Claude API, returns SpeechMetrics JSON
│   ├── analyse_prayer.py             # Calls Claude API, returns PrayerMetrics JSON
│   ├── fetch_youtube.py              # Calls YouTube Data API v3, returns video list
│   └── count_fillers.py              # Local filler word counting, no API needed
│
├── .tmp/                             # Intermediate files (never committed)
│   └── (audio blobs, temp transcripts during processing)
│
└── frontend/                         # Next.js web app (LAYER 2: UI orchestration)
    ├── app/
    │   ├── layout.tsx
    │   ├── page.tsx                  # Home / mode selector
    │   ├── globals.css
    │   ├── api/
    │   │   ├── transcribe/route.ts   # Server route → calls execution/transcribe_audio.py
    │   │   ├── analyse/route.ts      # Server route → calls execution/analyse_speech.py
    │   │   ├── analyse-prayer/route.ts
    │   │   └── youtube/route.ts      # Server route → calls execution/fetch_youtube.py
    │   ├── live/
    │   │   └── page.tsx              # Live Practice Mode
    │   ├── review/
    │   │   └── page.tsx              # Recording Review Mode
    │   ├── tips/
    │   │   └── page.tsx              # Tips Feed
    │   └── prayer/
    │       └── page.tsx              # Prayer Mode
    ├── components/
    │   ├── ModeCard.tsx
    │   ├── ScoreCard.tsx
    │   ├── WaveformVisualiser.tsx
    │   ├── TranscriptView.tsx
    │   ├── TipCard.tsx
    │   ├── PrayerScoreCard.tsx
    │   └── PhraseBank.tsx
    ├── lib/
    │   ├── claude.ts                 # Claude API client (conversation only)
    │   ├── youtube.ts                # YouTube API client
    │   ├── analyser.ts               # Client-side filler counting
    │   └── prayerScenarios.ts        # Church scenario library
    └── types/
        └── index.ts
```

### Why this structure works
The Next.js API routes (Layer 2) read the directives and call the Python execution scripts rather than doing API work directly in TypeScript. This keeps the AI logic (Claude, Whisper) deterministic, testable, and self-correcting. If Whisper hits a rate limit, you fix `execution/transcribe_audio.py` and update `directives/transcribe_audio.md` — the frontend never changes.

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 14 (App Router) | Consistent with your other projects |
| Language | TypeScript | Type safety, catches errors early |
| Styling | Tailwind CSS | Fast, mobile-first |
| Transcription | OpenAI Whisper API | Best-in-class accuracy |
| AI Analysis | Anthropic Claude API (claude-sonnet-4-20250514) | Conversation + feedback |
| Live Speech | Web Speech API (browser native) | Free, no API needed for live mode |
| Video Feed | YouTube Data API v3 | Free quota, no scraping needed |
| State | React useState + useRef | No backend needed for personal use |
| Hosting | Vercel | Free tier, instant deploy |

---

## Environment Variables

```bash
# .env  (never commit — add to .gitignore)
OPENAI_API_KEY=your_openai_key          # Whisper transcription
ANTHROPIC_API_KEY=your_anthropic_key    # Claude analysis + conversation
YOUTUBE_API_KEY=your_youtube_key        # YouTube Data API v3
```

---

## Directives Spec (directives/)

Each directive is a living Markdown SOP. Claude reads these before calling execution scripts and updates them when it discovers API limits, edge cases, or better approaches.

### directives/transcribe_audio.md
**Objective:** Convert audio blob to text transcript via Whisper API.
**Input:** Audio file (mp3, mp4, wav, m4a, webm), max 25MB.
**Script:** `execution/transcribe_audio.py`
**Output:** Plain text transcript string.
**Edge cases:** File too large → chunk audio. Whisper fails → retry once, then surface error to user with "Try again" option.

### directives/analyse_speech.md
**Objective:** Score a speech transcript using Claude and return SpeechMetrics JSON.
**Input:** Transcript string, scenario label, mode (live or review).
**Script:** `execution/analyse_speech.py`
**Output:** SpeechMetrics JSON (see types/index.ts).
**Edge cases:** Empty transcript → return error. Claude returns malformed JSON → retry with stricter JSON-only prompt.

### directives/analyse_prayer.md
**Objective:** Score a prayer transcript using the prayer-specific Claude prompt.
**Input:** Transcript string, scenario ID from prayerScenarios.ts.
**Script:** `execution/analyse_prayer.py`
**Output:** PrayerMetrics JSON.
**Edge cases:** Same as analyse_speech.md. Additionally: if transcript is under 30 words, flag as "too short to analyse" before sending to Claude.

### directives/fetch_youtube_tips.md
**Objective:** Return a list of relevant YouTube videos for a given topic query.
**Input:** Query string, optional channel filter.
**Script:** `execution/fetch_youtube.py`
**Output:** Array of YouTubeVideo objects (id, title, channelTitle, thumbnail, duration, viewCount).
**Edge cases:** API quota exceeded (10k units/day free) → cache last result in .tmp/, serve cached. No results → widen query automatically.

### directives/live_conversation.md
**Objective:** Run a multi-turn AI conversation practice session in the browser.
**Input:** Scenario label, conversation history array.
**Script:** Claude API called directly from Next.js API route (no Python needed — stateless per turn).
**Output:** AI next question/response string + per-turn SpeechMetrics.
**Edge cases:** Web Speech API not available (Firefox/Safari) → show fallback text input. Silence detection fails → show manual "Done" button.

---

## The Three Modes

### Mode 1 — Live Practice
- User picks a scenario: Job Interview / Pitch / Storytelling / Open Practice
- AI speaks a prompt/question (text-to-speech via browser or ElevenLabs)
- User responds via microphone (Web Speech API for live transcription)
- After each response, Claude analyses: pace estimate, filler words count, clarity score, confidence signals
- Conversation continues for up to 10 turns
- End session shows full scorecard with per-turn breakdown

### Mode 2 — Recording Review
- User records directly in browser (MediaRecorder API) OR uploads an audio file
- Audio sent to Whisper API → full transcript returned
- Transcript + audio metadata sent to Claude for deep analysis
- Scorecard output:
  - Words per minute (pace)
  - Filler word count and list ("um", "uh", "so", "like", "basically", "right?")
  - Pause frequency and longest pause
  - Vocabulary richness score
  - Clarity and structure (intro, body, close)
  - Top 3 actionable improvement tips
  - One thing done well (always positive reinforcement)

### Mode 3 — Tips Feed
- YouTube Data API v3 search for curated channels and topics
- Default search queries on load:
  - "public speaking tips"
  - "how to speak confidently"
  - "presentation skills"
  - "storytelling techniques"
- Channels to prioritise (hardcoded channel IDs):
  - TED (UCsooa4yRKGN_zEE8iknghZA)
  - Toastmasters International
  - Vinh Giang
  - Charisma on Command
  - Matt Abrahams (Stanford)
- User can search by topic
- Cards show: thumbnail, title, channel, duration, view count
- Topic pills include a "Prayer" filter that switches to prayer-specific YouTube content

### Mode 4 — Prayer Mode
A dedicated mode for practising church speaking: opening prayers, closing prayers, intercession, and announcements.

**Sub-mode A: Scenario Practice**
- User picks a scenario from the library (see prayerScenarios.ts below)
- AI sets the scene (e.g. "It's Sunday morning, 60 people seated, pastor just handed you the mic")
- User types or speaks their prayer
- Claude coaches feedback scored specifically for prayer:
  - Structure score (Address, Acknowledgement, Intercession, Close — 4 parts)
  - "Just" filler count ("Lord just...", "Father just..." — the most common prayer filler)
  - Standard filler words (um, uh, so, like)
  - Length rating (under 1 min = too short, 1.5-2 min = ideal, over 3 min = too long)
  - Warmth score — does it feel like it's leading the congregation, not performing?
  - Clarity score — can people follow along and agree?
  - Top 3 actionable tips
  - One highlight (always positive)

**Sub-mode B: Recording Review**
- Same record/upload flow as Mode 2 but uses PrayerScoreCard.tsx
- Whisper transcribes, Claude analyses using prayer-specific prompt

**Sub-mode C: YouTube Tips**
- Filtered tip feed searching: "how to pray in public", "leading congregational prayer", "public prayer church"
- Channels to prioritise: Gospel Coalition, Tim Keller sermons, Desiring God, Carey Nieuwhof

**Sub-mode D: Phrase Bank**
- PhraseBank.tsx component with categorised prayer phrases to inspire (not copy):
  - Opening addresses: "Gracious Father", "Lord of heaven and earth", "Almighty God"
  - Gratitude lines: examples of acknowledging who God is before asking
  - Transition phrases: moving from praise to intercession naturally
  - Strong closings: variations beyond just "Amen"
- Tap any phrase to copy it
- Clearly labelled as inspiration only, not scripts

---

## prayerScenarios.ts — Scenario Library

```typescript
export const PRAYER_SCENARIOS = [
  {
    id: 'open-service',
    label: 'Open the Sunday Service',
    setting: 'Sunday morning, full congregation (60+ people), pastor has just asked you to open in prayer. The service is about to begin.',
    duration: '1.5-2 minutes',
    tips: ['Set a tone of reverence', 'Invite the congregation into prayer, not just observe it', 'Keep it focused — one or two themes max']
  },
  {
    id: 'close-service',
    label: 'Close the Sunday Service',
    setting: 'End of service, people are ready to leave. Pastor asks you to close in prayer. Energy should send people out with purpose.',
    duration: '1-1.5 minutes',
    tips: ['Summarise what was preached briefly in the prayer if relevant', 'Commission the congregation for the week', 'End with energy, not trailing off']
  },
  {
    id: 'before-communion',
    label: 'Prayer Before Communion',
    setting: 'The church is about to take communion together. You are asked to pray before the elements are distributed.',
    duration: '1-2 minutes',
    tips: ['Focus on Christ and the cross', 'Create reverence and stillness', 'Avoid being too long — people are waiting to participate']
  },
  {
    id: 'prayer-for-sick',
    label: 'Prayer for Someone Who is Sick',
    setting: 'A member of the congregation has shared a health struggle. Pastor invites you to pray for them publicly.',
    duration: '1-2 minutes',
    tips: ['Speak to God, not about the person to the congregation', 'Be specific but not clinical', 'Pray with faith and compassion in equal measure']
  },
  {
    id: 'announcements',
    label: 'Give Church Announcements',
    setting: 'You have 3 announcements to share before the sermon. Congregation is seated and attentive.',
    duration: '2-3 minutes',
    tips: ['State each announcement clearly: What, When, Who it is for', 'Keep energy up — announcements can drag', 'End with a brief connecting line before handing back to the pastor']
  },
  {
    id: 'open-prayer-meeting',
    label: 'Open a Prayer Meeting',
    setting: 'Mid-week prayer gathering, 15-20 people. You are opening the time of prayer.',
    duration: '2 minutes',
    tips: ['Set the tone for others to pray after you', 'Invite participation — do not dominate', 'Keep it conversational, not performative']
  }
]
```

---

## Speech Analysis Logic (analyser.ts)

```typescript
// Metrics calculated from transcript + timing data
export interface SpeechMetrics {
  wordsPerMinute: number          // Target: 120-160 wpm
  fillerWords: FillerWordResult[] // Each instance with position
  fillerWordRate: number          // Fillers per 100 words
  pauseCount: number              // Detected pauses > 1.5s
  longestPause: number            // In seconds
  vocabularyRichness: number      // Unique words / total words (0-1)
  clarityScore: number            // Claude-generated 1-10
  confidenceSignals: string[]     // Positive signals detected
  weaknessSignals: string[]       // Areas to improve
  tips: string[]                  // Top 3 actionable tips
  highlight: string               // One thing done well
}

const FILLER_WORDS = [
  'um', 'uh', 'er', 'like', 'so', 'basically',
  'literally', 'right', 'you know', 'kind of', 'sort of', 'actually'
]
```

---

## Claude API Prompt Design

### Live Mode (per-turn analysis)
```
System: You are a professional speech coach with 20 years of experience.
Analyse the following spoken response and return JSON only.
Score pace (slow/good/fast), count filler words, rate confidence 1-10,
give one tip and one praise. Keep feedback under 50 words total.
```

### Review Mode (full session)
```
System: You are a professional speech coach. Analyse this full transcript
from a [scenario] practice session. Return a detailed JSON scorecard with:
wpm estimate, filler word list, structure score 1-10, clarity score 1-10,
vocabulary richness 1-10, top 3 tips, one highlight. Be direct and honest.
```

### Prayer Mode (scenario + recording review)
```
System: You are a compassionate but honest church speaking coach with 20 years of experience
helping everyday believers pray and speak with confidence in front of congregations.
Analyse this prayer transcript from a [scenario] practice session.
Return a JSON scorecard with:
- structureScore 1-10 (did it follow Address, Acknowledgement, Intercession, Close?)
- justFillerCount (how many times did they say "Lord just" or "Father just")
- fillerWordList (um, uh, so, like instances)
- lengthRating (too short / ideal / too long based on scenario target duration)
- warmthScore 1-10 (does it lead the congregation or perform to them?)
- clarityScore 1-10 (can the congregation follow and agree?)
- tips: top 3 actionable improvements
- highlight: one thing done genuinely well
Be direct, specific, and encouraging. Avoid vague praise.
```

---

## brand-guidelines.md

Claude Code checks for this file before any frontend development. Paste the following into `brand-guidelines.md` in your project root:

```markdown
# SpeakUp Brand Guidelines

## Colours
- Background: #0A0F1E (deep navy) — base for all modes
- Primary accent: #00E5CC (electric teal) — Live, Review, Tips modes
- Prayer accent: #C9922A (warm gold) — Prayer Mode only
- Warning / pace alert: #F59E0B (amber)
- Success / positive: #22C55E (green)
- Text primary: #F1F5F9
- Text secondary: #94A3B8

## Typography
- Display / headings: DM Serif Display (Google Fonts)
- Body / UI: DM Sans (Google Fonts)
- Monospace (transcripts): JetBrains Mono

## Design Rules
- Mobile-first: single column, 375px minimum width
- Minimum tap target: 48px height
- Scorecards use large number callouts, not just text labels
- Waveform animation shown only during active recording
- Prayer Mode scene-setter cards use a warm gold tint background, not navy
- No hover-only interactions
```

---

## UI Design Direction
- Background: deep navy (#0A0F1E)
- Accent: electric teal (#00E5CC)
- Secondary: warm amber (#F59E0B) for warnings/pace alerts
- Font: display — "DM Serif Display", body — "DM Sans"
- Live mode shows an animated waveform while recording
- Scorecard uses bold number callouts (not just text)
- Mobile-first: single column, large tap targets, thumb-friendly nav

---

## Mobile-First Considerations

- Bottom navigation bar (4 icons: Mic /live, Upload /review, BookOpen /tips, Cross /prayer)
- Large record button with haptic-style press animation
- Transcript scrolls independently from controls
- Scorecard is swipeable card stack on mobile
- No hover-dependent interactions

---

## Out of Scope (V1)

- User accounts or history persistence
- Leaderboards or social features
- Native mobile app (React Native)
- Real-time waveform analysis during recording (post-processing only)
- Paid tier or subscription logic
