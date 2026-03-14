import { NextRequest, NextResponse } from 'next/server';

const ENV_CANVAS_BASE_URL = process.env.CANVAS_BASE_URL || process.env.NEXT_PUBLIC_CANVAS_BASE_URL || '';
const ENV_CANVAS_API_TOKEN = process.env.CANVAS_API_TOKEN || process.env.NEXT_PUBLIC_CANVAS_API_TOKEN || '';

async function proxyRequest(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const method = request.method;
  const endpoint = '/' + path.join('/');

  // Prefer session-based credentials from headers, fall back to env vars
  let canvasBaseUrl = request.headers.get('x-canvas-base-url') || ENV_CANVAS_BASE_URL;
  const canvasApiToken = request.headers.get('x-canvas-api-token') || ENV_CANVAS_API_TOKEN;

  if (!canvasBaseUrl || !canvasApiToken) {
    return NextResponse.json(
      { error: 'Canvas API credentials not configured. Please authenticate.' },
      { status: 401 }
    );
  }
  
  if (!canvasBaseUrl.startsWith('http://') && !canvasBaseUrl.startsWith('https://')) {
    canvasBaseUrl = `https://${canvasBaseUrl}`;
  }
  
  // Forward all query parameters
  const searchParams = request.nextUrl.searchParams.toString();
  const normalizedBaseUrl = canvasBaseUrl.replace(/\/$/, '');
  const url = `${normalizedBaseUrl}/api/v1${endpoint}${searchParams ? `?${searchParams}` : ''}`;

  console.log(`[Canvas Proxy] ${method} ${url}`);

  const headers = new Headers();
  headers.set('Authorization', `Bearer ${canvasApiToken}`);
  
  const contentType = request.headers.get('content-type') || '';

  const init: RequestInit = {
    method,
    headers,
  };

  if (method !== 'GET' && method !== 'HEAD') {
    if (contentType.includes('application/json')) {
      // JSON body
      headers.set('Content-Type', 'application/json');
      const text = await request.text();
      if (text) {
        init.body = text;
      }
    } else if (contentType.includes('multipart/form-data') || contentType.includes('application/x-www-form-urlencoded')) {
      // Form data
      const formData = await request.formData();
      init.body = formData;
      // DO NOT set Content-Type header manually here for multipart!
      // `fetch` will automatically set the correct boundary for multipart/form-data.
    } else {
      // Plain text or other
      if (contentType) headers.set('Content-Type', contentType);
      const text = await request.text();
      if (text) init.body = text;
    }
  }

  try {
    const response = await fetch(url, init);

    if (!response.ok) {
      console.error('[Canvas Proxy] Error:', response.status, response.statusText);
      const errorText = await response.text();
      console.error('[Canvas Proxy] Response:', errorText);
      return NextResponse.json(
        { error: `Canvas API error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    // Sometimes Canvas returns empty responses (e.g. 204 No Content for DELETE)
    const responseContentType = response.headers.get('content-type') || '';
    if (responseContentType.includes('application/json')) {
      const data = await response.json();
      return NextResponse.json(data);
    } else {
      const text = await response.text();
      return new NextResponse(text, { status: response.status, headers: { 'Content-Type': responseContentType } });
    }
  } catch (error) {
    console.error(`[Canvas Proxy] ${method} error:`, error);
    return NextResponse.json(
      { error: 'Failed to proxy request to Canvas API', details: String(error) },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, props);
}

export async function POST(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, props);
}

export async function PUT(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, props);
}

export async function DELETE(request: NextRequest, props: { params: Promise<{ path: string[] }> }) {
  return proxyRequest(request, props);
}
