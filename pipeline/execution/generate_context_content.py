"""
Generate context-specific phrase banks, vocabulary, and example sentences
using Claude, informed by Vinh Giang's extracted principles.

Reads: frontend/data/vinh_giang.json (principles + frameworks as teaching foundation)
Output: frontend/data/context_content.json + data/context_content.json
Progress: pipeline/.tmp/context_gen_progress.json (resume-safe)
"""
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).parent.parent.parent

CONTEXTS = {
    'job-interviews': {
        'label': 'Job Interviews',
        'sections': [
            'Opening with Confidence',
            'Answering Behavioral Questions',
            'Talking About Weaknesses',
            'Closing Strong',
        ],
        'description': 'Professional job interview settings — phone screens, panel interviews, and one-on-ones.',
    },
    'church-prayer': {
        'label': 'Church Prayer',
        'sections': [
            'Opening Addresses',
            'Acknowledgement Lines',
            'Transition Phrases',
            'Strong Closings',
        ],
        'description': 'Leading prayer in church — congregational prayer, small group prayer, and spontaneous prayer.',
    },
    'church-announcements': {
        'label': 'Church Announcements',
        'sections': [
            'Getting Attention',
            'Delivering the Message',
            'Call to Action',
            'Warm Closings',
        ],
        'description': 'Making announcements in church — events, updates, welcomes, and calls to action.',
    },
    'presentations': {
        'label': 'Presentations & Pitches',
        'sections': [
            'Opening Hooks',
            'Transition Phrases',
            'Emphasizing Key Points',
            'Memorable Closings',
        ],
        'description': 'Business presentations, pitches, and formal talks — boardrooms, conferences, and meetings.',
    },
    'storytelling': {
        'label': 'Casual Storytelling',
        'sections': [
            'Setting the Scene',
            'Building Tension',
            'Delivering the Punchline',
            'Tying It Together',
        ],
        'description': 'Casual storytelling — social gatherings, dinner parties, and everyday conversations.',
    },
    'general': {
        'label': 'General Public Speaking',
        'sections': [
            'Starting Any Speech',
            'Commanding Attention',
            'Handling Nerves',
            'Ending Memorably',
        ],
        'description': 'Any public speaking situation — toasts, introductions, impromptu remarks, and more.',
    },
}

SYSTEM_PROMPT = """You are a public speaking coach creating a practical phrase bank for students.
You follow Vinh Giang's teaching philosophy: voice is an instrument, confidence comes from practice,
structure beats improvisation, and connection matters more than perfection.

Here are Vinh Giang's core principles and frameworks that should inform your content:

{principles}

Generate content that people can MEMORISE and PRACTISE OUT LOUD.
These should be ready-to-use phrases — not advice about speaking, but actual words to say.
Return ONLY valid JSON, no markdown fences, no preamble."""


def build_user_prompt(context_id: str, config: dict) -> str:
    sections_json = json.dumps(config['sections'])
    return f"""Generate a comprehensive phrase bank for the context: "{config['label']}"
Setting: {config['description']}

Return this exact JSON structure:
{{
  "phrase_sections": [
    {{
      "title": "<section title>",
      "phrases": [
        {{ "phrase": "the actual words to say", "when_to_use": "one sentence explaining the situation" }}
      ]
    }}
  ],
  "vocabulary": [
    {{ "word": "...", "meaning": "...", "example_sentence": "a full sentence using this word in the context of {config['label'].lower()}" }}
  ],
  "example_sentences": [
    {{ "situation": "specific scenario in {config['label'].lower()}", "sentence": "the complete sentence to say" }}
  ]
}}

Requirements:
- Use these exact section titles in order: {sections_json}
- Generate 15-20 phrases per section (60-80 total phrases)
- Generate 15 vocabulary words relevant to {config['label'].lower()}
- Generate 10 example sentences for common {config['label'].lower()} situations
- Phrases must be ACTUAL WORDS TO SAY, not advice. Good: "I'd love to walk you through my experience with..." Bad: "Use confident body language"
- Vary difficulty: mix simple everyday phrases with more polished/advanced ones
- Make phrases natural — how a real person would speak, not robotic
- For vocabulary: choose words that elevate speaking in this specific context"""


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


