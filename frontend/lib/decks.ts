import { DrillCard, DeckMeta } from '@/types';
import { getDeckLastPlayed } from './userProgress';

import jobInterviews from '../../data/decks/job-interviews.json';
import churchPrayer from '../../data/decks/church-prayer.json';
import churchAnnouncements from '../../data/decks/church-announcements.json';
import presentations from '../../data/decks/presentations.json';
import storytelling from '../../data/decks/storytelling.json';
import generalConfidence from '../../data/decks/general-confidence.json';

const DECKS: Record<string, DrillCard[]> = {
  'job-interviews': jobInterviews as DrillCard[],
  'church-prayer': churchPrayer as DrillCard[],
  'church-announcements': churchAnnouncements as DrillCard[],
  'presentations': presentations as DrillCard[],
  'storytelling': storytelling as DrillCard[],
  'general-confidence': generalConfidence as DrillCard[],
};

const DECK_META_LIST: Omit<DeckMeta, 'phraseCount' | 'lastPlayed'>[] = [
  { id: 'job-interviews', name: 'Job Interviews', emoji: '💼', accentColour: '#00E5CC' },
  { id: 'church-prayer', name: 'Church Prayer', emoji: '🙏', accentColour: '#C9922A' },
  { id: 'church-announcements', name: 'Church Announcements', emoji: '📢', accentColour: '#C9922A' },
  { id: 'presentations', name: 'Presentations', emoji: '🎤', accentColour: '#00E5CC' },
  { id: 'storytelling', name: 'Storytelling', emoji: '💬', accentColour: '#00E5CC' },
  { id: 'general-confidence', name: 'General Confidence', emoji: '🗣️', accentColour: '#00E5CC' },
];

export function getDeckMeta(): DeckMeta[] {
  return DECK_META_LIST.map(m => ({
    ...m,
    phraseCount: (DECKS[m.id] || []).length,
    lastPlayed: getDeckLastPlayed(m.id),
  }));
}

export function getDeck(deckId: string): DrillCard[] {
  return DECKS[deckId] || [];
}

export function getShuffledDeck(deckId: string): DrillCard[] {
  const cards = [...getDeck(deckId)];
  // Fisher-Yates shuffle
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}
