import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import type { CoachPlan, ContextProgress } from '@/types';

const MODEL = 'claude-sonnet-4-20250514';

const CONTEXT_LABELS: Record<string, string> = {
  'job-interviews': 'Job Interviews',
  'church-prayer': 'Church Prayer',
  'church-announcements': 'Church Announcements',
  'presentations': 'Presentations & Pitches',
  'storytelling': 'Casual Storytelling',
  'general': 'General Public Speaking',
};

const CONTEXT_PATHS: Record<string, string> = {
  'job-interviews': '/learn/job-interviews',
  'church-prayer': '/learn/church-prayer',
  'church-announcements': '/learn/church-announcements',
  'presentations': '/learn/presentations',
  'storytelling': '/learn/storytelling',
  'general': '/learn/general',
};

const SYSTEM_PROMPT = `You are a personal public speaking coach.
Based on the user's progress data, generate a 7-day coaching plan.
Prioritise contexts with the lowest learned/total ratio (weakest areas first).
If the user is new (all zeros), start with Job Interviews as the default.

Return ONLY valid JSON with no markdown:
{
  "todayTask": {
    "label": "short label for today's task (max 60 chars)",
    "target": "/learn/job-interviews",
    "description": "one sentence describing what they should do today"
  },
  "weekPlan": [
    { "day": "Monday", "task": "...", "target": "/learn/..." },
    ... 7 days total
  ]
}

The "target" field must be one of these exact paths:
/learn/job-interviews, /learn/church-prayer, /learn/church-announcements,
/learn/presentations, /learn/storytelling, /learn/general, /practice, /prayer`;

function parseJSON<T>(text: string): T {
  const cleaned = text.replace(/^```(?:json)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
  return JSON.parse(cleaned);
}

function buildProgressSummary(contextProgress: Record<string, ContextProgress>): string {
  return Object.entries(contextProgress)
    .map(([ctx, cp]) => {
      const label = CONTEXT_LABELS[ctx] ?? ctx;
      const pct = cp.totalPhrases > 0 ? Math.round((cp.phrasesLearned / cp.totalPhrases) * 100) : 0;
      return `- ${label}: ${cp.phrasesLearned}/${cp.totalPhrases} phrases learned (${pct}%)${cp.lastPracticed ? `, last practiced ${cp.lastPracticed}` : ''}`;
    })
    .join('\n');
}

export async function POST(req: NextRequest) {
  try {
    const { contextProgress } = await req.json() as {
      contextProgress: Record<string, ContextProgress>;
    };

    const summary = buildProgressSummary(contextProgress ?? {});
    const userMessage = `Here is my current progress:\n${summary}\n\nCreate my 7-day coaching plan.`;

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    });

    const block = response.content[0];
    if (block.type !== 'text') throw new Error('Unexpected response');

    const plan = parseJSON<Omit<CoachPlan, 'generatedAt'>>(block.text);

    // Validate and sanitise the target paths
    const validPaths = Object.values(CONTEXT_PATHS).concat(['/practice', '/prayer']);
    if (!validPaths.includes(plan.todayTask.target)) {
      plan.todayTask.target = '/learn/job-interviews';
    }

    const result: CoachPlan = {
      ...plan,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error('plan error:', err);
    // Return a sensible default if Claude fails
    const fallback: CoachPlan = {
      todayTask: {
        label: 'Learn 5 phrases for Job Interviews',
        target: '/learn/job-interviews',
        description: 'Start with Job Interviews — the most common speaking context.',
      },
      weekPlan: [
        { day: 'Monday', task: 'Learn Job Interview phrases', target: '/learn/job-interviews' },
        { day: 'Tuesday', task: 'Practice a Job Interview', target: '/practice' },
        { day: 'Wednesday', task: 'Learn Presentation phrases', target: '/learn/presentations' },
        { day: 'Thursday', task: 'Practice a Pitch', target: '/practice' },
        { day: 'Friday', task: 'Learn Storytelling phrases', target: '/learn/storytelling' },
        { day: 'Saturday', task: 'Church Prayer practice', target: '/prayer' },
        { day: 'Sunday', task: 'Review what you learned', target: '/learn/general' },
      ],
      generatedAt: new Date().toISOString(),
    };
    return NextResponse.json(fallback);
  }
}
