'use client';

import { useEffect, useState } from 'react';
import TopicCard from '@/components/TopicCard';
import { getPhraseCountByContext } from '@/lib/contentLibrary';
import { getUserProgress } from '@/lib/userProgress';

const CONTEXTS = [
  { id: 'job-interviews', label: 'Job Interviews', icon: '💼' },
  { id: 'church-prayer', label: 'Church Prayer', icon: '🙏' },
  { id: 'church-announcements', label: 'Church Announcements', icon: '📢' },
  { id: 'presentations', label: 'Presentations & Pitches', icon: '🎤' },
  { id: 'storytelling', label: 'Casual Storytelling', icon: '💬' },
  { id: 'general', label: 'General Public Speaking', icon: '🗣️' },
];

export default function LearnPage() {
  const [learnedCounts, setLearnedCounts] = useState<Record<string, number>>({});
  const [phraseCounts, setPhraseCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const progress = getUserProgress();
    const counts: Record<string, number> = {};
    const phrases: Record<string, number> = {};
    for (const ctx of CONTEXTS) {
      counts[ctx.id] = progress.contextProgress[ctx.id]?.phrasesLearned ?? 0;
      phrases[ctx.id] = getPhraseCountByContext(ctx.id);
    }
    setLearnedCounts(counts);
    setPhraseCounts(phrases);
  }, []);

  const totalLearned = Object.values(learnedCounts).reduce((a, b) => a + b, 0);
  const totalPhrases = Object.values(phraseCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-6 pt-10">
      <h1 className="font-display text-3xl text-text-primary">Build Your Vocabulary</h1>
      <p className="mt-1 text-sm text-text-secondary">
        {totalPhrases > 0
          ? `${totalLearned} of ${totalPhrases} phrases learned`
          : 'Phrases load once the pipeline completes'}
      </p>

      <div className="mt-6 flex flex-col gap-3">
        {CONTEXTS.map(ctx => (
          <TopicCard
            key={ctx.id}
            contextId={ctx.id}
            label={ctx.label}
            icon={ctx.icon}
            phraseCount={phraseCounts[ctx.id] ?? 0}
            learnedCount={learnedCounts[ctx.id] ?? 0}
          />
        ))}
      </div>
    </div>
  );
}
