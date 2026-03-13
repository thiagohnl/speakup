import { DrillCard, DeckMeta } from '@/types';
import { getDeckLastPlayed, getDeckMasteryPercent, getDeckCrownTier, getSmartMixPhraseIds, getProgress } from './userProgress';

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

const DECK_META_BASE: { id: string; name: string; emoji: string; accentColour: string }[] = [
  { id: 'job-interviews', name: 'Job Interviews', emoji: '💼', accentColour: '#00E5CC' },
  { id: 'church-prayer', name: 'Church Prayer', emoji: '🙏', accentColour: '#C9922A' },
  { id: 'church-announcements', name: 'Church Announcements', emoji: '📢', accentColour: '#C9922A' },
  { id: 'presentations', name: 'Presentations', emoji: '🎤', accentColour: '#00E5CC' },
  { id: 'storytelling', name: 'Storytelling', emoji: '💬', accentColour: '#00E5CC' },
  { id: 'general-confidence', name: 'General Confidence', emoji: '🗣️', accentColour: '#00E5CC' },
];

export function getDeckMeta(): DeckMeta[] {
  return DECK_META_BASE.map(m => {
    const phraseCount = (DECKS[m.id] || []).length;
    return {
      ...m,
      phraseCount,
      lastPlayed: getDeckLastPlayed(m.id),
      masteryPercent: getDeckMasteryPercent(m.id, phraseCount),
      crownTier: getDeckCrownTier(m.id, phraseCount),
    };
  });
}

export function getDeck(deckId: string): DrillCard[] {
  return DECKS[deckId] || [];
}

export function getShuffledDeck(deckId: string): DrillCard[] {
  const cards = [...getDeck(deckId)];
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function getAllPhraseIds(): string[] {
  return Object.values(DECKS).flatMap(cards => cards.map(c => c.id));
}

export function getSmartMixDeck(): DrillCard[] {
  const progress = getProgress();
  const allIds = getAllPhraseIds();
  const selectedIds = getSmartMixPhraseIds(progress.phraseRecords, allIds);

  // Look up the actual cards
  const allCards: Record<string, DrillCard> = {};
  for (const cards of Object.values(DECKS)) {
    for (const card of cards) {
      allCards[card.id] = card;
    }
  }

  const result = selectedIds
    .map(id => allCards[id])
    .filter(Boolean);

  // Shuffle
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}
