export interface FillerWordResult {
  word: string;
  position: number;
  context: string;
}

export interface SpeechMetrics {
  wordsPerMinute: number;
  fillerWords: FillerWordResult[];
  fillerWordRate: number;
  pauseCount: number;
  longestPause: number;
  vocabularyRichness: number;
  clarityScore: number;
  confidenceSignals: string[];
  weaknessSignals: string[];
  tips: string[];
  highlight: string;
}

export interface PrayerMetrics {
  structureScore: number;
  structureBreakdown: {
    address: boolean;
    acknowledgement: boolean;
    intercession: boolean;
    close: boolean;
  };
  justFillerCount: number;
  fillerWordList: FillerWordResult[];
  lengthRating: 'too_short' | 'ideal' | 'too_long';
  warmthScore: number;
  clarityScore: number;
  tips: string[];
  highlight: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  duration: string;
  viewCount: string;
}

export interface PrayerScenario {
  id: string;
  label: string;
  setting: string;
  duration: string;
  tips: string[];
}

export interface ConversationTurn {
  role: 'ai' | 'user';
  text: string;
  metrics?: MiniScore;
}

export interface MiniScore {
  pace: 'slow' | 'good' | 'fast';
  fillerCount: number;
  confidence: number;
  tip: string;
  praise: string;
}

export interface KeyPhrase {
  id: string;
  phrase: string;
  context: string;
  topic: string;
  when_to_use?: string;
  video_id?: string;
}

export interface VocabularyItem {
  id: string;
  word: string;
  meaning: string;
  example_sentence: string;
  topic: string;
  video_id?: string;
}

export interface Framework {
  name: string;
  steps: string[];
  topic: string;
  video_id?: string;
}

export interface Principle {
  title: string;
  explanation: string;
  topic: string;
  video_id?: string;
}

export interface ExampleSentence {
  situation: string;
  sentence: string;
  topic: string;
  video_id?: string;
}

export interface PhraseSection {
  title: string;
  phrases: KeyPhrase[];
}

export interface ContextContent {
  phrase_sections: PhraseSection[];
  vocabulary: VocabularyItem[];
  example_sentences: ExampleSentence[];
}

export interface SentenceVersion {
  level: 'Simple' | 'Clear' | 'Confident' | 'Polished' | 'Powerful';
  sentence: string;
  note: string;
}

export interface VocabularyUpgrade {
  theyUsed: string;
  tryInstead: string;
  source: string;
}

export interface ContextProgress {
  phrasesLearned: number;
  totalPhrases: number;
  lastPracticed: string;
}

export interface TodayTask {
  label: string;
  target: string;
  description: string;
}

export interface WeekDay {
  day: string;
  task: string;
  target: string;
}

export interface CoachPlan {
  todayTask: TodayTask;
  weekPlan: WeekDay[];
  generatedAt: string;
}

export interface RecentActivity {
  action: string;
  target: string;
  timestamp: string;
}

export interface UserProgress {
  streak: number;
  lastActiveDate: string;
  learnedPhrases: string[];
  savedPhrases: string[];
  learnedVocab: string[];
  practiceSessionsCount: number;
  prayerSessionsCount: number;
  contextProgress: Record<string, ContextProgress>;
  currentPlan: CoachPlan | null;
  recentActivity: RecentActivity[];
}
