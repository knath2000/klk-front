// Types for the AI Chat App with Spanish Slang

export interface Persona {
  id: string;
  country_key: string;
  displayName: string;
  locale_hint: string;
  prompt_text: string;
  safe_reviewed: boolean;
  created_by: string;
  created_at: string;
}

export interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: number;
  country_key?: string;
  isStreaming?: boolean;
  isComplete?: boolean;
}

export interface UserMessage extends Message {
  type: 'user';
  country_key: string;
}

export interface AssistantMessage extends Message {
  type: 'assistant';
  isStreaming: boolean;
  isComplete: boolean;
}

// WebSocket event types
export interface WebSocketMessage {
  type: 'user_message' | 'assistant_delta' | 'assistant_final' | 'typing_start' | 'typing_end';
  data: UserMessageEvent['data'] | AssistantDeltaEvent['data'] | AssistantFinalEvent['data'] | TypingEvent['data'];
  timestamp: number;
}

export interface UserMessageEvent {
  type: 'user_message';
  data: {
    message: string;
    selected_country_key: string;
    client_ts: number;
    message_id: string;
  };
  timestamp: number;
}

export interface AssistantDeltaEvent {
  type: 'assistant_delta';
  data: {
    message_id: string;
    chunk: string;
    is_final: boolean;
  };
  timestamp: number;
}

export interface AssistantFinalEvent {
  type: 'assistant_final';
  data: {
    message_id: string;
    final_content: string;
  };
  timestamp: number;
}

export interface TypingEvent {
  type: 'typing_start' | 'typing_end';
  data: {
    country_key: string;
  };
  timestamp: number;
}

// T3 Chat features
export interface AIModel {
  id: string;
  name: string;
  display_name: string;
  description: string;
  inference_speed: 'fast' | 'medium' | 'slow';
  is_available: boolean;
}

export interface Conversation {
  id: string;
  title: string;
  model: string;
  persona_id?: string;
  message_count: number;
  updated_at: string;
}

// Chat state
export interface ChatState {
  messages: Message[];
  selectedCountry: string | null;
  isTyping: boolean;
  isConnected: boolean;
  personas: Persona[];
  currentModel?: string; // T3 Chat feature: current active model
  currentConversation?: Conversation; // T3 Chat feature: current conversation
}

// Component props
export interface MessageBubbleProps {
  message: Message;
  isLast?: boolean;
}

export interface CountrySelectorProps {
  personas: Persona[];
  selectedCountry: string | null;
  onCountrySelect: (countryKey: string) => void;
  disabled?: boolean;
}

export interface ChatInputProps {
  onSendMessage: (message: string) => void;
  disabled?: boolean;
  selectedCountry: string | null;
}

export interface TypingIndicatorProps {
  isVisible: boolean;
  countryName?: string;
}

export interface ModelSelectorProps {
  currentModel: string;
  onModelChange: (modelId: string) => void;
}

export interface SearchBarProps {
  onSearch: (query: string) => void;
  onConversationSelect: (conversationId: string) => void;
}