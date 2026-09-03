/**
 * Stutosed Dynamic Mithila SVG Thumbnail Generator Engine
 * Generates vector SVG thumbnails on the fly matching the exact lecture or course title.
 */

export interface ThumbnailOptions {
  title?: string | null;
  category?: string | null;
  subtitle?: string | null;
  theme?: 'light' | 'dark';
}

function escapeXml(str: string): string {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

interface Palette {
  accent: string;
  accentDark: string;
}

const COLOR_PALETTES: Record<string, Palette> = {
  rose: { accent: '#e11d48', accentDark: '#fb7185' },
  blue: { accent: '#0284c7', accentDark: '#38bdf8' },
  amber: { accent: '#d97706', accentDark: '#fbbf24' },
  orange: { accent: '#ea580c', accentDark: '#fb923c' },
  emerald: { accent: '#059669', accentDark: '#34d399' },
  violet: { accent: '#7c3aed', accentDark: '#a78bfa' },
  indigo: { accent: '#4f46e5', accentDark: '#818cf8' },
  green: { accent: '#16a34a', accentDark: '#4ade80' },
  terracotta: { accent: '#c2410c', accentDark: '#f97316' },
};

function pickPalette(text: string): Palette {
  const t = (text || '').toLowerCase();
  if (t.includes('math') || t.includes('algebra') || t.includes('geometry') || t.includes('number') || t.includes('arithmetic')) {
    return COLOR_PALETTES.amber;
  }
  if (t.includes('physics') || t.includes('electr') || t.includes('wave') || t.includes('quantum') || t.includes('optics')) {
    return COLOR_PALETTES.blue;
  }
  if (t.includes('chem') || t.includes('graphic') || t.includes('drawing') || t.includes('organic') || t.includes('inorganic')) {
    return COLOR_PALETTES.rose;
  }
  if (t.includes('mech') || t.includes('civil') || t.includes('workshop') || t.includes('manufacturing') || t.includes('thermo')) {
    return COLOR_PALETTES.orange;
  }
  if (t.includes('english') || t.includes('vocab') || t.includes('gramm') || t.includes('communicat') || t.includes('comprehension')) {
    return COLOR_PALETTES.emerald;
  }
  if (t.includes('computer') || t.includes('cse') || t.includes('program') || t.includes('reasoning') || t.includes('logic') || t.includes('coding')) {
    return COLOR_PALETTES.indigo;
  }
  if (t.includes('bio') || t.includes('ecolog') || t.includes('environment') || t.includes('botany') || t.includes('zoology')) {
    return COLOR_PALETTES.green;
  }
  if (t.includes('histor') || t.includes('polity') || t.includes('gk') || t.includes('gs') || t.includes('geograph') || t.includes('econom') || t.includes('static')) {
    return COLOR_PALETTES.violet;
  }
  return COLOR_PALETTES.terracotta;
}

function wrapTitleLines(text: string, maxCharsPerLine: number = 22): string[] {
  const words = (text || '').trim().split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    if (!w) continue;
    if ((current + ' ' + w).trim().length <= maxCharsPerLine) {
      current = (current + ' ' + w).trim();
    } else {
      if (current) lines.push(current);
      current = w;
    }
    if (lines.length >= 3) break;
  }
  if (current && lines.length < 3) lines.push(current);
  return lines.length > 0 ? lines : ['STUDY VAULT'];
}

