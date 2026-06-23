import type { Tool } from '../../types/tool';
import { logger } from '../../lib/logger';

const log = logger.module('http_get');

// Public CORS proxies — tried in order as fallbacks
const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
];

export function createHttpGet(proxyUrl?: string): Tool {
  return {
    definition: {
      type: 'function',
      function: {
        name: 'http_get',
        description: 'Fetch a URL and return its content. Extracts readable text from HTML pages. Automatically handles CORS restrictions in the browser.',
        parameters: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'URL to fetch' },
          },
          required: ['url'],
        },
      },
    },
    permission: 'risky',
    async execute(params) {
      if (!params.url || typeof params.url !== 'string') {
        throw new Error('Missing required parameter "url". Provide the URL to fetch.');
      }
      const targetUrl = params.url as string;

      // Build list of URLs to try: user proxy → direct → public CORS proxies
      const attempts: Array<{ label: string; url: string }> = [];

      if (proxyUrl) {
        const base = proxyUrl.replace(/\/$/, '');
        attempts.push({ label: 'configured proxy', url: `${base}/proxy?url=${encodeURIComponent(targetUrl)}` });
      }

      attempts.push({ label: 'direct', url: targetUrl });

      for (const makeFn of CORS_PROXIES) {
        attempts.push({ label: 'cors-proxy', url: makeFn(targetUrl) });
      }

      let lastError = '';
      for (const attempt of attempts) {
        try {
          log.debug('trying fetch', { label: attempt.label, url: attempt.url.slice(0, 80) });
          const response = await fetch(attempt.url, {
            headers: { 'Accept': 'text/html, application/xml, application/json, text/plain, */*' },
            signal: AbortSignal.timeout(15_000),
          });
          if (!response.ok) {
            lastError = `HTTP ${response.status}`;
            log.debug('fetch failed', { label: attempt.label, status: response.status });
            continue;
          }

          const contentType = response.headers.get('content-type') || '';
          let text = await response.text();

          if (contentType.includes('html')) {
            text = extractReadableText(text);
          }

          if (text.length > 10240) {
            text = text.slice(0, 10240) + '\n... [truncated]';
          }

          log.info('fetch success', { label: attempt.label, bytes: text.length });
          return text;
        } catch (err: any) {
          lastError = err.name === 'TimeoutError' ? 'Request timed out (15s)' : err.message;
          log.debug('fetch error', { label: attempt.label, error: lastError });
          continue;
        }
      }

      throw new Error(`Failed to fetch ${targetUrl}: ${lastError} (tried direct + CORS proxies)`);
    },
  };
}

function extractReadableText(html: string): string {
  let text = html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, '\n')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text;
}
