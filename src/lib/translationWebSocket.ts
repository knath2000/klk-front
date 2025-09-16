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
    text: string;
    partOfSpeech?: string;
    examples?: string[];
  }>;
  examples?: Array<{
    text: string;
    translation?: string;
  }>;
  conjugations?: Array<{
    tense: string;
    forms: Record<string, string>;
  }>;
  audio?: Array<{
    url: string;
    pronunciation?: string;
  }>;
  related?: Array<{
    word: string;
    type: string;
  }>;
  timestamp: number;
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

// Send translation request
export const sendTranslationRequest = (socket: Socket, request: TranslationRequest) => {
  if (socket.connected) {
    console.log('📤 Sending translation request:', request.id);
    socket.emit('translation_request', request);
  } else {
    console.error('❌ Cannot send translation request: WebSocket not connected');
    throw new Error('WebSocket connection not available');
  }
};

// Utility to generate unique request IDs
export const generateRequestId = (): string => {
  return `translation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};