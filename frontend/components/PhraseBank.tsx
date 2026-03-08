'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import CollapsibleSection from '@/components/CollapsibleSection';
import { getPhrasesByTopic, getVocabularyByTopic } from '@/lib/contentLibrary';

// Hardcoded fallback phrases for prayer mode (used when pipeline data is empty)
const PRAYER_FALLBACK_SECTIONS = [
  {
    title: 'Opening Addresses',
    phrases: [
      'Gracious Father',
      'Lord of heaven and earth',
      'Almighty God, our refuge and strength',
      'Heavenly Father, we come before you',
      'Lord, we gather in your presence',
      'God of all grace and mercy',
    ],
  },
  {
    title: 'Acknowledgement Lines',
    phrases: [
      'We acknowledge that you are sovereign over all things',
      'We thank you for your faithfulness that endures',
      'We praise you for who you are — our provider and sustainer',
      'You are the God who sees us and knows our needs',
      'Your love never fails, and your mercy is new every morning',
      'We stand in awe of your goodness to us',
    ],
  },
  {
    title: 'Transition Phrases',
    phrases: [
      'And so, Lord, we bring before you...',
      'With grateful hearts, we now ask...',
      'As we reflect on your goodness, we also lift up...',
      'Father, hear us now as we pray for...',
    ],
  },
  {
    title: 'Strong Closings',
    phrases: [
      'In the mighty name of Jesus we pray, Amen',
      'We trust you with all of this, Lord. Amen',
      'May your will be done in all things. Amen',
      'We leave it in your faithful hands. Amen',
    ],
  },
];

const GENERAL_TABS = [
  { key: 'confidence', label: 'Confidence' },
  { key: 'storytelling', label: 'Storytelling' },
  { key: 'vocal_variety', label: 'Vocal Variety' },
  { key: 'presence', label: 'Presence' },
  { key: 'structure', label: 'Structure' },
];

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      onClick={handleCopy}
      className="flex h-8 w-8 items-center justify-center rounded-lg text-text-secondary transition-colors hover:text-gold"
      aria-label="Copy phrase"
    >
      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

function PhraseList({ phrases }: { phrases: string[] }) {
  return (
    <>
      {phrases.map((phrase, i) => (
        <div key={i} className="flex items-center justify-between gap-2 py-2">
          <p className="text-sm text-text-primary italic">&ldquo;{phrase}&rdquo;</p>
          <CopyButton text={phrase} />
        </div>
      ))}
    </>
  );
}

// Prayer tab: uses pipeline data if available, falls back to hardcoded
function PrayerTab() {
  const prayerPhrases = getPhrasesByTopic('prayer_speaking');

  if (prayerPhrases.length > 0) {
    return (
      <div className="space-y-3">
        <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
          <p className="text-xs text-gold">
            These are inspiration, not scripts. Let them spark your own words.
          </p>
        </div>
        <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
          <div className="px-4 py-2">
            <PhraseList phrases={prayerPhrases.map(p => p.phrase)} />
          </div>
        </div>
      </div>
    );
  }

  // Fallback to hardcoded prayer phrases
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
        <p className="text-xs text-gold">
          These are inspiration, not scripts. Let them spark your own words.
        </p>
      </div>
      {PRAYER_FALLBACK_SECTIONS.map(section => (
        <CollapsibleSection key={section.title} title={section.title}>
          <PhraseList phrases={section.phrases} />
        </CollapsibleSection>
      ))}
    </div>
  );
}

// General topic tab: phrases + vocabulary from pipeline data
function TopicTab({ topic }: { topic: string }) {
  const phrases = getPhrasesByTopic(topic);
  const vocab = getVocabularyByTopic(topic);

  if (phrases.length === 0 && vocab.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-text-secondary">
        No content yet for this topic — run the pipeline to populate it.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {phrases.length > 0 && (
        <CollapsibleSection title="Key Phrases">
          <PhraseList phrases={phrases.map(p => p.phrase)} />
        </CollapsibleSection>
      )}
      {vocab.length > 0 && (
        <CollapsibleSection title="Vocabulary">
          <PhraseList phrases={vocab.map(v => `${v.word} — ${v.meaning}`)} />
        </CollapsibleSection>
      )}
    </div>
  );
}

interface PhraseBankProps {
  mode?: 'prayer' | 'general';
}

export default function PhraseBank({ mode = 'general' }: PhraseBankProps) {
  const [activeTab, setActiveTab] = useState(GENERAL_TABS[0].key);

  if (mode === 'prayer') {
    return <PrayerTab />;
  }

  return (
    <div className="space-y-4">
      {/* Topic tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {GENERAL_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`min-h-[40px] shrink-0 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
              activeTab === tab.key
                ? 'bg-teal text-navy'
                : 'bg-white/5 text-text-secondary hover:text-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <TopicTab topic={activeTab} />

      <p className="text-center text-xs text-text-secondary">
        Source: Vinh Giang (@askvinh)
      </p>
    </div>
  );
}