def load_principles() -> str:
    """Load Vinh Giang's principles and frameworks as context for generation."""
    data_path = ROOT / 'frontend' / 'data' / 'vinh_giang.json'
    if not data_path.exists():
        return 'No principles available — generate from general public speaking knowledge.'

    data = json.loads(data_path.read_text())
    parts = []

    for p in data.get('all_principles', []):
        parts.append(f"- {p['title']}: {p['explanation']}")

    for fw in data.get('all_frameworks', []):
        steps = ', '.join(fw.get('steps', []))
        parts.append(f"- Framework: {fw['name']} — Steps: {steps}")

    for phrase in data.get('all_phrases', [])[:20]:
        parts.append(f'- Key phrase: "{phrase["phrase"]}" ({phrase.get("context", "")})')

    return '\n'.join(parts) if parts else 'Generate from general public speaking knowledge.'


def call_claude(client, context_id: str, config: dict, principles: str) -> dict | None:
    system = SYSTEM_PROMPT.format(principles=principles)
    user = build_user_prompt(context_id, config)

    message = client.messages.create(
        model='claude-sonnet-4-20250514',
        max_tokens=8000,
        system=system,
        messages=[{'role': 'user', 'content': user}],
    )

    raw = message.content[0].text.strip()

    # Strip markdown fences if present
    if raw.startswith('```'):
        lines = raw.split('\n')
        raw = '\n'.join(lines[1:-1] if lines[-1].strip() == '```' else lines[1:])

    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return None


def add_ids(context_id: str, result: dict) -> dict:
    """Add id, context, and topic fields to all items."""
    phrase_count = 0
    for section in result.get('phrase_sections', []):
        for phrase in section.get('phrases', []):
            phrase['id'] = f'{context_id}-phrase-{phrase_count}'
            phrase['context'] = context_id
            phrase['topic'] = 'confidence'
            phrase_count += 1

    for i, vocab in enumerate(result.get('vocabulary', [])):
        vocab['id'] = f'{context_id}-vocab-{i}'
        vocab['context'] = context_id
        vocab['topic'] = 'vocabulary'

    for i, ex in enumerate(result.get('example_sentences', [])):
        ex['context'] = context_id
        ex['topic'] = 'structure'

    return result


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
    tmp_dir.mkdir(exist_ok=True)
    progress_path = tmp_dir / 'context_gen_progress.json'

    out_path = ROOT / 'frontend' / 'data' / 'context_content.json'
    out_path.parent.mkdir(exist_ok=True)
    root_copy = ROOT / 'data' / 'context_content.json'
    root_copy.parent.mkdir(exist_ok=True)

    # Load progress (resume support)
    if progress_path.exists():
        progress = json.loads(progress_path.read_text())
        print(f'Resuming — {len(progress["completed"])} contexts already generated')
    else:
        progress = {'completed': [], 'results': {}}

    principles = load_principles()
    print(f'Loaded principles ({len(principles)} chars)')

    for context_id, config in CONTEXTS.items():
        if context_id in progress['completed']:
            print(f'Skipping {context_id} (already generated)')
            continue

        print(f'Generating content for: {config["label"]}...')
        result = call_claude(client, context_id, config, principles)

        if result is None:
            print(f'  ERROR: Malformed JSON for {context_id}, retrying...')
            result = call_claude(client, context_id, config, principles)
            if result is None:
                print(f'  Still malformed, skipping {context_id}.')
                continue

        result = add_ids(context_id, result)
        progress['results'][context_id] = result
        progress['completed'].append(context_id)
        progress_path.write_text(json.dumps(progress, indent=2, ensure_ascii=False))

        phrase_count = sum(len(s.get('phrases', [])) for s in result.get('phrase_sections', []))
        vocab_count = len(result.get('vocabulary', []))
        print(f'  Done: {phrase_count} phrases, {vocab_count} vocab')

    # Build final output
    output = {
        'generated_at': datetime.now(timezone.utc).isoformat(),
        'source_principles_count': len(json.loads((ROOT / 'frontend' / 'data' / 'vinh_giang.json').read_text()).get('all_principles', [])),
        'contexts': progress['results'],
    }

    json_str = json.dumps(output, indent=2, ensure_ascii=False)
    out_path.write_text(json_str)
    root_copy.write_text(json_str)

    total_phrases = sum(
        sum(len(s.get('phrases', [])) for s in ctx.get('phrase_sections', []))
        for ctx in progress['results'].values()
    )
    total_vocab = sum(len(ctx.get('vocabulary', [])) for ctx in progress['results'].values())
    print(f'\nDone. {len(progress["results"])} contexts, {total_phrases} phrases, {total_vocab} vocab items.')
    print(f'Written to {out_path}')


if __name__ == '__main__':
    main()
