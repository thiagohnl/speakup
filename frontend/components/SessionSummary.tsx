'use client';

import { SessionResult } from '@/types';
import { Trophy, Target, Flame, Star } from 'lucide-react';

interface Props {
  results: SessionResult[];
  streak: number;
  deck: string;
}

export default function SessionSummary({ results, streak, deck }: Props) {
  const total = results.length;
  const nailed = results.filter(r => r.passed && r.attempts === 1).length;
  const bestScore = results.length > 0 ? Math.max(...results.map(r => r.score)) : 0;
  const passed = results.filter(r => r.passed).length;

  const isChurch = deck.startsWith('church-');
  const accent = isChurch ? '#C9922A' : '#00E5CC';

  const stats = [
    { icon: Target, label: 'Drilled', value: total, colour: accent },
    { icon: Trophy, label: 'Nailed first try', value: nailed, colour: '#22C55E' },
    { icon: Flame, label: 'Streak', value: streak, colour: '#F59E0B' },
    { icon: Star, label: 'Best score', value: `${Math.round(bestScore * 100)}%`, colour: accent },
  ];

  return (
    <div className="animate-fade-in">
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map(({ icon: Icon, label, value, colour }) => (
          <div
            key={label}
            className="bg-white/5 rounded-xl p-4 text-center"
          >
            <Icon size={24} className="mx-auto mb-2" style={{ color: colour }} />
            <p className="text-2xl font-bold text-text-primary">{value}</p>
            <p className="text-xs text-text-secondary mt-1">{label}</p>
          </div>
        ))}
      </div>

      {passed > 0 && (
        <p className="text-center text-text-secondary text-sm">
          {passed === total
            ? 'Perfect session! Every phrase nailed. 🎯'
            : `${passed} out of ${total} phrases passed. Keep drilling!`}
        </p>
      )}
    </div>
  );
}
