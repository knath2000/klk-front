import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Handle DELETE /api/conversations?confirm=true for bulk deletion
export async function DELETE(req: Request) {
  try {
    // Extract confirm query parameter
    const url = new URL(req.url);
    const confirm = url.searchParams.get('confirm');

    if (confirm !== 'true') {
      return NextResponse.json(
        { error: 'Missing confirmation. Add ?confirm=true to proceed.' },
        { status: 400 }
      );
    }

    // Forward auth header from frontend to backend
    const authHeader = req.headers.get('authorization') || '';
    
    // Forward DELETE to backend with confirm parameter
    const backendRes = await fetch(`${BACKEND_URL}/api/conversations?confirm=true`, {
      method: 'DELETE',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        'Content-Type': 'application/json',
      },
    });

    // If backend returned 204 No Content, relay it exactly without a body
    if (backendRes.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    // Otherwise forward body based on content-type
    const contentType = backendRes.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const json = await backendRes.json();
      return NextResponse.json(json, { status: backendRes.status });
    } else {
      const text = await backendRes.text();
      return new NextResponse(text, {
        status: backendRes.status,
        headers: { 'Content-Type': contentType || 'text/plain' }
      });
    }
  } catch (err: any) {
    console.error('Proxy DELETE /api/conversations error', err);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}
