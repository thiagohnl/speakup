# SpeakUp — PROMPTS.md v2
## Sequential Build Instructions for Claude Code

> Paste each prompt into Claude Code in VS Code in order.
> Run from the SpeakUp project root.
> Read STRUCTURE.md and CLAUDE.md before starting.

---

## PROMPT 01 — Scaffold v2

```
Read STRUCTURE.md and CLAUDE.md fully before starting.
We are rebuilding SpeakUp v2. The folder structure has changed significantly.

1. Restructure the frontend/app/ folder to match STRUCTURE.md exactly:
   - Keep: app/layout.tsx, app/globals.css
   - Replace existing route folders with: learn/, learn/[topic]/, practice/, prayer/, progress/
   - Remove: live/, review/, tips/ (these are replaced by the new structure)
   - Create: app/api/plan/route.ts stub

2. Update components/ — remove old components and create stubs for all new ones:
   Remove: ModeCard.tsx (replaced by TopicCard.tsx)
   Keep: ScoreCard.tsx, PrayerScoreCard.tsx, WaveformVisualiser.tsx, TranscriptView.tsx, PhraseBank.tsx (rename to PrayerPhraseBank.tsx), TipCard.tsx (remove — no YouTube feed)
   Add stubs: DashboardCard.tsx, StreakBadge.tsx, TopicCard.tsx, PhraseCard.tsx, VocabCard.tsx, SentenceBuilder.tsx, ProgressRing.tsx, PlanCard.tsx

3. Update lib/:
   Keep: claude.ts, analyser.ts, prayerScenarios.ts
   Remove: youtube.ts (pipeline only now)
   Add stubs: contentLibrary.ts, userProgress.ts

4. Update directives/:
   Remove: fetch_youtube_tips.md, live_conversation.md
   Keep: transcribe_audio.md, analyse_speech.md, analyse_prayer.md
   Add stub: generate_plan.md

5. Update execution/:
   Remove: fetch_youtube.py
   Keep: transcribe_audio.py, analyse_speech.py, analyse_prayer.py, count_fillers.py
   Add stub: generate_plan.py

6. Update types/index.ts with ALL interfaces from STRUCTURE.md:
   SpeechMetrics, PrayerMetrics, KeyPhrase, VocabularyItem, Framework,
   Principle, ExampleSentence, UserProgress, CoachPlan, DayTask

7. Create data/ folder in project root if it does not exist.
   Add a placeholder data/vinh_giang.json:
   { "source": "Vinh Giang (@askvinh)", "note": "Run pipeline to populate", "all_phrases": [], "all_vocabulary": [], "all_frameworks": [], "all_principles": [], "all_example_sentences": [], "topics_index": {} }

Confirm every file created, kept, or removed. Show final directory tree.
```

---

## PROMPT 02 — contentLibrary.ts + userProgress.ts

```
Build the two core library files that power the entire app.

1. frontend/lib/contentLibrary.ts
   - Import data/vinh_giang.json
   - Implement CONTEXT_TO_TOPIC map exactly as defined in STRUCTURE.md
   - Implement all exported functions:
     getPhrasesByTopic(topic: string): KeyPhrase[]
     getVocabularyByTopic(topic: string): VocabularyItem[]
     getFrameworks(topic?: string): Framework[]
     getPrinciples(topic?: string): Principle[]
     getExampleSentences(situation?: string): ExampleSentence[]
     getAllTopics(): string[]
     getItemById(id: string): KeyPhrase | VocabularyItem | null
   - Add a helper: getContentForContext(context: string) that maps
     app context names to topic tags using CONTEXT_TO_TOPIC and
     returns combined phrases + vocab for that context
   - All functions must handle empty/missing vinh_giang.json gracefully
     (return empty arrays, never crash)
   - Add JSDoc comments on each function

2. frontend/lib/userProgress.ts
   - Implement full UserProgress interface from STRUCTURE.md
   - Functions:
     getProgress(): UserProgress  — reads localStorage, returns default if empty
     saveProgress(progress: UserProgress): void  — writes to localStorage
     markPhraseAsLearned(phraseId: string): void
     markPhraseAsSaved(phraseId: string): void
     markVocabAsLearned(vocabId: string): void
     incrementPracticeSession(): void
     incrementPrayerSession(): void
     updateStreak(): void  — increments streak if active today, resets if gap > 1 day
     updateContextProgress(context: string, phrasesLearned: number, total: number): void
     getWeakestContext(): string  — returns context with lowest % progress
     savePlan(plan: CoachPlan): void
     getCurrentPlan(): CoachPlan | null
   - localStorage key: 'speakup_progress'
   - All functions safe to call server-side (check typeof window !== 'undefined')

Test both files compile with no TypeScript errors.
```

