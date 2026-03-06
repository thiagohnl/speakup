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
