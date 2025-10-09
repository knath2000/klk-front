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
  const response = await fetch('/api/translate/request', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: params.text,
      sourceLang: params.sourceLang,
      targetLang: params.targetLang,
      context: params.context,
      userId: params.userId,
    }),
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