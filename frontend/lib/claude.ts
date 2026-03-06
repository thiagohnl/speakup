import Anthropic from '@anthropic-ai/sdk';
import { SpeechMetrics, PrayerMetrics, ConversationTurn } from '@/types';
import { PRAYER_SCENARIOS } from './prayerScenarios';

function getAnthropic() {
  return new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
}

const MODEL = 'claude-sonnet-4-20250514';

const SPEECH_REVIEW_PROMPT = `You are a professional speech coach with 20 years of experience.
Analyse this full transcript from a {scenario} practice session.
Return a detailed JSON scorecard with these exact fields:
{
  "wordsPerMinute": number (estimate based on word count and typical speech pace),
  "pauseCount": number (estimated from transcript patterns),
  "longestPause": number (seconds, estimated),
  "vocabularyRichness": number (0-1, unique words / total words),
  "clarityScore": number (1-10),
  "confidenceSignals": string[] (positive signals detected),
  "weaknessSignals": string[] (areas to improve),
  "tips": string[] (top 3 actionable tips),
  "highlight": string (one thing done genuinely well)
}
Be direct and honest. Return ONLY valid JSON, no markdown, no explanation.`;

const SPEECH_LIVE_PROMPT = `You are a professional speech coach with 20 years of experience.
Analyse the following spoken response and return JSON only.
Score pace (slow/good/fast), count filler words, rate confidence 1-10,
give one tip and one praise. Keep feedback under 50 words total.
Return ONLY valid JSON with these exact fields:
{
  "pace": "slow" | "good" | "fast",
  "fillerCount": number,
  "confidence": number (1-10),
  "tip": string,
  "praise": string
}`;

const PRAYER_PROMPT = `You are a compassionate but honest church speaking coach with 20 years of experience
helping everyday believers pray and speak with confidence in front of congregations.
Analyse this prayer transcript from a {scenario} practice session.
Return a JSON scorecard with these exact fields:
{
  "structureScore": number (1-10, did it follow Address, Acknowledgement, Intercession, Close?),
  "structureBreakdown": { "address": boolean, "acknowledgement": boolean, "intercession": boolean, "close": boolean },
  "lengthRating": "too_short" | "ideal" | "too_long" (based on target duration: {duration}),
  "warmthScore": number (1-10, does it lead the congregation or perform to them?),
  "clarityScore": number (1-10, can the congregation follow and agree?),
  "tips": string[] (top 3 actionable improvements),
  "highlight": string (one thing done genuinely well)
}
Be direct, specific, and encouraging. Avoid vague praise. Return ONLY valid JSON.`;

const CONVERSATION_SYSTEM = `You are a professional speech coach conducting a practice session.
The scenario is: {scenario}.
Ask engaging, realistic questions that would come up in this scenario.
Keep your responses concise (2-3 sentences). Be encouraging but push the user to improve.
After the first exchange, build on what the user said in previous turns.`;

async function callClaude(systemPrompt: string, userMessage: string): Promise<string> {
  const response = await getAnthropic().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }],
  });

  const block = response.content[0];
  if (block.type === 'text') return block.text;
  throw new Error('Unexpected response type from Claude');
}

function parseJSON<T>(text: string): T {
  // Strip markdown code fences if present
  const cleaned = text.replace(/^```(?:json)?\n?/gm, '').replace(/\n?```$/gm, '').trim();
  return JSON.parse(cleaned);
}

export async function analyseSpeech(
  transcript: string,
  scenario: string,
  mode: 'live' | 'review'
): Promise<Partial<SpeechMetrics>> {
  const prompt = mode === 'review'
    ? SPEECH_REVIEW_PROMPT.replace('{scenario}', scenario)
    : SPEECH_LIVE_PROMPT;

  try {
    const result = await callClaude(prompt, `Transcript:\n${transcript}`);
    return parseJSON(result);
  } catch {
    // Retry with stricter prompt
    const strictPrompt = `${prompt}\n\nIMPORTANT: You MUST return ONLY valid JSON. No text before or after.`;
    const result = await callClaude(strictPrompt, `Transcript:\n${transcript}`);
    return parseJSON(result);
  }
}

export async function analysePrayer(
  transcript: string,
  scenarioId: string
): Promise<Partial<PrayerMetrics>> {
  const scenario = PRAYER_SCENARIOS.find(s => s.id === scenarioId);
  const scenarioLabel = scenario?.label ?? 'General prayer';
  const duration = scenario?.duration ?? '1-2 minutes';

  const prompt = PRAYER_PROMPT
    .replace('{scenario}', scenarioLabel)
    .replace('{duration}', duration);

  try {
    const result = await callClaude(prompt, `Prayer transcript:\n${transcript}`);
    return parseJSON(result);
  } catch {
    const strictPrompt = `${prompt}\n\nIMPORTANT: You MUST return ONLY valid JSON. No text before or after.`;
    const result = await callClaude(strictPrompt, `Prayer transcript:\n${transcript}`);
    return parseJSON(result);
  }
}

export async function generateConversationTurn(
  history: ConversationTurn[],
  scenario: string
): Promise<{ aiResponse: string }> {
  const systemPrompt = CONVERSATION_SYSTEM.replace('{scenario}', scenario);

  const messages: Anthropic.MessageParam[] = history.map(turn => ({
    role: turn.role === 'ai' ? 'assistant' as const : 'user' as const,
    content: turn.text,
  }));

  // If no history, ask Claude to start the conversation
  if (messages.length === 0) {
    messages.push({
      role: 'user',
      content: 'Start the practice session. Ask me the first question.',
    });
  }

  const response = await getAnthropic().messages.create({
    model: MODEL,
    max_tokens: 300,
    system: systemPrompt,
    messages,
  });

  const block = response.content[0];
  if (block.type === 'text') {
    return { aiResponse: block.text };
  }
  throw new Error('Unexpected response type from Claude');
}
