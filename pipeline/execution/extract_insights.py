"""
Extract structured insights from transcripts using Claude.
Reads pipeline/.tmp/raw_transcripts/*.txt
Output: data/vinh_giang.json
Progress saved to pipeline/.tmp/insights_progress.json (resume-safe)
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent

SYSTEM_PROMPT = """You are analysing a transcript from a public speaking coach named Vinh Giang.
Extract structured insights from this transcript and return ONLY valid JSON.

Return this exact structure:
{
  "video_id": "...",
  "topics": ["confidence", "storytelling", "vocal_variety", "presence", "structure", "vocabulary", "prayer_speaking", "other"],
  "key_phrases": [
    { "phrase": "...", "context": "one sentence explaining when to use it", "topic": "..." }
  ],
  "vocabulary": [
    { "word": "...", "meaning": "...", "example_sentence": "..." }
  ],
  "frameworks": [
    { "name": "...", "steps": ["..."], "topic": "..." }
  ],
  "principles": [
    { "title": "...", "explanation": "...", "topic": "..." }
  ],
  "example_sentences": [
    { "situation": "opening a speech", "sentence": "...", "topic": "..." }
  ]
}

Extract only what is genuinely present in the transcript.
Return an empty array [] for sections with nothing relevant.
Return ONLY the JSON object, no preamble, no markdown."""

RETRY_PROMPT = """Return ONLY a valid JSON object. No text before or after. No markdown code fences.
The JSON must start with { and end with }."""


def load_env():
    candidates = [ROOT / 'frontend' / '.env.local', ROOT / '.env']
    for path in candidates:
        if path.exists():
            with open(path) as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, _, value = line.partition('=')
                        os.environ.setdefault(key.strip(), value.strip().strip('"').strip("'"))


def call_claude(client, video_id: str, transcript: str, strict: bool = False) -> dict | None:
    user_content = transcript
    if strict:
        user_content = RETRY_PROMPT + '\n\n' + transcript

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=2000,
        system=SYSTEM_PROMPT,
        messages=[{'role': 'user', 'content': user_content}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown fences if present
    if raw.startswith('```'):
        lines = raw.split('\n')
        raw = '\n'.join(lines[1:-1] if lines[-1].strip() == '```' else lines[1:])

    try:
        result = json.loads(raw)
        result['video_id'] = video_id
        return result
    except json.JSONDecodeError:
        return None


def build_output(all_results: list[dict]) -> dict:
    topics_index: dict[str, list] = {
        'confidence': [], 'storytelling': [], 'vocal_variety': [],
        'presence': [], 'structure': [], 'vocabulary': [],
        'prayer_speaking': [], 'other': [],
    }
    all_phrases = []
    all_vocabulary = []
    all_frameworks = []
    all_principles = []
    all_example_sentences = []
    seen_words: set[str] = set()

    for r in all_results:
        video_id = r.get('video_id', '')
        topics = r.get('topics', [])

        for phrase in r.get('key_phrases', []):
            phrase['video_id'] = video_id
            phrase['id'] = f"phrase-{len(all_phrases)}"
            all_phrases.append(phrase)
            for topic in topics:
                if topic in topics_index:
                    topics_index[topic].append({'type': 'phrase', **phrase})

        for vocab in r.get('vocabulary', []):
            word = vocab.get('word', '').lower()
            if word and word not in seen_words:
                seen_words.add(word)
                vocab['video_id'] = video_id
                vocab['id'] = f"vocab-{len(all_vocabulary)}"
                if 'topic' not in vocab:
                    vocab['topic'] = topics[0] if topics else 'general'
                all_vocabulary.append(vocab)

        for fw in r.get('frameworks', []):
            fw['video_id'] = video_id
            all_frameworks.append(fw)

        for p in r.get('principles', []):
            p['video_id'] = video_id
            all_principles.append(p)
            topic = p.get('topic', 'other')
            if topic in topics_index:
                topics_index[topic].append({'type': 'principle', **p})

        for ex in r.get('example_sentences', []):
            ex['video_id'] = video_id
            all_example_sentences.append(ex)

    return {
        'source': 'Vinh Giang (@askvinh)',
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'total_videos_processed': len(all_results),
        'topics_index': topics_index,
        'all_phrases': all_phrases,
        'all_vocabulary': all_vocabulary,
        'all_frameworks': all_frameworks,
        'all_principles': all_principles,
        'all_example_sentences': all_example_sentences,
    }


def main():
    load_env()

    try:
        import anthropic
    except ImportError:
        print('ERROR: anthropic not installed. Run: pip install anthropic')
        sys.exit(1)

    api_key = os.environ.get('ANTHROPIC_API_KEY')
    if not api_key:
        print('ERROR: ANTHROPIC_API_KEY not set in .env')
        sys.exit(1)

    client = anthropic.Anthropic(api_key=api_key)

    tmp_dir = Path(__file__).parent.parent / '.tmp'
    transcripts_dir = tmp_dir / 'raw_transcripts'
    progress_path = tmp_dir / 'insights_progress.json'
    out_path = ROOT / 'data' / 'vinh_giang.json'
    out_path.parent.mkdir(exist_ok=True)

    if not transcripts_dir.exists():
        print(f'ERROR: {transcripts_dir} not found. Run fetch_transcripts.py first.')
        sys.exit(1)

    # Load progress (resume support)
    if progress_path.exists():
        progress = json.loads(progress_path.read_text())
        print(f'Resuming — {len(progress["results"])} already processed')
    else:
        progress = {'processed_ids': [], 'results': []}

    processed_ids = set(progress['processed_ids'])
    all_results = progress['results']

    txt_files = sorted(transcripts_dir.glob('*.txt'))
    total = len(txt_files)
    print(f'Found {total} transcript files')

    new_count = 0
    for i, txt_path in enumerate(txt_files, 1):
        video_id = txt_path.stem

        if video_id in processed_ids:
            print(f'Skipping {i}/{total}: {video_id} (already processed)')
            continue

        print(f'Processing transcript {i} of {total}: {video_id}')
        transcript = txt_path.read_text(encoding='utf-8')
        word_count = len(transcript.split())

        if word_count < 200:
            print(f'  Skipping — too short ({word_count} words)')
            processed_ids.add(video_id)
            progress['processed_ids'].append(video_id)
            progress_path.write_text(json.dumps(progress, indent=2))
            continue

        result = call_claude(client, video_id, transcript)
        if result is None:
            print(f'  Malformed JSON, retrying with strict prompt...')
            result = call_claude(client, video_id, transcript, strict=True)
            if result is None:
                print(f'  Still malformed, skipping.')
                processed_ids.add(video_id)
                progress['processed_ids'].append(video_id)
                progress_path.write_text(json.dumps(progress, indent=2))
                continue

        all_results.append(result)
        processed_ids.add(video_id)
        progress['processed_ids'].append(video_id)
        progress['results'] = all_results
        progress_path.write_text(json.dumps(progress, indent=2))
        new_count += 1
        print(f'  Done ({len(result.get("key_phrases", []))} phrases, {len(result.get("frameworks", []))} frameworks)')

    output = build_output(all_results)
    out_path.write_text(json.dumps(output, indent=2, ensure_ascii=False))

    total_insights = (
        len(output['all_phrases']) +
        len(output['all_vocabulary']) +
        len(output['all_frameworks']) +
        len(output['all_principles']) +
        len(output['all_example_sentences'])
    )
    print(f'\nDone. data/vinh_giang.json written. {total_insights} insights extracted.')

if __name__ == '__main__':
    main()
