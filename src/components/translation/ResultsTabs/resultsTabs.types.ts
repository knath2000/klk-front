export interface TranslationResult {
  definitions: Definition[];
  examples: Example[];
  conjugations?: ConjugationTable;
  audio?: AudioItem[];
  related: string[];
}

export interface Definition {
  text: string;
  partOfSpeech?: string;
  examples?: string[];
  synonyms?: string[];
}

export interface Example {
  spanish: string;
  english: string;
  audio?: string;
}

export interface ConjugationTable {
  present: Record<string, string>;
  past: Record<string, string>;
  future?: Record<string, string>;
  conditional?: Record<string, string>;
  subjunctive?: Record<string, string>;
}

export interface AudioItem {
  url: string;
  type: "pronunciation" | "example";
  text: string;
  duration?: number;
}

export interface TabData {
  id: string;
  label: string;
  count?: number;
  isAvailable: boolean;
}

export interface ResultsTabsProps {
  results: TranslationResult;
  query: string;
  onRelatedClick: (query: string, lang: string) => void;
}

export interface TabPanelProps {
  children: React.ReactNode;
  isActive: boolean;
}

export interface DefinitionBlockProps {
  definitions: Definition[];
  query: string;
}

export interface ExampleListProps {
  examples: Example[];
  onAudioPlay?: (audioUrl: string) => void;
}

export interface ConjugationTableProps {
  conjugations: ConjugationTable;
  word: string;
}

export interface AudioPlayerProps {
  audioItems: AudioItem[];
  onPlay: (audioUrl: string) => void;
  currentPlaying?: string;
}

export interface RelatedTermsListProps {
  terms: string[];
  onTermClick: (term: string) => void;
}