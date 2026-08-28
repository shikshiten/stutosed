/**
 * Embed Proxy – serves modified Vidmoly/Earnvids or StreamVault HTML with speed control bridge.
 *
 * We fetch the original embed page, inject a base tag and tiny script that listens
 * for postMessage commands from the parent page, and forward them to
 * the embedded player. This gives us iframe embedding without X-Frame-Options blocks.
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
  const targetUrl = request.nextUrl.searchParams.get('url');

  // =========================================================================
  // MODE 1: Direct URL Embed Proxy (e.g. StreamVault /0:/stream/...)
  // =========================================================================
  if (targetUrl) {
    try {
      let fetchUrl = targetUrl;
      // If given a /0:/dl/ URL, convert to /0:/stream/ for embed mode
      if (fetchUrl.includes('streamvaultpro.cc') && fetchUrl.includes('/0:/dl/')) {
        fetchUrl = fetchUrl.replace('/0:/dl/', '/0:/stream/');
      }

      const res = await fetch(fetchUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          Referer: 'https://www.streamvaultpro.cc/',
        },
      });

      if (!res.ok) {
        return new NextResponse(`Upstream ${res.status}`, { status: res.status });
      }

      let html = await res.text();

      // Inject <base href="..."> so that all relative assets (JS, CSS, fonts, SVG) resolve to origin
      const origin = new URL(fetchUrl).origin + '/';
      if (html.includes('<head>')) {
        html = html.replace('<head>', `<head><base href="${origin}">`);
      } else {
        html = `<base href="${origin}">` + html;
      }

      // Inject speed bridge script before </body>
      if (html.includes('</body>')) {
        html = html.replace('</body>', SPEED_BRIDGE_SCRIPT + '</body>');
      } else {
        html = html + SPEED_BRIDGE_SCRIPT;
      }

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

  // =========================================================================
  // MODE 2: Vidmoly / Earnvids Code Extractor
  // =========================================================================
  const code = request.nextUrl.searchParams.get('code');
  const provider = request.nextUrl.searchParams.get('provider') || 'vidmoly';

  if (!code) {
    return new NextResponse('Missing code or url', { status: 400 });
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
