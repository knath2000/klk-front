import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function GET(request: NextRequest) {
  const backendAuthUserUrl = new URL(`${BACKEND_URL}/api/auth/user`);

  try {
    // Forward all headers from the incoming request (especially Authorization and Cookie)
    const headersToForward = new Headers(request.headers);
    // Explicitly handle content-type if not already set, or if it's application/json
    headersToForward.set('Accept', 'application/json');

    const response = await fetch(backendAuthUserUrl.toString(), {
      method: 'GET',
      headers: headersToForward,
      // Ensure cookies are forwarded from client to proxy to backend
      credentials: 'include' // This may not be strictly necessary here as headers.entries() is used
    });

    // If backend responds with 401, propagate it directly.
    // This allows the frontend AuthContext to correctly identify unauthenticated state.
    if (response.status === 401) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!response.ok) {
      console.error(`[User Proxy] Backend responded with ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      return NextResponse.json({ error: 'Backend error', details: errorText }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });

  } catch (error) {
    console.error('[User Proxy] Failed to forward user request:', error);
    return NextResponse.json({ error: 'Proxy failed', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}