export function generateDynamicSvgThumbnail(options: ThumbnailOptions): string {
  const { title = 'Study Lecture', category, theme = 'light' } = options;
  const isDark = theme === 'dark';

  const rawTitle = (title || 'Study Lecture').trim();
  const rawCat = (category || '').trim();

  const palette = pickPalette(`${rawCat} ${rawTitle}`);
  const accent = isDark ? palette.accentDark : palette.accent;

  // Clean title & extract lecture number / tag if present
  let cleanTitle = rawTitle;
  let eyebrow = rawCat || 'STUTOSED LEARNING';

  const lectureMatch = cleanTitle.match(/^(?:(?:\d{1,4}\.\s*)?(?:Lecture|Class|Lec)\s*(\d{1,3}))\s*(?:[•|:\-–—])\s*(.*)$/i);
  if (lectureMatch) {
    const num = lectureMatch[1];
    cleanTitle = lectureMatch[2].trim() || cleanTitle;
    eyebrow = `${rawCat ? rawCat + ' • ' : ''}LECTURE ${num.padStart(2, '0')}`;
  } else {
    // If pipe separated (e.g. "Class-01 | Intro")
    const pipeMatch = cleanTitle.match(/^([^|•–—]+)\s*[|•–—]\s*(.+)$/);
    if (pipeMatch && pipeMatch[1].length < 15) {
      eyebrow = `${rawCat ? rawCat + ' • ' : ''}${pipeMatch[1].trim()}`;
      cleanTitle = pipeMatch[2].trim();
    }
  }

  // Determine line wrap threshold and font size dynamically
  let maxChars = 22;
  let fontSize = 58;

  if (cleanTitle.length > 40) {
    maxChars = 28;
    fontSize = 38;
  } else if (cleanTitle.length > 22) {
    maxChars = 24;
    fontSize = 46;
  }

  const lines = wrapTitleLines(cleanTitle, maxChars);
  if (lines.length === 3 && fontSize > 40) {
    fontSize = 38;
  }

  const lineHeight = fontSize * 1.18;
  const totalTextHeight = lines.length * lineHeight;
  const startY = 380 - totalTextHeight / 2 + fontSize * 0.75;

  const bgGradient = isDark
    ? `<radialGradient id="bg-grad" cx="50%" cy="45%" r="75%">
         <stop offset="0%" stop-color="#1c1a17" />
         <stop offset="60%" stop-color="#121110" />
         <stop offset="100%" stop-color="#0a0908" />
       </radialGradient>`
    : `<radialGradient id="bg-grad" cx="50%" cy="45%" r="75%">
         <stop offset="0%" stop-color="#FFFFFF" />
         <stop offset="60%" stop-color="#F8F9FA" />
         <stop offset="100%" stop-color="#F1F3F5" />
       </radialGradient>`;

  const textColor = isDark ? '#FFFFFF' : '#111827';
  const textColorSecondary = isDark ? 'rgba(255,255,255,0.85)' : '#1F2937';
  const gridStroke = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.035)';
  const hairlineBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
  const footerText = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.45)';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    ${bgGradient}
    <radialGradient id="accent-glow-rad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="${isDark ? '0.2' : '0.12'}" />
      <stop offset="60%" stop-color="${accent}" stop-opacity="0.03" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${gridStroke}" stroke-width="1" />
      <circle cx="40" cy="40" r="1" fill="${gridStroke}" />
    </pattern>
  </defs>

  <rect width="1280" height="720" fill="url(#bg-grad)" />
  <rect width="1280" height="720" fill="url(#grid-pattern)" />
  <circle cx="640" cy="380" r="440" fill="url(#accent-glow-rad)" />

  <!-- Outer Hairline Border -->
  <rect x="36" y="36" width="1208" height="648" rx="20" fill="none" stroke="${hairlineBorder}" stroke-width="1.5" />

  <!-- Inner Mithila Dashed Geometric Frame -->
  <rect x="52" y="52" width="1176" height="616" rx="14" fill="none" stroke="${accent}" stroke-width="1.4" stroke-dasharray="10 6" opacity="0.55" />

  <!-- 4 Corner Mithila Folk Geometric Ornaments -->
  <g transform="translate(68, 68) rotate(0)">
    <path d="M 0 0 L 32 0 L 32 4 L 4 4 L 4 32 L 0 32 Z" fill="${accent}" opacity="0.9" />
    <polygon points="14,14 26,14 26,26 14,26" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.85" />
    <polygon points="20,8 26,14 20,20 14,14" fill="${accent}" opacity="0.95" />
    <circle cx="40" cy="14" r="2.8" fill="${accent}" opacity="0.75" />
    <circle cx="14" cy="40" r="2.8" fill="${accent}" opacity="0.75" />
  </g>
  <g transform="translate(1212, 68) rotate(90)">
    <path d="M 0 0 L 32 0 L 32 4 L 4 4 L 4 32 L 0 32 Z" fill="${accent}" opacity="0.9" />
    <polygon points="14,14 26,14 26,26 14,26" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.85" />
    <polygon points="20,8 26,14 20,20 14,14" fill="${accent}" opacity="0.95" />
    <circle cx="40" cy="14" r="2.8" fill="${accent}" opacity="0.75" />
    <circle cx="14" cy="40" r="2.8" fill="${accent}" opacity="0.75" />
  </g>
  <g transform="translate(1212, 652) rotate(180)">
    <path d="M 0 0 L 32 0 L 32 4 L 4 4 L 4 32 L 0 32 Z" fill="${accent}" opacity="0.9" />
    <polygon points="14,14 26,14 26,26 14,26" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.85" />
    <polygon points="20,8 26,14 20,20 14,14" fill="${accent}" opacity="0.95" />
    <circle cx="40" cy="14" r="2.8" fill="${accent}" opacity="0.75" />
    <circle cx="14" cy="40" r="2.8" fill="${accent}" opacity="0.75" />
  </g>
  <g transform="translate(68, 652) rotate(270)">
    <path d="M 0 0 L 32 0 L 32 4 L 4 4 L 4 32 L 0 32 Z" fill="${accent}" opacity="0.9" />
    <polygon points="14,14 26,14 26,26 14,26" fill="none" stroke="${accent}" stroke-width="1.4" opacity="0.85" />
    <polygon points="20,8 26,14 20,20 14,14" fill="${accent}" opacity="0.95" />
    <circle cx="40" cy="14" r="2.8" fill="${accent}" opacity="0.75" />
    <circle cx="14" cy="40" r="2.8" fill="${accent}" opacity="0.75" />
  </g>

  <!-- Top Geometric Header Divider with Mithila Motif -->
  <g transform="translate(640, 140)">
    <line x1="-240" y1="0" x2="-40" y2="0" stroke="${accent}" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.55" />
    <polygon points="0,-12 3,-3 12,0 3,3 0,12 -3,3 -12,0 -3,-3" fill="${accent}" opacity="0.95" />
    <circle cx="0" cy="0" r="3" fill="${isDark ? '#1c1a17' : '#FFFFFF'}" />
    <circle cx="0" cy="0" r="1.5" fill="${accent}" />
    <line x1="40" y1="0" x2="240" y2="0" stroke="${accent}" stroke-width="1.2" stroke-dasharray="6 4" opacity="0.55" />
  </g>

  <!-- Category / Eyebrow Pill -->
  <g transform="translate(640, 195)">
    <text x="0" y="0" text-anchor="middle" font-family="'Space Grotesk', -apple-system, system-ui, sans-serif" font-size="16" font-weight="700" letter-spacing="4" fill="${accent}" text-transform="uppercase">
      ${escapeXml(eyebrow)}
    </text>
  </g>

  <!-- Dominant Typography -->
  <g>
    ${lines
      .map(
        (line, idx) =>
          `<text x="640" y="${startY + idx * lineHeight}" text-anchor="middle" font-family="'Space Grotesk', -apple-system, system-ui, sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="-0.5" fill="${
            idx === 0 ? textColor : textColorSecondary
          }">${escapeXml(line.toUpperCase())}</text>`
      )
      .join('\n    ')}
  </g>

  <!-- Bottom Mithila Divider & Stutosed Wordmark -->
  <g transform="translate(640, 570)">
    <line x1="-160" y1="0" x2="-25" y2="0" stroke="${accent}" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
    <polygon points="0,-5 5,0 0,5 -5,0" fill="${accent}" opacity="0.85" />
    <line x1="25" y1="0" x2="160" y2="0" stroke="${accent}" stroke-width="1" stroke-dasharray="4 4" opacity="0.6" />
  </g>

  <g transform="translate(640, 615)">
    <text x="0" y="0" text-anchor="middle" font-family="'Space Grotesk', -apple-system, system-ui, sans-serif" font-size="14.5" font-weight="600" letter-spacing="3" fill="${footerText}">
      STUTOSED • STUDY VAULT
    </text>
  </g>
</svg>`;
}
