import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://klk-back-production.up.railway.app';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params; // Await the params
  const pathString = path.join('/');
  const url = new URL(`${BACKEND_URL}/api/translate/${pathString}`);
  
  // Forward query parameters
  url.search = request.nextUrl.search;
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth if needed
        // Headers.entries() may not be typed as iterable in some environments — convert explicitly
        ...(() => {
          const h: Record<string, string> = {};
          // Headers.forEach is available on the standard Headers implementation; use it to build a plain object.
          request.headers.forEach((value: string, key: string) => {
            h[key] = value;
          });
          return h;
        })()
      },
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Backend error' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params; // Await the params
  const pathString = path.join('/');
  const url = new URL(`${BACKEND_URL}/api/translate/${pathString}`);
  
  try {
    // Defensive parse & logging to diagnose guest translation payloads
    let body: any;
    try {
      body = await request.json();
    } catch (parseErr) {
      console.error('[Translate Proxy] Failed to parse incoming request JSON:', parseErr);
      // Try to read raw text as fallback
      try {
        const raw = await request.text();
        console.warn('[Translate Proxy] Raw request body (fallback):', raw?.slice(0, 200));
        body = raw ? JSON.parse(raw) : {};
      } catch (rawErr) {
        console.error('[Translate Proxy] Failed to recover raw request body; returning 400:', rawErr);
        return NextResponse.json({ error: 'Bad Request', message: 'Malformed JSON body in proxy request' }, { status: 400 });
      }
    }

    // Log incoming body briefly for diagnostics (avoid huge dumps)
    console.log('[Translate Proxy] Incoming POST body preview:', {
      textPreview: typeof body?.text === 'string' ? body.text.substring(0, 100) : body?.text,
      hasSourceLang: !!body?.sourceLang,
      hasTargetLang: !!body?.targetLang,
      hasUserId: !!body?.userId
    });

    // Defensive defaults / validation before forwarding
    if (!body || typeof body !== 'object' || !body.text || typeof body.text !== 'string' || body.text.trim().toLowerCase() === 'undefined') {
      console.error('[Translate Proxy] Rejecting invalid payload: Missing, invalid, or "undefined" text field.');
      return NextResponse.json({ error: 'Bad Request', message: 'Invalid or missing "text" field in translation request' }, { status: 400 });
    }

    // Mirror critical fields into query string for backend recovery if body gets corrupted
    const recoveryParams = new URLSearchParams({
      text: body.text,
      sourceLang: body.sourceLang || 'en',
      targetLang: body.targetLang || 'es',
      context: body.context || '',
      userId: body.userId || ''
    });
    url.search = recoveryParams.toString();

    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Headers.entries() may not be typed as iterable in some environments — convert explicitly
        ...(() => {
          const h: Record<string, string> = {};
          // Headers.forEach is available on the standard Headers implementation; use it to build a plain object.
          request.headers.forEach((value: string, key: string) => {
            h[key] = value;
          });
          return h;
        })()
      },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Backend error' }, { status: response.status });
    }
    
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Proxy error:', error);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}