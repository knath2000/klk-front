export interface SearchBarProps {
  onSubmit: (query: string, lang: string, context?: string) => void;
  suggestions: string[];
  isLoading: boolean;
}

export interface SearchSuggestion {
  text: string;
  type: 'history' | 'autocomplete' | 'favorite';
  count?: number; // For frequency-based suggestions
}

export interface SearchState {
  query: string;
  language: string;
  context?: string;
  isValid: boolean;
  errorMessage?: string;
}