---

## PROMPT 03 — Dashboard (Home Screen)

```
Build the Dashboard (app/page.tsx) — the coach home screen.

Read brand-guidelines.md before starting.

Layout (mobile-first, dark navy background):

1. Header bar:
   - "SpeakUp" logo left (DM Serif Display, teal)
   - StreakBadge.tsx right — shows flame icon + "X day streak"

2. Greeting:
   - "Good [morning/afternoon/evening]" based on time of day
   - Subline: "Here's your plan for today."

3. DashboardCard.tsx — Today's Focus:
   - Large card, teal left border
   - Shows currentPlan.weekTasks[today] from userProgress
   - Title: task description
   - Subtitle: context + type (Learn / Practice / Prayer)
   - "Start" button → navigates to correct screen
   - If no plan exists yet: shows "Set up your plan" card with a button
     that calls app/api/plan/ to generate one

4. Progress section — "Your Progress":
   - 6 ProgressRing.tsx components in a 2x3 grid
   - Each ring: context name below, % complete, colour based on progress
     (grey = not started, amber = in progress, teal = >80%)
   - Tap any ring → navigates to learn/[topic]

5. Recent Activity (last 3 items from userProgress):
   - Simple list: icon + description + time ago
   - Example: "📚 Learned 3 phrases in Job Interviews · 2h ago"

6. BottomNav.tsx — fixed bottom:
   - 4 tabs: Home (active), Learn, Practice, Prayer
   - Active tab in teal, others in muted grey
   - Icons: House, BookOpen, Mic, HandsPraying (lucide-react)

If vinh_giang.json is empty (pipeline not run yet):
- Show a notice card: "Content library not loaded yet. Run the pipeline to unlock full content."
- App still works, just with limited content

Use DM Serif Display for headings, DM Sans for body throughout.
```

---

## PROMPT 04 — Learn: Context Selector

```
Build the Learn context selector screen (app/learn/page.tsx).

This is the entry to the Learn section. Shows 6 context cards.

Layout:
1. Header: "Learn" (large, DM Serif Display) + "Build your vocabulary" subtitle
2. 6 TopicCard.tsx components in a 2-column grid:
   - 💼 Job Interviews
   - 🙏 Church Prayer
   - 📢 Church Announcements
   - 🎤 Presentations & Pitches
   - 💬 Casual Storytelling
   - 🗣️ General Public Speaking

TopicCard.tsx:
   - Emoji icon + context name
   - Progress bar (phrasesLearned / totalPhrases from userProgress)
   - Item count: "X phrases · Y words"  (from contentLibrary)
   - Tap → navigate to /learn/[topic]
   - If 0 items available (pipeline not run): show "Coming soon" badge instead

Use getContentForContext() from contentLibrary.ts to get item counts per context.
Use getProgress() from userProgress.ts to get progress per context.

Bottom nav active tab: Learn.
```

---

## PROMPT 05 — Learn: Topic Detail (Phrases, Vocab, Sentence Builder)

