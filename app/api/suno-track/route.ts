import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  }

  // Validate UUID format
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
    return NextResponse.json({ error: 'Invalid Suno song ID' }, { status: 400 })
  }

  const pageUrl = `https://suno.com/song/${id}`

  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      next: { revalidate: 3600 },
    })

    const html = await res.text()

    // Extract og:audio or twitter:player:stream
    const audioMatch =
      html.match(/property="og:audio"\s+content="([^"]+)"/) ||
      html.match(/content="([^"]+)"\s+property="og:audio"/) ||
      html.match(/name="twitter:player:stream"\s+content="([^"]+)"/) ||
      html.match(/content="([^"]+)"\s+name="twitter:player:stream"/)

    // Extract og:title
    const titleMatch =
      html.match(/property="og:title"\s+content="([^"]+)"/) ||
      html.match(/content="([^"]+)"\s+property="og:title"/) ||
      html.match(/<title>([^<]+)<\/title>/)

    // Fallback: known Suno CDN pattern
    const audioUrl = audioMatch?.[1] ?? `https://cdn1.suno.ai/${id}.mp3`
    const rawTitle = titleMatch?.[1] ?? 'Suno Track'
    // Strip " | Suno" or " - Suno" suffixes common in Suno page titles
    const title = rawTitle.replace(/\s*[|–-]\s*Suno\s*$/i, '').trim() || 'Suno Track'

    return NextResponse.json({ title, audioUrl })
  } catch {
    // Fallback without page fetch
    return NextResponse.json({
      title: 'Suno Track',
      audioUrl: `https://cdn1.suno.ai/${id}.mp3`,
    })
  }
}
