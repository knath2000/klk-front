import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

function tryExtractStackAccessFromCookies(request: NextRequest): string | null {
  try {
    // Prefer stack-access cookie which is often a URL-encoded JSON array [refresh, access]
    const stackAccess = request.cookies.get('stack-access')?.value;
    if (stackAccess) {
      try {
        const decoded = decodeURIComponent(stackAccess);
        const arr = JSON.parse(decoded);
        if (Array.isArray(arr) && arr.length >= 2 && typeof arr[1] === 'string') {
          return arr[1];
        }
        // Sometimes the cookie stores the access token directly
        if (typeof decoded === 'string' && decoded.startsWith('eyJ')) return decoded;
      } catch (e) {
        // fallback to raw value if it looks like a JWT
        if (stackAccess.startsWith('eyJ')) return stackAccess;
      }
    }

    // Heuristic: parse Cookie header into a map and look for relevant cookies
    const cookieHeader = request.headers.get('cookie') || '';
    const cookieMap: Record<string, string> = {};
    cookieHeader.split(';').forEach(part => {
      const idx = part.indexOf('=');
      if (idx > -1) {
        const key = part.slice(0, idx).trim();
        const val = decodeURIComponent(part.slice(idx + 1).trim());
        cookieMap[key] = val;
      }
    });

    for (const name of Object.keys(cookieMap)) {
      const low = name.toLowerCase();
      if (low.includes('stack') && (low.includes('access') || low.includes('token'))) {
        const val = cookieMap[name];
        if (val && val.startsWith('eyJ')) return val;
      }
    }
  } catch (e) {
    // ignore extraction errors
  }
  return null;
}

export async function GET(request: NextRequest) {
  const backendAuthUserUrl = new URL(`${BACKEND_URL}/api/auth/user`);

  try {
    // Build headers to forward, preserving existing ones
    const headersToForward = new Headers(request.headers);
    headersToForward.set('Accept', 'application/json');

    // If an access token exists in cookies, set Authorization header for backend neonAuth middleware
    const token = tryExtractStackAccessFromCookies(request);
    if (token) {
      headersToForward.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(backendAuthUserUrl.toString(), {
      method: 'GET',
      headers: headersToForward,
      // Keep credentials so cookies are forwarded if needed by backend
      credentials: 'include'
    });

    // Propagate 401 directly to let frontend treat as unauthenticated
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