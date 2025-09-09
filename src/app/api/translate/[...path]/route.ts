import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://klk-back-production.up.railway.app';

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = new URL(`${BACKEND_URL}/api/translate/${path}`);
  
  // Forward query parameters
  url.search = request.nextUrl.search;
  
  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Forward auth if needed
        ...Object.fromEntries(request.headers.entries())
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

export async function POST(request: NextRequest, { params }: { params: { path: string[] } }) {
  const path = params.path.join('/');
  const url = new URL(`${BACKEND_URL}/api/translate/${path}`);
  
  try {
    const body = await request.json();
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...Object.fromEntries(request.headers.entries())
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