import { NextRequest, NextResponse } from 'next/server';

function unpackDeanEdwards(packed: string): string | null {
  try {
    const match = packed.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]*?return p\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)/);
    if (match) {
      let [_, p, aStr, cStr, kStr] = match;
      let a = parseInt(aStr, 10);
      let c = parseInt(cStr, 10);
      let k = kStr.split('|');
      while (c--) {
        if (k[c]) {
          p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
        }
      }
      return p;
    }
    const match2 = packed.match(/\}\('([\s\S]*?)',(\d+),(\d+),'([\s\S]*?)'\.split\('\|'\)/);
    if (match2) {
      let [_, p, aStr, cStr, kStr] = match2;
      let a = parseInt(aStr, 10);
      let c = parseInt(cStr, 10);
      let k = kStr.split('|');
      while (c--) {
        if (k[c]) {
          p = p.replace(new RegExp('\\b' + c.toString(a) + '\\b', 'g'), k[c]);
        }
      }
      return p;
    }
  } catch {
    return null;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const provider = searchParams.get('provider') || 'vidmoly'; // 'vidmoly' | 'earnvids'

  if (!code) {
    return NextResponse.json({ error: 'Missing file code' }, { status: 400 });
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
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Referer': referer,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      next: { revalidate: 600 }, // Cache stream token for 10 minutes
    });

    if (!res.ok) {
      return NextResponse.json({ error: `Provider returned HTTP ${res.status}`, status: res.status }, { status: 502 });
    }

    const html = await res.text();

    // 1. Check direct .m3u8 match in HTML
    const directM3u8 = html.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/);
    if (directM3u8) {
      return NextResponse.json({
        streamUrl: directM3u8[0],
        type: 'hls',
        provider,
        code,
      });
    }

    // 2. Check for Dean Edwards packed JS (common in Earnvids/Vidmoly)
    const packedMatches = html.match(/eval\(function\(p,a,c,k,e,d\)[\s\S]*?\.split\('\|'\)\)\)/g) || [];
    for (const packed of packedMatches) {
      const unpacked = unpackDeanEdwards(packed);
      if (unpacked) {
        const unpackedM3u8 = unpacked.match(/https?:\/\/[^"'\s\\]+\.m3u8[^"'\s\\]*/);
        if (unpackedM3u8) {
          return NextResponse.json({
            streamUrl: unpackedM3u8[0],
            type: 'hls',
            provider,
            code,
          });
        }
      }
    }

    // 3. Check for direct file/sources pattern
    const fileMatch = html.match(/["'](?:file|src)["']\s*:\s*["']([^"']+\.m3u8[^"']*)["']/);
    if (fileMatch) {
      return NextResponse.json({
        streamUrl: fileMatch[1],
        type: 'hls',
        provider,
        code,
      });
    }

    return NextResponse.json({ error: 'Stream URL could not be resolved from provider.' }, { status: 404 });

  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
