// Translation-specific WebSocket events and handlers
import { Socket } from 'socket.io-client';

export interface TranslationRequest {
  query: string;
  language: string;
  context?: string;
  timestamp: number;
  id: string;
}

export interface TranslationDelta {
  chunk: string;
  index: number;
  total: number;
  id: string;
}

export interface TranslationResult {
  id: string;
  query: string;
  definitions?: Array<{
    text?: string;
    meaning?: string;
    partOfSpeech?: string;
    pos?: string;
    examples?: string[];
    usage?: string;
  }>;
  examples?: Array<{
    text?: string;
    translation?: string;
    spanish?: string;
    english?: string;
    context?: string;
  }>;
  conjugations?: Record<string, unknown>;
  audio?: Array<{
    url?: string;
    pronunciation?: string;
    type?: string;
    text?: string;
  }> | {
    ipa?: string;
    suggestions?: string[];
  };
  related?: Array<{
    word: string;
    type: string;
  }> | {
    synonyms?: string[];
    antonyms?: string[];
  };
  // New: full dictionary entry (SpanishDict-style) for richer UI. Optional for backward compatibility.
  entry?: DictionaryEntry;
  timestamp: number;
}

// New: SpanishDict-style dictionary entry schema (mirrors server)
export interface DictionaryEntry {
  headword: string;
  pronunciation: {
    ipa: string;
    syllabification?: string;
  };
  part_of_speech: string; // e.g., "n", "v", "adj"
  gender: 'm' | 'f' | 'mf' | null;
  inflections: string[];
  frequency?: number;
  senses: Array<DictionarySense>;
}

export interface DictionarySense {
  sense_number: number;
  registers?: string[]; // ["slang","colloquial","pejorative","vulgar","figurative","technical","archaic"]
  regions?: string[];   // ["Mexico","Caribbean","Venezuela","Guatemala","Latin America","Spain",...]
  gloss: string;        // English gloss
  usage_notes?: string;
  examples: Array<{ es: string; en: string }>;
  synonyms?: string[];
  antonyms?: string[];
  cross_references?: string[];
  // New: explicit Spanish translation for this sense (server-provided for EN→ES visibility)
  translation_es?: string;
}

// Translation event handlers
export const setupTranslationHandlers = (
  socket: Socket,
  onDelta: (delta: TranslationDelta) => void,
  onResult: (result: TranslationResult) => void,
  onError: (error: string) => void
) => {
  // Handle streaming deltas
  socket.on('translation_delta', (data: TranslationDelta) => {
    console.log('📄 Translation delta received:', data.index, '/', data.total);
    onDelta(data);
  });

  // Handle final result
  socket.on('translation_final', (data: TranslationResult) => {
    console.log('✅ Translation complete:', data.id);
    onResult(data);
  });

  // Handle translation errors
  socket.on('translation_error', (error: { message: string; id?: string }) => {
    console.error('❌ Translation error:', error.message);
    onError(error.message);
  });

  // Handle server fallback notifications
  socket.on('translation_fallback', (data: { transport: string; reason: string }) => {
    console.log('🔄 Server activated fallback:', data.transport, 'Reason:', data.reason);
  });

  return () => {
    console.log('🧹 Cleaning up translation WebSocket listeners');
    socket.off('translation_delta');
    socket.off('translation_final');
    socket.off('translation_error');
    socket.off('translation_fallback');
  };
};

// Pending requests queue for disconnected state
const pendingRequests: TranslationRequest[] = [];

// Send translation request
export const sendTranslationRequest = (socket: Socket, request: TranslationRequest) => {
  if (socket.connected) {
    console.log('📤 Sending translation request:', request.id);
    socket.emit('translation_request', request);
  } else {
    console.warn('⚠️ Socket disconnected; queuing request', request.id);
    pendingRequests.push(request);
    socket.once('connect', () => {
      const queued = pendingRequests.splice(0, pendingRequests.length);
      queued.forEach((req) => {
        console.log('📤 Flushing queued translation request:', req.id);
        socket.emit('translation_request', req);
      });
    });
    socket.connect();
  }
};

// Utility to generate unique request IDs
export const generateRequestId = (): string => {
  return `translation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};