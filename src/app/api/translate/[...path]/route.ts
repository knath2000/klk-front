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
    const body = await request.json();
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