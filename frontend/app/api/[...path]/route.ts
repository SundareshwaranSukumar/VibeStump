import { NextRequest } from 'next/server';

export async function GET(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const apiUrl = process.env.API_URL || 'http://localhost:8000';
  const url = `${apiUrl}/api/${path}${request.nextUrl.search}`;
  
  try {
    const res = await fetch(url);
    return new Response(res.body, { status: res.status, headers: res.headers });
  } catch (error: any) {
    console.error(`[Proxy GET] Error fetching ${url}:`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const path = resolvedParams.path.join('/');
  const apiUrl = process.env.API_URL || 'http://localhost:8000';
  const url = `${apiUrl}/api/${path}${request.nextUrl.search}`;
  
  try {
    const body = await request.text();
    const headers = new Headers();
    if (request.headers.get('content-type')) {
      headers.set('content-type', request.headers.get('content-type')!);
    }
    
    const res = await fetch(url, {
      method: 'POST',
      body,
      headers
    });
    return new Response(res.body, { status: res.status, headers: res.headers });
  } catch (error: any) {
    console.error(`[Proxy POST] Error fetching ${url}:`, error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
