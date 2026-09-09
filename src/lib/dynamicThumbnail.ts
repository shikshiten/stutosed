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
         <stop offset="0%" stop-color="#1f1d1a" />
         <stop offset="60%" stop-color="#131211" />
         <stop offset="100%" stop-color="#0b0a0a" />
       </radialGradient>`
    : `<radialGradient id="bg-grad" cx="50%" cy="45%" r="75%">
         <stop offset="0%" stop-color="#FFFFFF" />
         <stop offset="60%" stop-color="#F8F9FA" />
         <stop offset="100%" stop-color="#F1F3F5" />
       </radialGradient>`;

  const textColor = isDark ? '#FFFFFF' : '#111827';
  const textColorSecondary = isDark ? '#F3F4F6' : '#1F2937';
  const gridStroke = isDark ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.035)';
  const hairlineBorder = isDark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.09)';
  const footerText = isDark ? 'rgba(255,255,255,0.42)' : 'rgba(0,0,0,0.42)';

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    ${bgGradient}
    <radialGradient id="accent-glow-rad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${accent}" stop-opacity="${isDark ? '0.18' : '0.12'}" />
      <stop offset="60%" stop-color="${accent}" stop-opacity="${isDark ? '0.03' : '0.02'}" />
      <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
    </radialGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="6" stdDeviation="12" flood-color="#000000" flood-opacity="${isDark ? '0.75' : '0.12'}" />
    </filter>
    <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="${gridStroke}" stroke-width="1" />
      <circle cx="40" cy="40" r="1" fill="${gridStroke}" />
    </pattern>
  </defs>

  <rect width="1280" height="720" fill="url(#bg-grad)" />
  <rect width="1280" height="720" fill="url(#grid-pattern)" />
  <circle cx="640" cy="360" r="460" fill="url(#accent-glow-rad)" />

  <!-- Modern Hairline Card Border -->
  <rect x="40" y="40" width="1200" height="640" rx="24" fill="none" stroke="${hairlineBorder}" stroke-width="1.5" />

  <!-- Modern Top Accent Energy Bar -->
  <rect x="520" y="40" width="240" height="3" rx="1.5" fill="${accent}" opacity="0.85" />

  <!-- Category / Eyebrow Modern Capsule Pill -->
  <g transform="translate(640, 165)">
    <rect x="-180" y="-18" width="360" height="36" rx="18" fill="${accent}" fill-opacity="${isDark ? '0.15' : '0.1'}" stroke="${accent}" stroke-opacity="0.35" stroke-width="1" />
    <circle cx="-150" cy="0" r="4" fill="${accent}" />
    <text x="0" y="5" text-anchor="middle" font-family="'Space Grotesk', -apple-system, system-ui, sans-serif" font-size="14.5" font-weight="700" letter-spacing="2.5" fill="${accent}" text-transform="uppercase">
      ${escapeXml(eyebrow)}
    </text>
  </g>

  <!-- Dominant High-Impact Typography -->
  <g>
    ${lines
      .map(
        (line, idx) =>
          `<text x="640" y="${startY + idx * lineHeight}" text-anchor="middle" font-family="'Space Grotesk', -apple-system, system-ui, sans-serif" font-size="${fontSize}" font-weight="800" letter-spacing="-0.5" fill="${
            idx === 0 ? textColor : textColorSecondary
          }" filter="url(#shadow)">${escapeXml(line.toUpperCase())}</text>`
      )
      .join('\n    ')}
  </g>

  <!-- Clean Minimalist Footer Accent -->
  <g transform="translate(640, 595)">
    <line x1="-120" y1="0" x2="120" y2="0" stroke="${accent}" stroke-opacity="0.3" stroke-width="1" />
    <circle cx="0" cy="0" r="3" fill="${accent}" opacity="0.7" />
  </g>

  <g transform="translate(640, 630)">
    <text x="0" y="0" text-anchor="middle" font-family="'Space Grotesk', -apple-system, system-ui, sans-serif" font-size="13" font-weight="600" letter-spacing="3" fill="${footerText}">
      STUTOSED • VERIFIED STUDY RESOURCE
    </text>
  </g>
</svg>`;
}
