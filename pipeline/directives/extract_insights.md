# Directive: Extract Insights

## Objective
Read all transcripts in `pipeline/.tmp/raw_transcripts/`, send each to Claude with a structured extraction prompt, and accumulate results into `data/vinh_giang.json`.

## Input
- `pipeline/.tmp/raw_transcripts/*.txt` (from fetch_transcripts step)
- `ANTHROPIC_API_KEY` from `.env`

## Output
- `data/vinh_giang.json` — master content library
- `pipeline/.tmp/insights_progress.json` — resume checkpoint

## Script
`pipeline/execution/extract_insights.py`

## Claude Model
`claude-sonnet-4-20250514`, max_tokens: 2000

## Extraction Schema
Each video yields:
- `topics[]` — which of: confidence, storytelling, vocal_variety, presence, structure, vocabulary, prayer_speaking, other
- `key_phrases[]` — { phrase, context, topic }
- `vocabulary[]` — { word, meaning, example_sentence }
- `frameworks[]` — { name, steps[], topic }
- `principles[]` — { title, explanation, topic }
- `example_sentences[]` — { situation, sentence, topic }

## Processing Rules
1. Skip transcripts under 200 words
2. If Claude returns malformed JSON, retry once with stricter prompt
3. If still malformed, skip that video
4. Save progress after every video (resume-safe)
5. Vocabulary deduplication: by lowercase word across all videos
6. `topics_index` groups insights by topic for fast frontend filtering

## Edge Cases
- Script interrupted mid-run: restart safely; already-processed videos skipped
- Markdown fences in response: stripped before JSON parsing
- Missing ANTHROPIC_API_KEY: exits with clear error
- Import error: reminds user to run `pip install anthropic`
