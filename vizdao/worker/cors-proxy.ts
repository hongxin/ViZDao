// Cloudflare Worker CORS Proxy
// Deploy: wrangler deploy worker/cors-proxy.ts

export default {
  async fetch(request: Request): Promise<Response> {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    let targetUrl: string;
    if (url.pathname.startsWith('/v1/')) {
      const TARGET_BASE = 'https://api.openai.com';
      targetUrl = `${TARGET_BASE}${url.pathname}${url.search}`;
    } else if (url.pathname === '/proxy') {
      const dest = url.searchParams.get('url');
      if (!dest) return new Response('Missing url param', { status: 400, headers: corsHeaders });
      targetUrl = dest;
    } else {
      return new Response('Not found', { status: 404, headers: corsHeaders });
    }

    const headers = new Headers(request.headers);
    headers.delete('host');

    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.method === 'POST' ? request.body : undefined,
    });

    const newHeaders = new Headers(response.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => newHeaders.set(k, v));

    return new Response(response.body, {
      status: response.status,
      headers: newHeaders,
    });
  },
};
