import { NextRequest, NextResponse } from 'next/server';
import { analyseSpeech } from '@/lib/claude';
import { countFillers, calculateWPM, calculateVocabularyRichness } from '@/lib/analyser';
import { SpeechMetrics } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, scenario, mode, durationSeconds } = body;

    if (!transcript || transcript.trim().length === 0) {
      return NextResponse.json({ error: 'Empty transcript' }, { status: 400 });
    }

    const words = transcript.split(/\s+/).filter(Boolean);
    if (words.length < 10) {
      return NextResponse.json({ error: 'Transcript too short to analyse' }, { status: 400 });
    }

    // Local analysis
    const { fillerWords, fillerWordRate } = countFillers(transcript);
    const vocabularyRichness = calculateVocabularyRichness(transcript);
    const wordsPerMinute = durationSeconds
      ? calculateWPM(words.length, durationSeconds)
      : 0;

    // Claude analysis
    const claudeMetrics = await analyseSpeech(
      transcript,
      scenario ?? 'Open Practice',
      mode ?? 'review'
    );

    // Merge local + Claude metrics
    const metrics: SpeechMetrics = {
      wordsPerMinute: wordsPerMinute || (claudeMetrics.wordsPerMinute ?? 0),
      fillerWords,
      fillerWordRate,
      pauseCount: claudeMetrics.pauseCount ?? 0,
      longestPause: claudeMetrics.longestPause ?? 0,
      vocabularyRichness: vocabularyRichness || (claudeMetrics.vocabularyRichness ?? 0),
      clarityScore: claudeMetrics.clarityScore ?? 5,
      confidenceSignals: claudeMetrics.confidenceSignals ?? [],
      weaknessSignals: claudeMetrics.weaknessSignals ?? [],
      tips: claudeMetrics.tips ?? [],
      highlight: claudeMetrics.highlight ?? '',
    };

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed. Please try again.' },
      { status: 500 }
    );
  }
}
