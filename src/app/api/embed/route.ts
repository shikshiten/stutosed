/**
 * Embed Proxy – serves modified Vidmoly/Earnvids HTML with speed control bridge.
 *
 * We fetch the original embed page, inject a tiny script that listens
 * for postMessage commands from the parent page, and forward them to
 * JWPlayer's API. This gives us cross-origin speed control.
 */
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const SPEED_BRIDGE_SCRIPT = `
<script>
(function() {
  // Listen for speed commands from parent window
  window.addEventListener('message', function(e) {
    try {
      var data = e.data;
      if (data && data.type === 'setPlaybackRate' && typeof data.rate === 'number') {
        // Try JWPlayer API
        if (typeof jwplayer === 'function') {
          var p = jwplayer();
          if (p && p.setPlaybackRate) {
            p.setPlaybackRate(data.rate);
            return;
          }
        }
        // Fallback: find any <video> element
        var videos = document.querySelectorAll('video');
        for (var i = 0; i < videos.length; i++) {
          videos[i].playbackRate = data.rate;
        }
      }
    } catch(err) {}
  });
})();
</script>
`;

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const provider = request.nextUrl.searchParams.get('provider') || 'vidmoly';

  if (!code) {
    return new NextResponse('Missing code', { status: 400 });
  }

  try {
    let embedUrl = '';
    let referer = '';

    if (provider === 'earnvids') {
      embedUrl = `https://morencius.com/v/${code}`;
      referer = 'https://morencius.com/';
    } else {
      embedUrl = `https://vidmoly.net/embed-${code}.html`;
      referer = 'https://vidmoly.net/';
    }

    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Referer: referer,
        Accept:
          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    });

    if (!res.ok) {
      return new NextResponse(`Upstream ${res.status}`, { status: res.status });
    }

    let html = await res.text();

    // Inject speed bridge script before </body>
    html = html.replace('</body>', SPEED_BRIDGE_SCRIPT + '</body>');

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache, no-store',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Embed proxy error';
    return new NextResponse(message, { status: 502 });
  }
}
