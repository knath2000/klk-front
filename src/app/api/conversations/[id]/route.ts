// ... existing code ...
import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const conversationId = params.id;
    const authHeader = req.headers.get('authorization') || '';
    const backendRes = await fetch(`${BACKEND_URL}/api/conversations/${conversationId}`, {
      method: 'DELETE',
      headers: {
        ...(authHeader ? { Authorization: authHeader } : {}),
        'Content-Type': 'application/json'
      }
    });

    const text = await backendRes.text();
    return new NextResponse(text, {
      status: backendRes.status,
      headers: { 'Content-Type': backendRes.headers.get('content-type') || 'text/plain' }
    });
  } catch (err: any) {
    console.error('Proxy DELETE /api/conversations/:id error', err);
    return NextResponse.json({ error: 'Proxy failed' }, { status: 500 });
  }
}