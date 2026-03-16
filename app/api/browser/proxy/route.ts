import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15 MehdiOSProxy/1.0'
const PROXY_PATH = '/api/browser/proxy'
const BLOCKED_HOST_PATTERNS = [
  /^localhost$/i,
  /^0\.0\.0\.0$/,
  /^127\./,
  /^10\./,
  /^169\.254\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^\[?::1\]?$/,
  /\.local$/i,
]

const isBlockedHost = (hostname: string) =>
  BLOCKED_HOST_PATTERNS.some((pattern) => pattern.test(hostname))

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

const injectProxyShell = (html: string, targetUrl: string) => {
  const shell = `
<base href="${escapeHtml(targetUrl)}">
<script>
(() => {
  const targetUrl = ${JSON.stringify(targetUrl)};
  const proxyPath = ${JSON.stringify(PROXY_PATH)};
  const proxyUrl = (url) => \`\${proxyPath}?url=\${encodeURIComponent(url)}\`;
  const postState = (url = targetUrl) => {
    try {
      window.parent.postMessage(
        { type: 'browser:page', url, title: document.title || '' },
        window.location.origin
      );
    } catch {}
  };
  const resolveUrl = (value) => new URL(value, targetUrl).toString();
  document.addEventListener('click', (event) => {
    const element = event.target instanceof Element ? event.target.closest('a[href]') : null;
    if (!element) return;
    const href = element.getAttribute('href');
    if (!href || href.startsWith('#') || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    window.location.href = proxyUrl(resolveUrl(href));
  });
  document.addEventListener('submit', (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const method = (form.getAttribute('method') || 'GET').toUpperCase();
    if (method !== 'GET') return;
    event.preventDefault();
    const action = form.getAttribute('action') || targetUrl;
    const nextUrl = new URL(action, targetUrl);
    const formData = new FormData(form);
    for (const [key, value] of formData.entries()) {
      if (typeof value === 'string') {
        nextUrl.searchParams.set(key, value);
      }
    }
    window.location.href = proxyUrl(nextUrl.toString());
  });
  window.addEventListener('load', () => postState(targetUrl));
})();
</script>
`

  const sanitizedHtml = html
    .replace(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*>/gi, '')
    .replace(/<meta[^>]+http-equiv=["']X-Frame-Options["'][^>]*>/gi, '')
    .replace(/<base[^>]*>/gi, '')

  if (/<head[^>]*>/i.test(sanitizedHtml)) {
    return sanitizedHtml.replace(/<head([^>]*)>/i, `<head$1>${shell}`)
  }

  return `${shell}${sanitizedHtml}`
}

const parseTargetUrl = (rawUrl: string) => {
  try {
    const url = new URL(rawUrl)

    if (!['http:', 'https:'].includes(url.protocol) || isBlockedHost(url.hostname)) {
      return null
    }

    return url
  } catch {
    return null
  }
}

export async function GET(request: NextRequest) {
  const rawUrl = request.nextUrl.searchParams.get('url')?.trim() ?? ''
  const targetUrl = parseTargetUrl(rawUrl)

  if (!targetUrl) {
    return NextResponse.json(
      { error: 'This page cannot be opened in Safari.' },
      { status: 400 }
    )
  }

  try {
    const response = await fetch(targetUrl, {
      cache: 'no-store',
      headers: {
        accept: request.headers.get('accept') ?? '*/*',
        'accept-language': 'en-US,en;q=0.9',
        'user-agent': USER_AGENT,
      },
      redirect: 'follow',
    })

    const finalUrl = parseTargetUrl(response.url || targetUrl.toString())
    if (!finalUrl) {
      return NextResponse.json(
        { error: 'This page cannot be opened in Safari.' },
        { status: 403 }
      )
    }

    const contentType = response.headers.get('content-type') ?? 'text/html; charset=utf-8'
    const headers = new Headers({
      'cache-control': 'no-store',
      'content-type': contentType,
    })

    if (contentType.includes('text/html')) {
      const html = await response.text()
      return new NextResponse(injectProxyShell(html, finalUrl.toString()), {
        headers,
        status: response.status,
      })
    }

    const body = await response.arrayBuffer()
    return new NextResponse(body, {
      headers,
      status: response.status,
    })
  } catch {
    return NextResponse.json(
      { error: 'This page could not be loaded in Safari.' },
      { status: 502 }
    )
  }
}
