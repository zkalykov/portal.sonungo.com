import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { encryptPayload } from '@/lib/session';

const SESSION_DURATION_SECONDS = 2 * 60 * 60; // 2 hours

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json({ error: 'Missing auth code' }, { status: 400 });
    }

    // Exchange the code with the canvas backend.
    // This is server-to-server, so the token is never exposed to the client browser.
    const response = await fetch('https://canvas.sonungo.com/api/portal/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
      // Optional: Add a timeout or other fetch options if needed
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
      return NextResponse.json(
        { error: errorData.detail || `Authentication failed (${response.status})` },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data.status !== 'success' || !data.canvas_url || !data.canvas_token) {
      return NextResponse.json({ error: 'Invalid response from authentication server' }, { status: 500 });
    }

    // Encrypt the payload securely so the token is not visible to the user
    const payload = JSON.stringify({ 
      canvas_url: data.canvas_url, 
      canvas_token: data.canvas_token 
    });
    
    const encodedPayload = encryptPayload(payload);

    const cookieStore = await cookies();
    cookieStore.set('portal_session', encodedPayload, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: SESSION_DURATION_SECONDS,
      path: '/',
    });

    return NextResponse.json({ success: true, canvas_url: data.canvas_url });
  } catch (error) {
    console.error('[API] Exchange error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