```
Build the topic detail screen (app/learn/[topic]/page.tsx).

This is the core learning experience. Three tabs.

Header:
- Back arrow → /learn
- Context name + emoji as title
- "X of Y learned" progress indicator

TAB 1 — Phrases:
- Use getPhrasesByTopic(topic) from contentLibrary.ts
- Render a vertically scrolling list of PhraseCard.tsx components
- PhraseCard.tsx:
  - Main phrase text (large, DM Serif Display)
  - "When to use:" context line (smaller, muted)
  - Source tag: "Vinh Giang" (small teal badge)
  - Three action buttons: 
    💾 Save (toggles saved state, calls markPhraseAsSaved)
    ✓ Learned (marks complete, calls markPhraseAsLearned, card dims slightly)
    📋 Copy (copies phrase to clipboard)
  - Learned cards show a subtle teal checkmark overlay
- Empty state: "No phrases yet. Run the pipeline to load Vinh's content."

TAB 2 — Vocabulary:
- Use getVocabularyByTopic(topic) from contentLibrary.ts  
- Render VocabCard.tsx components:
  - Word (large, bold)
  - Meaning (clear, plain English)
  - Example sentence in italic (shows word in context)
  - Same Save / Learned / Copy buttons
  - Source: "Vinh Giang" badge

TAB 3 — Sentence Builder:
- Instruction text: "Describe what you want to say in plain words"
- Large textarea placeholder: "e.g. I want to say I'm excited about this job"
- "Build my sentence" button
- On tap:
  - Call app/api/sentence-builder/ (create this route)
  - Pass: roughIdea, context/topic, relevant phrases from contentLibrary
  - Claude returns 5 alternatives (see STRUCTURE.md prompt)
  - Show 5 SentenceBuilder cards with level labels:
    Simple / Clear / Confident / Polished / Powerful
  - Each card has a Copy button
  - Loading state: animated shimmer cards
- Add app/api/sentence-builder/route.ts using the Sentence Builder 
  Claude prompt from STRUCTURE.md

Bottom nav active tab: Learn.
```

---

## PROMPT 06 — Practice Screen

```
Build the Practice screen (app/practice/page.tsx).

Two sub-modes on one screen, toggled by a segmented control at the top:
[Live Practice] [Recording Review]

--- SUB-MODE A: Live Practice ---

1. Scenario selector (4 buttons): Job Interview / Pitch / Storytelling / Open Practice

2. "Start Session" launches the conversation loop:
   - AI speaks first (show as speech bubble, read aloud via SpeechSynthesis)
   - User responds via microphone (Web Speech API live transcription)
   - Show live interim transcript text as user speaks
   - "Done" button ends user turn (also 3-second silence detection)
   - User turn sent to app/api/analyse/ for per-turn feedback
   - Show mini ScoreCard for that turn: pace, filler count, confidence 1-10
   - IMPORTANT: also show vocabularyUpgrade if returned:
     "You said [X]. Try: [Y]" in a small amber callout card
   - AI generates next question/response
   - Max 10 turns

3. WaveformVisualiser.tsx shown while user is speaking (Web Audio API)

4. Session end → full ScoreCard + vocabulary upgrade list

--- SUB-MODE B: Recording Review ---

1. Scenario selector (same 4 options)

2. Record or Upload:
   - "Record" button → MediaRecorder API, show live timer
   - "Stop" → stores Blob
   - "Upload" → accepts .mp3 .mp4 .wav .m4a .webm
   - Show audio preview player after capture

3. "Analyse" button:
   - POST to app/api/analyse/ with audio + scenario
   - API route calls execution/analyse_speech.py (Whisper + Claude)
   - Show loading state
   - Render full ScoreCard

4. TranscriptView.tsx below scorecard:
   - Full transcript text
   - Filler words highlighted in amber
   - Weak vocabulary highlighted in blue with suggested alternatives on tap

5. "Try Again" resets to step 1

Both sub-modes pull saved phrases from userProgress via getSavedPhrases()
and pass them to the Claude prompt for personalised vocabulary suggestions.

Bottom nav active tab: Practice.
```

---

## PROMPT 07 — Prayer Screen

