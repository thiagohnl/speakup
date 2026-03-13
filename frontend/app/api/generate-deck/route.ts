import { NextRequest, NextResponse } from 'next/server';
import { DrillCard } from '@/types';
import { getDeck, getShuffledDeck } from '@/lib/decks';

export async function POST(req: NextRequest) {
  try {
    const { deck } = await req.json();

    if (!deck || typeof deck !== 'string') {
      return NextResponse.json([], { status: 400 });
    }

    const hardcoded = getDeck(deck);

    // Try to enrich with Vinh content if available and API key exists
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (apiKey && apiKey !== 'your_key') {
      try {
        const enriched = await enrichWithVinh(deck, hardcoded, apiKey);
        return NextResponse.json(shuffle(enriched));
      } catch {
        // Fall through to hardcoded
      }
    }

    return NextResponse.json(getShuffledDeck(deck));
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}

async function enrichWithVinh(
  deckId: string,
  hardcoded: DrillCard[],
  apiKey: string
): Promise<DrillCard[]> {
  // Dynamic import to avoid bundling if not needed
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const fs = await import('fs');
  const path = await import('path');

  const vinhPath = path.join(process.cwd(), '..', 'data', 'vinh_giang.json');
  const raw = fs.readFileSync(vinhPath, 'utf-8');
  const vinh = JSON.parse(raw);

  if (!vinh.all_phrases || vinh.all_phrases.length === 0) {
    return hardcoded;
  }

  const client = new Anthropic({ apiKey });
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 2048,
    messages: [{
      role: 'user',
      content: `Convert up to 10 of these speaking phrases into drill cards for a "${deckId}" deck.

Each card must be valid JSON with these fields:
- id: string starting with "vinh-"
- deck: "${deckId}"
- situation: a realistic situation (1 sentence)
- phrase: the model phrase to practice (15-40 words)
- tip: one coaching tip
- level: "beginner" | "intermediate" | "advanced"

Source phrases:
${JSON.stringify(vinh.all_phrases.slice(0, 20))}

Return ONLY a JSON array of DrillCard objects. No markdown, no explanation.`
    }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const vinhCards = JSON.parse(text) as DrillCard[];

  return [...hardcoded, ...vinhCards];
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
