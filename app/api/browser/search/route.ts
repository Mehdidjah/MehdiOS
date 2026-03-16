import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type SearchResult = {
  title: string
  url: string
  snippet: string
  source: string
}

const MAX_RESULTS = 8
const GOOGLE_SEARCH_ENDPOINT = 'https://www.googleapis.com/customsearch/v1'
const SEARCH_ENDPOINT = 'https://html.duckduckgo.com/html/'
const USER_AGENT =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15 MehdiOSSearch/1.0'

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2f;/gi, '/')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 10))
    )
    .replace(/&#x([0-9a-f]+);/gi, (_, code: string) =>
      String.fromCharCode(Number.parseInt(code, 16))
    )

const stripTags = (value: string) =>
  decodeHtmlEntities(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

const getSourceLabel = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return 'Search result'
  }
}

const unwrapDuckDuckGoRedirect = (rawHref: string) => {
  const normalizedHref = rawHref.startsWith('//') ? `https:${rawHref}` : rawHref

  try {
    const redirectUrl = new URL(normalizedHref)
    return redirectUrl.searchParams.get('uddg') ?? normalizedHref
  } catch {
    return normalizedHref
  }
}

const parseSearchResults = (html: string): SearchResult[] => {
  const matches = [...html.matchAll(/<a[^>]*class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)]

  return matches
    .map((match) => {
      const resultWindow = html.slice(match.index ?? 0, (match.index ?? 0) + 2500)
      const snippetMatch = resultWindow.match(
        /class="result__snippet"[^>]*>([\s\S]*?)<\/(?:a|div)>/i
      )
      const sourceMatch = resultWindow.match(
        /class="result__url"[^>]*>([\s\S]*?)<\/(?:a|span)>/i
      )

      const url = unwrapDuckDuckGoRedirect(stripTags(match[1]))
      const title = stripTags(match[2])
      const snippet = snippetMatch ? stripTags(snippetMatch[1]) : ''
      const source = sourceMatch ? stripTags(sourceMatch[1]) : getSourceLabel(url)

      if (!url || !title) {
        return null
      }

      return {
        title,
        url,
        snippet,
        source,
      }
    })
    .filter((result): result is SearchResult => Boolean(result))
    .slice(0, MAX_RESULTS)
}

const searchWithGoogleApi = async (query: string): Promise<SearchResult[] | null> => {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY
  const searchEngineId =
    process.env.GOOGLE_SEARCH_ENGINE_ID ?? process.env.GOOGLE_SEARCH_CX

  if (!apiKey || !searchEngineId) {
    return null
  }

  const searchUrl = new URL(GOOGLE_SEARCH_ENDPOINT)
  searchUrl.searchParams.set('key', apiKey)
  searchUrl.searchParams.set('cx', searchEngineId)
  searchUrl.searchParams.set('q', query)
  searchUrl.searchParams.set('num', String(MAX_RESULTS))
  searchUrl.searchParams.set('safe', 'off')

  const response = await fetch(searchUrl, {
    cache: 'no-store',
    headers: {
      accept: 'application/json',
      'accept-language': 'en-US,en;q=0.9',
      'user-agent': USER_AGENT,
    },
  })

  if (!response.ok) {
    throw new Error('Google search failed')
  }

  const data = (await response.json()) as {
    items?: Array<{
      title?: string
      link?: string
      snippet?: string
      displayLink?: string
    }>
  }

  return (data.items ?? [])
    .map((item) => {
      const title = item.title?.trim() ?? ''
      const url = item.link?.trim() ?? ''

      if (!title || !url) {
        return null
      }

      return {
        title,
        url,
        snippet: item.snippet?.trim() ?? '',
        source: item.displayLink?.trim() ?? getSourceLabel(url),
      }
    })
    .filter((item): item is SearchResult => Boolean(item))
}

const searchWithDuckDuckGo = async (query: string): Promise<SearchResult[]> => {
  const searchUrl = new URL(SEARCH_ENDPOINT)
  searchUrl.searchParams.set('q', query)

  const response = await fetch(searchUrl, {
    cache: 'no-store',
    headers: {
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9',
      'user-agent': USER_AGENT,
    },
  })

  if (!response.ok) {
    throw new Error('Fallback search failed')
  }

  const html = await response.text()
  return parseSearchResults(html)
}

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim() ?? ''

  if (!query) {
    return NextResponse.json({ results: [] })
  }

  try {
    try {
      const googleResults = await searchWithGoogleApi(query)
      if (googleResults) {
        return NextResponse.json({
          provider: 'google',
          results: googleResults,
        })
      }
    } catch {
      // Fall through to the built-in web search fallback.
    }

    const fallbackResults = await searchWithDuckDuckGo(query)
    return NextResponse.json({
      provider: 'fallback',
      results: fallbackResults,
    })
  } catch {
    return NextResponse.json(
      { error: 'Unable to load search results right now.' },
      { status: 502 }
    )
  }
}
