import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { SentenceVersion } from '@/types';

const MODEL = 'claude-sonnet-4-20250514';

const SYSTEM_PROMPT = `You are a public speaking coach trained in Vinh Giang's methodology.
The user wants to express an idea in a {context} context.
Show 5 ways to express their idea, ranging from simple to powerful.
Label each: Simple / Clear / Confident / Polished / Powerful.
Return ONLY a JSON array with no markdown:
[{ "level": "Simple", "sentence": "...", "note": "why this works in one short phrase" }]`;

const CONTEXT_LABELS: Record<string, string> = {
  'job-interviews': 'job interview',
  'church-prayer': 'church prayer',
  'church-announcements': 'church announcement',
  'presentations': 'presentation or pitch',
  'storytelling': 'casual storytelling',
  'general': 'general public speaking',
};

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
  return JSON.parse(cleaned);
}

export async function POST(req: NextRequest) {
  try {
    const { idea, context } = await req.json() as { idea: string; context: string };

    if (!idea?.trim()) {
      return NextResponse.json({ error: 'Idea is required' }, { status: 400 });
    }

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const ctxLabel = CONTEXT_LABELS[context] ?? 'public speaking';
    const system = SYSTEM_PROMPT.replace('{context}', ctxLabel);

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: 'user', content: `My rough idea: ${idea}` }],
    });

    const block = response.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response');

    const versions = parseJSON<SentenceVersion[]>(block.text);
    return NextResponse.json(versions);
  } catch (err) {
    console.error('sentence-builder error:', err);
    return NextResponse.json(
      { error: 'Failed to build sentences' },
      { status: 500 }
    );
  }
}
