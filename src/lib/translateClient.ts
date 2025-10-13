export interface RestTranslateParams {
  text: string;
  sourceLang: string;
  targetLang: string;
  context?: string | null;
  userId?: string;
}

export interface RestTranslateResponse {
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
  related?: {
    synonyms?: string[];
    antonyms?: string[];
  } | Array<{
    word: string;
    type: string;
  }>;
  entry?: unknown;
  metadata?: {
    requestId?: string;
    timestamp?: string;
    sourceLang?: string;
    targetLang?: string;
    context?: string | null;
    cached?: boolean;
  };
}

export class RestTranslateError extends Error {
  status: number;
  retryAfter?: number;

  constructor(message: string, status: number, retryAfter?: number) {
    super(message);
    this.status = status;
    this.retryAfter = retryAfter;
  }
}

export const translateViaRest = async (params: RestTranslateParams): Promise<RestTranslateResponse> => {
  // Defensive validation: ensure we have a valid non-empty text to send
  if (!params || typeof params.text !== 'string' || params.text.trim().length === 0) {
    throw new RestTranslateError('Invalid translation request: "text" is required', 400);
  }

  // Build a safe body ensuring no undefined fields are serialized
  const safeBody = {
    text: String(params.text),
    sourceLang: params.sourceLang || 'en',
    targetLang: params.targetLang || 'es',
    context: params.context ?? null,
    userId: params.userId ?? undefined,
  };

  // Diagnostic: log the outgoing safe body for debugging guest translation requests
  const safeBodyPreview = {
    text: safeBody.text?.slice(0, 200),
    sourceLang: safeBody.sourceLang,
    targetLang: safeBody.targetLang,
    hasUserId: !!safeBody.userId,
  };
  console.log('[translateViaRest] Sending body preview:', safeBodyPreview);

  const response = await fetch('/api/translate/request', {
    method: 'POST',
    credentials: 'include', // ensure cookies (anon_id) are sent/received for guest persistence
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(safeBody),
  });

  const retryAfterHeader = response.headers.get('Retry-After');
  const retryAfter = retryAfterHeader ? Number.parseInt(retryAfterHeader, 10) || undefined : undefined;

  if (!response.ok) {
    let message = 'Translation request failed';
    try {
      const errorBody = await response.json();
      if (errorBody?.message) {
        message = errorBody.message;
      } else if (errorBody?.error) {
        message = errorBody.error;
      }
    } catch {
      // ignore JSON parse errors
    }
    throw new RestTranslateError(message, response.status, retryAfter);
  }

  return (await response.json()) as RestTranslateResponse;
};

/**
 * Return a stable anon_id persisted in localStorage for guest requests.
 * Falls back to a timestamp-random id if crypto.randomUUID is not available.
 */
export function getOrCreateAnonId(): string {
  if (typeof window === 'undefined') {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }

  try {
    let id: string | null = localStorage.getItem('anon_id');
    const gen =
      typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function'
        ? (crypto as any).randomUUID()
        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const finalId = id || gen;
    // persist finalId (guaranteed string)
    localStorage.setItem('anon_id', finalId);
    return finalId;
  } catch (e) {
    // In case localStorage is not available, return a volatile id
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
  }
}