```
Build the Prayer screen (app/prayer/page.tsx).

Important: this screen uses the warm GOLD accent (#C9922A) not teal.
Read brand-guidelines.md.

Four tabs: Scenario | Recording | Phrase Bank | Tips

--- TAB 1: Scenario Practice ---

1. Six scenario cards from prayerScenarios.ts:
   - Label + setting (2 lines truncated) + duration badge
   - "Practice" button

2. On selecting scenario:
   - Full-width "scene setter" card with warm gold tint background
   - Shows full setting text
   - Large textarea + record button (same MediaRecorder as Practice screen)
   - "Get Feedback" button

3. On submit:
   - Transcribe if recorded (via app/api/transcribe/)
   - POST to app/api/analyse-prayer/ with transcript + scenarioId
   - Show PrayerScoreCard.tsx:
     - 4-part structure visual (Address / Acknowledgement / Intercession / Close)
       Each part: gold tick if present, grey circle if missing
     - "Just" filler count — red badge if > 3
     - Standard filler words list
     - Length badge: Too Short / Ideal / Too Long
     - Warmth score bar (gold colour)
     - Clarity score bar
     - "What you did well" green box
     - "Top 3 Tips" gold numbered list
   - "Try Again" resets

--- TAB 2: Recording ---
Same record/upload flow as Practice screen.
Uses PrayerScoreCard output.
Scenario selector at top so Claude knows context.

--- TAB 3: Phrase Bank (PrayerPhraseBank.tsx) ---
Five collapsible sections:
- Opening Addresses
- Acknowledgement Lines
- Transition Phrases
- Strong Closings
- Announcement Openers

Each section: 4-6 phrases, each with a Copy button.
Source: getPhrasesByTopic('prayer_speaking') from contentLibrary.ts
Fallback if empty: hardcoded phrases from STRUCTURE.md.
Disclaimer at top: "These are inspiration, not scripts. Let them spark your own words."

--- TAB 4: Tips ---
Static written tips per scenario type.
Render as clean accordion cards (scenario name → expand to show 3 tips).
No API calls — fully static content.
Source: principles from getContentForContext('church-prayer') if available,
otherwise hardcoded tips from prayerScenarios.ts tips arrays.

Bottom nav active tab: Prayer (HandsPraying icon, gold when active).
```

---

## PROMPT 08 — Progress Screen + Coach Plan

```
Build two things: the Progress screen and the plan generation.

1. app/progress/page.tsx:
   - Header: "Your Progress"
   - Streak display: large flame icon + "X day streak" + "Keep it going!"
   - 6 ProgressRing.tsx components (2x3 grid):
     Each ring: circular progress indicator, % fill, context name below
     Colour: grey 0%, amber 1-79%, teal 80-100%
     Tap → navigate to learn/[topic]
   - Stats row: "X phrases saved" · "X practice sessions" · "X prayers"
   - "Weakest area" card: shows getWeakestContext() result with a 
     "Go practice" button that links to the right screen
   - Accessible from Dashboard via a "View all progress" link

2. execution/generate_plan.py:
   - Accepts: userProgress JSON as CLI argument (stringified)
   - Generates a 7-day CoachPlan
   - Logic:
     Day 1-2: Learn in weakest context (most phrases unlearned)
     Day 3: Practice using what was learned
     Day 4-5: Learn in second weakest context
     Day 6: Prayer scenario practice
     Day 7: Full practice session (any scenario)
   - Returns CoachPlan JSON matching the interface in types/index.ts

3. app/api/plan/route.ts:
   - POST route
   - Accepts: { userProgress: UserProgress }
   - Calls execution/generate_plan.py
   - Returns: CoachPlan JSON

4. Wire the Dashboard to call app/api/plan/ when no currentPlan exists
   or when the plan is more than 7 days old.
   Save the returned plan to localStorage via savePlan().

Also update directives/generate_plan.md with full SOP.
```

---

## PROMPT 09 — Polish and Mobile QA

```
Final polish pass across all screens.

1. BottomNav.tsx: confirm correct active tab highlight on every screen
   Icons: House (Dashboard), BookOpen (Learn), Mic (Practice), HandsPraying (Prayer)
   Prayer tab: gold when active, all others teal when active

2. Page transitions: fade-in animation on every route change (CSS only)

3. Mobile QA at 375px width — fix any layout issues:
   - No horizontal scroll anywhere
   - All tap targets min 48px
   - Bottom nav does not overlap content (add padding-bottom to main content)

4. app/layout.tsx:
   - Load Google Fonts: DM Serif Display + DM Sans + JetBrains Mono
   - Meta tags: title "SpeakUp", description, viewport
   - Global error boundary

5. loading.tsx for each route: simple centered spinner in navy background

6. Graceful degradation:
   - If vinh_giang.json is empty: Learn tabs show "Run the pipeline to load content"
   - If Web Speech API unavailable: show text input fallback with clear message
   - If Whisper fails: show retry button with plain error message
   - If Claude fails: show "Analysis unavailable, try again" — never show raw errors

7. Streak update: call updateStreak() on every app load in layout.tsx

8. Test full flow:
   Dashboard → Learn → learn a phrase → Practice → record → get scorecard
   Dashboard → Prayer → scenario → get feedback

Fix anything broken before deploy.
```

