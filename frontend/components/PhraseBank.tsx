'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp, Copy, Check } from 'lucide-react';

const SECTIONS = [
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

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
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

export default function PhraseBank() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggle = (title: string) => {
    setOpenSections(prev => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-gold/20 bg-gold/5 px-4 py-3">
        <p className="text-xs text-gold">
          These are inspiration, not scripts. Let them spark your own words.
        </p>
      </div>

      {SECTIONS.map(section => {
        const isOpen = openSections[section.title] ?? false;
        return (
          <div key={section.title} className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
            <button
              onClick={() => toggle(section.title)}
              className="flex w-full min-h-[48px] items-center justify-between px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold text-text-primary">{section.title}</span>
              {isOpen ? (
                <ChevronUp className="h-4 w-4 text-text-secondary" />
              ) : (
                <ChevronDown className="h-4 w-4 text-text-secondary" />
              )}
            </button>
            {isOpen && (
              <div className="border-t border-white/10 px-4 py-2">
                {section.phrases.map((phrase, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-2 py-2"
                  >
                    <p className="text-sm text-text-primary italic">&ldquo;{phrase}&rdquo;</p>
                    <CopyButton text={phrase} />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
