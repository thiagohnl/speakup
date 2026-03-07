'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import PhraseCard from '@/components/PhraseCard';
import VocabCard from '@/components/VocabCard';
import SentenceBuilder from '@/components/SentenceBuilder';
import { getPhrasesByContext, getVocabularyByContext } from '@/lib/contentLibrary';
import { getUserProgress, markPhraselearned, markPhraseSaved, markVocabLearned } from '@/lib/userProgress';
import type { KeyPhrase, VocabularyItem, UserProgress } from '@/types';

const CONTEXT_LABELS: Record<string, string> = {
  'job-interviews': 'Job Interviews',
  'church-prayer': 'Church Prayer',
  'church-announcements': 'Church Announcements',
  'presentations': 'Presentations & Pitches',
  'storytelling': 'Casual Storytelling',
  'general': 'General Public Speaking',
};

const TABS = ['Phrases', 'Vocabulary', 'Sentence Builder'] as const;
type Tab = (typeof TABS)[number];

export default function TopicDetailPage() {
  const params = useParams();
  const router = useRouter();
  const topic = params.topic as string;

  const [activeTab, setActiveTab] = useState<Tab>('Phrases');
  const [phrases, setPhrases] = useState<KeyPhrase[]>([]);
  const [vocab, setVocab] = useState<VocabularyItem[]>([]);
  const [progress, setProgress] = useState<UserProgress | null>(null);

  useEffect(() => {
    const raw = getPhrasesByContext(topic);
    // Ensure IDs exist (fallback to slug)
    const withIds: KeyPhrase[] = raw.map((p, i) => ({
      ...p,
      id: p.id || `${topic}-phrase-${i}`,
    }));
    setPhrases(withIds);

    const rawVocab = getVocabularyByContext(topic);
    const withVocabIds: VocabularyItem[] = rawVocab.map((v, i) => ({
      ...v,
      id: v.id || `${topic}-vocab-${i}`,
    }));
    setVocab(withVocabIds);

    setProgress(getUserProgress());
  }, [topic]);

  const refresh = () => setProgress(getUserProgress());

  const handleLearnedPhrase = (id: string) => {
    markPhraselearned(id, topic);
    refresh();
  };

  const handleSavedPhrase = (id: string) => {
    markPhraseSaved(id);
    refresh();
  };

  const handleLearnedVocab = (id: string) => {
    markVocabLearned(id, topic);
    refresh();
  };

  const label = CONTEXT_LABELS[topic] ?? topic;
  const learnedPhrases = new Set(progress?.learnedPhrases ?? []);
  const savedPhrases = new Set(progress?.savedPhrases ?? []);
  const learnedVocab = new Set(progress?.learnedVocab ?? []);

  return (
    <div className="animate-fade-in mx-auto max-w-lg px-6 pt-10">
      {/* Back + Title */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1 text-sm text-text-secondary mb-4 -ml-1"
      >
        <ChevronLeft className="h-4 w-4" /> Learn
      </button>
      <h1 className="font-display text-3xl text-text-primary">{label}</h1>

      {/* Tabs */}
      <div className="mt-6 flex gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 min-h-[40px] rounded-lg text-sm font-semibold transition-colors ${
              activeTab === tab
                ? 'bg-teal text-navy'
                : 'text-text-secondary'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="mt-6 pb-6">
        {/* Phrases Tab */}
        {activeTab === 'Phrases' && (
          <div className="space-y-4">
            {phrases.length === 0 ? (
              <EmptyState message="Phrases will appear here once the pipeline finishes scraping Vinh Giang's content." />
            ) : (
              phrases.map(phrase => (
                <PhraseCard
                  key={phrase.id}
                  phrase={phrase}
                  isLearned={learnedPhrases.has(phrase.id)}
                  isSaved={savedPhrases.has(phrase.id)}
                  onLearned={handleLearnedPhrase}
                  onSaved={handleSavedPhrase}
                />
              ))
            )}
          </div>
        )}

        {/* Vocabulary Tab */}
        {activeTab === 'Vocabulary' && (
          <div className="space-y-4">
            {vocab.length === 0 ? (
              <EmptyState message="Vocabulary will appear here once the pipeline finishes." />
            ) : (
              vocab.map(item => (
                <VocabCard
                  key={item.id}
                  item={item}
                  isLearned={learnedVocab.has(item.id)}
                  isSaved={savedPhrases.has(item.id)}
                  onLearned={handleLearnedVocab}
                  onSaved={handleSavedPhrase}
                />
              ))
            )}
          </div>
        )}

        {/* Sentence Builder Tab */}
        {activeTab === 'Sentence Builder' && (
          <SentenceBuilder context={topic} />
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center">
      <p className="text-2xl mb-3">⏳</p>
      <p className="text-sm text-text-secondary">{message}</p>
    </div>
  );
}