---

## PROMPT 10 — Deploy to Vercel

```
Prepare for Vercel deployment.

1. Create .env.example:
   OPENAI_API_KEY=        # openai.com/api-keys — used for Whisper transcription
   ANTHROPIC_API_KEY=     # console.anthropic.com — used for Claude analysis
   YOUTUBE_API_KEY=       # console.cloud.google.com — pipeline only, not needed for app

2. Confirm all API keys are server-side only:
   - OpenAI (Whisper): only in app/api/analyse/route.ts — check
   - Anthropic (Claude): only in app/api/ routes — check
   - YouTube: not used in app at all — check

3. Verify next.config.ts is Vercel-ready:
   - No Node.js-only modules imported client-side
   - data/vinh_giang.json is included in the build (add to next.config.ts if needed)

4. Update README.md:
   - Project description
   - Setup: npm install, .env setup, pipeline instructions, npm run dev
   - Deploy: Vercel one-click deploy instructions
   - Note: run pipeline first to populate data/vinh_giang.json

5. Deployment checklist (add as comment at bottom of README.md):
   [ ] vinh_giang.json populated by pipeline
   [ ] .env variables set in Vercel dashboard
   [ ] npm run build passes with no errors
   [ ] Test on mobile browser after deploy
```

---

## CLAUDE.md (paste into project root)

```markdown
# Agent Instructions

You operate within a 3-layer architecture that separates responsibilities to maximise reliability.

## 3-Layer Architecture

### Layer 1: Directive (directives/)
SOPs in Markdown defining objectives, inputs, scripts, outputs, edge cases.
Active directives: analyse_speech.md, analyse_prayer.md, generate_plan.md, transcribe_audio.md

### Layer 2: Orchestration (your job)
Read directives → call execution scripts in the right order → handle errors → update directives.
The Next.js API routes are also Layer 2.

### Layer 3: Execution (execution/)
Deterministic Python scripts. Reliable, testable, well-commented.
Active scripts: analyse_speech.py, analyse_prayer.py, generate_plan.py, transcribe_audio.py, count_fillers.py

## Self-Correction Loop
1. Fix the error
2. Update the script
3. Test it
4. Update the directive
5. System is now stronger

## Project: SpeakUp v2
Personal AI public speaking coach. Five screens: Dashboard, Learn, Practice, Prayer, Progress.
Core content powered by data/vinh_giang.json (Vinh Giang transcripts).
Read STRUCTURE.md fully before any changes.

## Tech Stack
Next.js 14 + TypeScript + Tailwind CSS (App Router)
Python execution scripts called via Next.js API routes
Whisper API for transcription · Claude API for analysis · No YouTube in app

## Brand Guidelines
Always check brand-guidelines.md before any frontend work.

## Architecture Rules
- API keys NEVER client-side. Always through app/api/ routes.
- contentLibrary.ts is the ONLY place that reads vinh_giang.json
- userProgress.ts is the ONLY place that reads/writes localStorage
- ScoreCard.tsx and PrayerScoreCard.tsx are NOT interchangeable
- PrayerPhraseBank.tsx is prayer-only — do not reuse elsewhere
- data/ folder is read-only in the app — never write to it from frontend

## Design System
- Background: #0A0F1E · Teal: #00E5CC · Gold: #C9922A · Amber: #F59E0B · Green: #22C55E
- Prayer screen uses GOLD accent. All other screens use TEAL.
- Fonts: DM Serif Display (headings) · DM Sans (body) · JetBrains Mono (transcripts)
- Min tap target: 48px

## Filler Words
General: um, uh, er, like, so, basically, literally, right, you know, kind of, sort of, actually
Prayer-specific (count separately): "Lord just", "Father just", "God just"

## When in doubt
Ask before changing folder structure or adding dependencies.
Be pragmatic. Be reliable. Self-correct.
```
