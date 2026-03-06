import { NextRequest, NextResponse } from 'next/server';
import { analysePrayer } from '@/lib/claude';
import { countFillers, countJustFillers } from '@/lib/analyser';
import { PrayerMetrics } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, scenarioId } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'Empty transcript' }, { status: 400 });
    }

    const words = transcript.split(/\s+/).filter(Boolean);
    if (words.length < 30) {
      return NextResponse.json({ error: 'too_short' }, { status: 400 });
    }

    // Local analysis
    const { fillerWords: fillerWordList } = countFillers(transcript);
    const justFillerCount = countJustFillers(transcript);

    // Claude analysis
    const claudeMetrics = await analysePrayer(transcript, scenarioId ?? 'open-service');

    // Merge local + Claude metrics
    const metrics: PrayerMetrics = {
      structureScore: claudeMetrics.structureScore ?? 5,
      structureBreakdown: claudeMetrics.structureBreakdown ?? {
        address: false,
        acknowledgement: false,
        intercession: false,
        close: false,
      },
      justFillerCount,
      fillerWordList,
      lengthRating: claudeMetrics.lengthRating ?? 'ideal',
      warmthScore: claudeMetrics.warmthScore ?? 5,
      clarityScore: claudeMetrics.clarityScore ?? 5,
      tips: claudeMetrics.tips ?? [],
      highlight: claudeMetrics.highlight ?? '',
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Prayer analysis error:', error);
    return NextResponse.json(
      { error: 'Prayer analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
