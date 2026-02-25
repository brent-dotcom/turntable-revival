import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  // Accept either ?url=https://suno.com/s/... or ?id=[uuid] for backward compat
  const rawUrl = req.nextUrl.searchParams.get('url')
  const id = req.nextUrl.searchParams.get('id')

  const pageUrl = rawUrl ?? (id ? `https://suno.com/song/${id}` : null)

  if (!pageUrl) {
    return NextResponse.json({ error: 'Missing url or id param' }, { status: 400 })
  }

  // Extract UUID from URL if present (used as CDN fallback key)
  const uuidMatch = pageUrl.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)
  const uuid = uuidMatch?.[0] ?? null

  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
      next: { revalidate: 3600 },
    })

    const html = await res.text()

    // ── Strategy 1: __NEXT_DATA__ JSON ────────────────────────────────────────
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__"[^>]*>([^<]+)<\/script>/)
    if (nextDataMatch) {
      try {
        const data = JSON.parse(nextDataMatch[1])
        const clip =
          data?.props?.pageProps?.clip ||
          data?.props?.pageProps?.initialData?.clips?.[0] ||
          data?.props?.pageProps?.data?.clip
        if (clip?.audio_url) {
          const title = clip.title || clip.metadata?.prompt || 'Suno Track'
          return NextResponse.json({ title, audioUrl: clip.audio_url })
        }
      } catch { /* fall through */ }
    }

    // ── Strategy 2: any CDN audio URL in HTML ─────────────────────────────────
    const cdnMatch = html.match(/https:\/\/cdn\d*\.suno\.ai\/[^"'\s]+\.mp3/)
    if (cdnMatch) {
      const title = extractTitle(html)
      return NextResponse.json({ title, audioUrl: cdnMatch[0] })
    }

    // ── Strategy 3: og:audio meta tag ─────────────────────────────────────────
    const ogAudio =
      html.match(/property="og:audio"\s+content="([^"]+)"/) ||
      html.match(/content="([^"]+)"\s+property="og:audio"/)
    if (ogAudio) {
      return NextResponse.json({ title: extractTitle(html), audioUrl: ogAudio[1] })
    }
  } catch { /* fall through to CDN fallback */ }

  // ── Fallback: construct CDN URL if we have a UUID ─────────────────────────
  if (uuid) {
    return NextResponse.json({
      title: 'Suno Track',
      audioUrl: `https://cdn1.suno.ai/${uuid}.mp3`,
    })
  }

  return NextResponse.json({ error: 'Could not resolve Suno track' }, { status: 422 })
}

function extractTitle(html: string): string {
  const m =
    html.match(/property="og:title"\s+content="([^"]+)"/) ||
    html.match(/content="([^"]+)"\s+property="og:title"/) ||
    html.match(/<title>([^<]+)<\/title>/)
  return (m?.[1] ?? 'Suno Track').replace(/\s*[|–-]\s*Suno\s*$/i, '').trim() || 'Suno Track'
}
