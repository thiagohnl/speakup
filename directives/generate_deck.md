# Directive: Generate Deck

## Objective
Enrich a hardcoded drill deck with additional cards from vinh_giang.json via the Claude API.
Called once per deck selection (not per session). The result is stored in sessionStorage.

## Input
- `deck` (string): One of: job-interviews, church-prayer, church-announcements, presentations, storytelling, general-confidence
- Hardcoded deck from `data/decks/{deck}.json`
- `data/vinh_giang.json` (may be empty or have `all_phrases: []`)

## Output
- Shuffled JSON array of DrillCard objects (hardcoded + up to 10 Vinh-enriched cards)

## Deck-to-Topic Mapping
| Deck | Vinh Topics |
|------|-------------|
| job-interviews | confidence, structure, vocabulary, communication |
| church-prayer | presence, confidence, communication, connection |
| church-announcements | structure, presence, communication |
| presentations | vocal_variety, structure, presence |
| storytelling | vocal_variety, presence, connection, communication |
| general-confidence | confidence, vocal_variety, presence |

## Process
1. Load hardcoded deck via `getDeck(deckId)`
2. Check if `ANTHROPIC_API_KEY` is set and valid
3. Read `data/vinh_giang.json`, check if `all_phrases` has items
4. If yes: send up to 20 relevant phrases to Claude, ask for 10 DrillCards with id prefix `vinh-`
5. Merge hardcoded + Vinh cards, shuffle with Fisher-Yates
6. Return merged array

## Edge Cases
- `vinh_giang.json` empty or missing → return shuffled hardcoded deck only
- `ANTHROPIC_API_KEY` not set → return shuffled hardcoded deck only
- Claude API error → return shuffled hardcoded deck only
- Empty hardcoded deck → return empty array (deck not yet populated)
- **Never crash** — wrap everything in try/catch

## Script
Logic lives in `frontend/app/api/generate-deck/route.ts`
