const fs = require('fs');
const path = require('path');

const SUBJECTS_DIR = path.join(__dirname, '..', 'public', 'thumbnails', 'subjects');
const THUMBNAILS_DIR = path.join(__dirname, '..', 'public', 'thumbnails');

if (!fs.existsSync(SUBJECTS_DIR)) {
  fs.mkdirSync(SUBJECTS_DIR, { recursive: true });
}

function escapeXml(str) {
  return (str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Common SVG Frame Generator
 * Generates an ultra-premium, architectural Black & White (Monochrome) SVG
 */
function createBwSvg({
  theme = 'dark',
  eyebrow = '',
  title = '',
  subtitle = '',
  footer = 'STUTOSED • VERIFIED STUDY RESOURCE',
  artwork = '',
}) {
  const isDark = theme === 'dark';

  // Monochrome Color Palette
  const bgGradStart = isDark ? '#141418' : '#ffffff';
  const bgGradMid = isDark ? '#0e0e11' : '#f4f4f6';
  const bgGradEnd = isDark ? '#08080a' : '#ececee';

  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.035)';
  const gridDot = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.06)';
  const cardBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)';
  const innerGlow = isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(0, 0, 0, 0.02)';

  const topBarFill = isDark ? 'rgba(255, 255, 255, 0.85)' : '#18181b';
  const pillBg = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
  const pillBorder = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.2)';
  const pillText = isDark ? '#e4e4e7' : '#18181b';
  const pillDot = isDark ? '#ffffff' : '#09090b';

  const titleFill = isDark ? '#ffffff' : '#09090b';
  const subtitleFill = isDark ? '#a1a1aa' : '#52525b';
  const shadowColor = isDark ? '#000000' : 'rgba(0,0,0,0.12)';
  const dividerStroke = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(0, 0, 0, 0.18)';
  const watermarkFill = isDark ? 'rgba(255, 255, 255, 0.42)' : 'rgba(0, 0, 0, 0.42)';

  const escapedEyebrow = escapeXml(eyebrow.toUpperCase());
  const escapedTitle = escapeXml(title);
  const escapedSubtitle = escapeXml(subtitle);
  const escapedFooter = escapeXml(footer);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1280 720" width="1280" height="720">
  <defs>
    <!-- Monochrome Radial Gradient Background -->
    <radialGradient id="bg-grad" cx="50%" cy="40%" r="75%">
      <stop offset="0%" stop-color="${bgGradStart}" />
      <stop offset="55%" stop-color="${bgGradMid}" />
      <stop offset="100%" stop-color="${bgGradEnd}" />
    </radialGradient>

    <!-- Subtle Center Focus Glow -->
    <radialGradient id="center-glow" cx="50%" cy="35%" r="55%">
      <stop offset="0%" stop-color="${innerGlow}" />
      <stop offset="100%" stop-color="transparent" />
    </radialGradient>

    <!-- Drop Shadow Filter for Typography -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="10" flood-color="${shadowColor}" flood-opacity="${isDark ? '0.7' : '0.15'}" />
    </filter>

    <!-- Technical Micro-Grid Pattern -->
    <pattern id="grid-pattern" width="32" height="32" patternUnits="userSpaceOnUse">
      <path d="M 32 0 L 0 0 0 32" fill="none" stroke="${gridStroke}" stroke-width="1" />
      <circle cx="32" cy="32" r="1" fill="${gridDot}" />
    </pattern>
  </defs>

  <!-- Canvas Background -->
  <rect width="1280" height="720" fill="url(#bg-grad)" />
  <rect width="1280" height="720" fill="url(#grid-pattern)" />
  <circle cx="640" cy="320" r="480" fill="url(#center-glow)" />

  <!-- Architectural Card Hairline Frame -->
  <rect x="36" y="36" width="1208" height="648" rx="20" fill="none" stroke="${cardBorder}" stroke-width="1.5" />

  <!-- Corner Tech Crosshairs -->
  <g stroke="${cardBorder}" stroke-width="1.5">
    <path d="M 30 50 L 50 50 M 50 30 L 50 50" />
    <path d="M 1250 50 L 1230 50 M 1230 30 L 1230 50" />
    <path d="M 30 670 L 50 670 M 50 690 L 50 670" />
    <path d="M 1250 670 L 1230 670 M 1230 690 L 1230 670" />
  </g>

  <!-- Top Accent Bar -->
  <rect x="540" y="36" width="200" height="3.5" rx="2" fill="${topBarFill}" />

  <!-- Top Category Capsule Pill -->
  <g transform="translate(640, 110)">
    <rect x="-210" y="-18" width="420" height="36" rx="18" fill="${pillBg}" stroke="${pillBorder}" stroke-width="1.2" />
    <circle cx="-180" cy="0" r="4" fill="${pillDot}" />
    <circle cx="180" cy="0" r="4" fill="${pillDot}" />
    <text x="0" y="5" text-anchor="middle" font-family="'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="13" font-weight="700" letter-spacing="2.5" fill="${pillText}">
      ${escapedEyebrow}
    </text>
  </g>

  <!-- Central Bespoke Vector Artwork -->
  <g transform="translate(640, 260)">
    ${artwork}
  </g>

  <!-- High-Impact Bold Typography -->
  <g transform="translate(640, 480)">
    <text x="0" y="0" text-anchor="middle" font-family="'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="60" font-weight="800" letter-spacing="-0.5" fill="${titleFill}" filter="url(#shadow)">
      ${escapedTitle}
    </text>
    <text x="0" y="52" text-anchor="middle" font-family="'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="24" font-weight="600" letter-spacing="1.5" fill="${subtitleFill}">
      ${escapedSubtitle}
    </text>
  </g>

  <!-- Clean Minimalist Footer Accent -->
  <g transform="translate(640, 615)">
    <line x1="-140" y1="0" x2="140" y2="0" stroke="${dividerStroke}" stroke-width="1" />
    <circle cx="0" cy="0" r="3.5" fill="${topBarFill}" />
    <circle cx="-140" cy="0" r="2" fill="${dividerStroke}" />
    <circle cx="140" cy="0" r="2" fill="${dividerStroke}" />
  </g>

  <!-- Wordmark -->
  <g transform="translate(640, 650)">
    <text x="0" y="0" text-anchor="middle" font-family="'Space Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="12" font-weight="600" letter-spacing="3" fill="${watermarkFill}">
      ${escapedFooter}
    </text>
  </g>
</svg>`;
}

/**
 * 1. COMPUTER SPECIAL (Yatendra Sir)
 * Bespoke Silicon Microprocessor / CPU + Circuit traces + Binary Data Stream + Terminal
 */
function getComputerArtwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cSub = isDark ? 'rgba(255,255,255,0.65)' : 'rgba(24,24,27,0.65)';
  const cFaint = isDark ? 'rgba(255,255,255,0.22)' : 'rgba(24,24,27,0.22)';
  const cChipBg = isDark ? '#18181d' : '#e4e4e7';

  return `
    <!-- Motherboard Grid Lines and Circuit Traces -->
    <g stroke="${cFaint}" stroke-width="1.5" fill="none">
      <!-- Left Circuit Lines -->
      <path d="M -160 -40 L -90 -40 L -60 -10" />
      <path d="M -170 0 L -80 0" />
      <path d="M -160 40 L -90 40 L -60 10" />
      <circle cx="-160" cy="-40" r="3" fill="${cSub}" />
      <circle cx="-170" cy="0" r="3" fill="${cSub}" />
      <circle cx="-160" cy="40" r="3" fill="${cSub}" />

      <!-- Right Circuit Lines -->
      <path d="M 160 -40 L 90 -40 L 60 -10" />
      <path d="M 170 0 L 80 0" />
      <path d="M 160 40 L 90 40 L 60 10" />
      <circle cx="160" cy="-40" r="3" fill="${cSub}" />
      <circle cx="170" cy="0" r="3" fill="${cSub}" />
      <circle cx="160" cy="40" r="3" fill="${cSub}" />

      <!-- Top and Bottom Traces -->
      <path d="M -30 -100 L -30 -60" />
      <path d="M 30 -100 L 30 -60" />
      <path d="M 0 -110 L 0 -60" />
      <path d="M -30 100 L -30 60" />
      <path d="M 30 100 L 30 60" />
      <path d="M 0 110 L 0 60" />
      <circle cx="0" cy="-110" r="3" fill="${cSub}" />
      <circle cx="0" cy="110" r="3" fill="${cSub}" />
    </g>

    <!-- Outer CPU Heat Spreader -->
    <rect x="-65" y="-65" width="130" height="130" rx="16" fill="${cChipBg}" stroke="${cMain}" stroke-width="2.5" />

    <!-- CPU Pins -->
    <g fill="${cMain}">
      <!-- Top Pins -->
      <rect x="-45" y="-72" width="6" height="7" rx="1" />
      <rect x="-25" y="-72" width="6" height="7" rx="1" />
      <rect x="-5" y="-72" width="6" height="7" rx="1" />
      <rect x="15" y="-72" width="6" height="7" rx="1" />
      <rect x="35" y="-72" width="6" height="7" rx="1" />
      <!-- Bottom Pins -->
      <rect x="-45" y="65" width="6" height="7" rx="1" />
      <rect x="-25" y="65" width="6" height="7" rx="1" />
      <rect x="-5" y="65" width="6" height="7" rx="1" />
      <rect x="15" y="65" width="6" height="7" rx="1" />
      <rect x="35" y="65" width="6" height="7" rx="1" />
      <!-- Left Pins -->
      <rect x="-72" y="-45" width="7" height="6" rx="1" />
      <rect x="-72" y="-25" width="7" height="6" rx="1" />
      <rect x="-72" y="-5" width="7" height="6" rx="1" />
      <rect x="-72" y="15" width="7" height="6" rx="1" />
      <rect x="-72" y="35" width="7" height="6" rx="1" />
      <!-- Right Pins -->
      <rect x="65" y="-45" width="7" height="6" rx="1" />
      <rect x="65" y="-25" width="7" height="6" rx="1" />
      <rect x="65" y="-5" width="7" height="6" rx="1" />
      <rect x="65" y="15" width="7" height="6" rx="1" />
      <rect x="65" y="35" width="7" height="6" rx="1" />
    </g>

    <!-- Inner Silicon Die / Core Label -->
    <rect x="-42" y="-42" width="84" height="84" rx="8" fill="none" stroke="${cSub}" stroke-width="1.5" stroke-dasharray="4 2" />
    <path d="M -20 -20 L -30 -20 M 20 -20 L 30 -20 M -20 20 L -30 20 M 20 20 L 30 20" stroke="${cSub}" stroke-width="2" />
    
    <text x="0" y="-4" text-anchor="middle" font-family="'Space Grotesk', monospace" font-size="15" font-weight="800" letter-spacing="2" fill="${cMain}">CORE 29</text>
    <text x="0" y="15" text-anchor="middle" font-family="'Space Grotesk', monospace" font-size="10" font-weight="700" letter-spacing="3" fill="${cSub}">YATENDRA</text>

    <!-- Floating Terminal and Binary Elements -->
    <g transform="translate(-180, -20)">
      <rect x="-45" y="-12" width="90" height="24" rx="6" fill="${cChipBg}" stroke="${cFaint}" stroke-width="1" />
      <text x="0" y="4" text-anchor="middle" font-family="monospace" font-size="11" font-weight="700" fill="${cSub}">&gt;_ SYS_29</text>
    </g>
    <g transform="translate(180, -20)">
      <rect x="-45" y="-12" width="90" height="24" rx="6" fill="${cChipBg}" stroke="${cFaint}" stroke-width="1" />
      <text x="0" y="4" text-anchor="middle" font-family="monospace" font-size="11" font-weight="700" fill="${cSub}">{ BINARY }</text>
    </g>
    <text x="0" y="-95" text-anchor="middle" font-family="monospace" font-size="10" letter-spacing="4" fill="${cFaint}">01000011 01010000 01010101</text>
  `;
}

/**
 * 2. ENGLISH GRAMMAR (English Faculty • SPL-26)
 * Classical Serif Typography 'Aa' + Quill Pen + Open Tome + Syntax Structure
 */
function getEnglishGrammarArtwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cSub = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(24,24,27,0.7)';
  const cFaint = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
  const cSealBg = isDark ? '#16161b' : '#f0f0f3';

  return `
    <!-- Outer Concentric Academy Seal Ring -->
    <circle cx="0" cy="0" r="76" fill="${cSealBg}" stroke="${cMain}" stroke-width="2" />
    <circle cx="0" cy="0" r="68" fill="none" stroke="${cFaint}" stroke-width="1.2" stroke-dasharray="3 3" />
    <circle cx="0" cy="0" r="58" fill="none" stroke="${cSub}" stroke-width="1" />

    <!-- Editorial Serif Monogram 'Aa' -->
    <text x="-8" y="16" text-anchor="middle" font-family="'Georgia', 'Times New Roman', serif" font-size="52" font-weight="700" fill="${cMain}">A</text>
    <text x="24" y="16" text-anchor="middle" font-family="'Georgia', 'Times New Roman', serif" font-size="34" font-style="italic" font-weight="600" fill="${cSub}">a</text>

    <!-- Classical Quill Pen angled across bottom -->
    <g transform="translate(30, 20) rotate(-45)">
      <path d="M 0 0 C 4 -20 15 -45 40 -70 C 25 -45 18 -20 16 0 L 0 0 Z" fill="${cMain}" />
      <path d="M 1 0 L 0 8 L -1 0 Z" fill="${cMain}" />
      <line x1="12" y1="-25" x2="28" y2="-55" stroke="${isDark ? '#16161b' : '#ffffff'}" stroke-width="1.2" />
    </g>

    <!-- Syntax and Rules Badges Flanking the Center -->
    <g transform="translate(-160, 0)">
      <rect x="-42" y="-14" width="84" height="28" rx="14" fill="${cSealBg}" stroke="${cFaint}" stroke-width="1.2" />
      <text x="0" y="4" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="700" letter-spacing="1.5" fill="${cSub}">SYNTAX</text>
    </g>
    <g transform="translate(160, 0)">
      <rect x="-42" y="-14" width="84" height="28" rx="14" fill="${cSealBg}" stroke="${cFaint}" stroke-width="1.2" />
      <text x="0" y="4" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="700" letter-spacing="1.5" fill="${cSub}">RULES</text>
    </g>

    <!-- Grammar Brackets and Connector Lines -->
    <path d="M -110 -30 L -90 -30 L -90 30 L -110 30" fill="none" stroke="${cFaint}" stroke-width="1.5" />
    <path d="M 110 -30 L 90 -30 L 90 30 L 110 30" fill="none" stroke="${cFaint}" stroke-width="1.5" />
  `;
}

/**
 * 3. ENGLISH PRACTICE (English Faculty • Practice 26)
 * High-Precision Target / Bullseye + Crosshairs + Stopwatch + Checkmarks
 */
function getEnglishPracticeArtwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cSub = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(24,24,27,0.7)';
  const cFaint = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
  const cBg = isDark ? '#16161b' : '#f0f0f3';

  return `
    <!-- Outer Crosshair Axis -->
    <line x1="-110" y1="0" x2="110" y2="0" stroke="${cFaint}" stroke-width="1.5" stroke-dasharray="4 4" />
    <line x1="0" y1="-85" x2="0" y2="85" stroke="${cFaint}" stroke-width="1.5" stroke-dasharray="4 4" />

    <!-- Concentric Target Rings -->
    <circle cx="0" cy="0" r="75" fill="${cBg}" stroke="${cMain}" stroke-width="2" />
    <circle cx="0" cy="0" r="54" fill="none" stroke="${cSub}" stroke-width="1.5" />
    <circle cx="0" cy="0" r="34" fill="none" stroke="${cMain}" stroke-width="2" />
    <circle cx="0" cy="0" r="16" fill="${cMain}" />
    <circle cx="0" cy="0" r="5" fill="${isDark ? '#16161b' : '#ffffff'}" />

    <!-- Target Calibration Ticks -->
    <path d="M -75 -10 L -75 10 M 75 -10 L 75 10 M -10 -75 L 10 -75 M -10 75 L 10 75" stroke="${cMain}" stroke-width="2" />

    <!-- Arrow striking target dead center -->
    <g transform="translate(-50, -50) rotate(45)">
      <line x1="-40" y1="0" x2="20" y2="0" stroke="${cMain}" stroke-width="3" />
      <polygon points="20,-4 32,0 20,4" fill="${cMain}" />
      <!-- Feather Fletching -->
      <path d="M -30 -6 L -20 0 L -30 6 M -38 -6 L -28 0 L -38 6" stroke="${cSub}" stroke-width="2" fill="none" />
    </g>

    <!-- Speed Stopwatch Left Icon -->
    <g transform="translate(-160, 0)">
      <circle cx="0" cy="0" r="28" fill="${cBg}" stroke="${cSub}" stroke-width="1.8" />
      <rect x="-4" y="-34" width="8" height="6" rx="2" fill="${cSub}" />
      <line x1="0" y1="0" x2="10" y2="-10" stroke="${cMain}" stroke-width="2.2" stroke-linecap="round" />
      <circle cx="0" cy="0" r="3" fill="${cMain}" />
      <text x="0" y="40" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="9" font-weight="700" letter-spacing="1" fill="${cSub}">TIMER</text>
    </g>

    <!-- Checklist / PYQ Accuracy Right Icon -->
    <g transform="translate(160, 0)">
      <rect x="-24" y="-30" width="48" height="60" rx="6" fill="${cBg}" stroke="${cSub}" stroke-width="1.8" />
      <!-- Lines and Checkmarks -->
      <path d="M -14 -12 L -9 -7 L 0 -16" fill="none" stroke="${cMain}" stroke-width="2" />
      <line x1="6" y1="-10" x2="14" y2="-10" stroke="${cSub}" stroke-width="2" />
      
      <path d="M -14 6 L -9 11 L 0 2" fill="none" stroke="${cMain}" stroke-width="2" />
      <line x1="6" y1="8" x2="14" y2="8" stroke="${cSub}" stroke-width="2" />
      <text x="0" y="44" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="9" font-weight="700" letter-spacing="1" fill="${cSub}">MOCK 26</text>
    </g>
  `;
}

/**
 * 4. LOGICAL REASONING (Reasoning Faculty • SPL 60)
 * Isometric 3D Rubik / Puzzle Cube + Graph Network Nodes + Decision Trees
 */
function getLogicalReasoningArtwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cSub = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(24,24,27,0.7)';
  const cFaint = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
  const cFaceTop = isDark ? '#26262d' : '#e4e4e7';
  const cFaceLeft = isDark ? '#1c1c22' : '#d4d4d8';
  const cFaceRight = isDark ? '#141418' : '#c4c4c8';

  return `
    <!-- Neural / Graph Nodes in Background -->
    <g stroke="${cFaint}" stroke-width="1.5">
      <line x1="-160" y1="-50" x2="-80" y2="-20" />
      <line x1="-170" y1="20" x2="-80" y2="20" />
      <line x1="-150" y1="60" x2="-80" y2="20" />
      <line x1="160" y1="-50" x2="80" y2="-20" />
      <line x1="170" y1="20" x2="80" y2="20" />
      <line x1="150" y1="60" x2="80" y2="20" />
    </g>
    <!-- Graph Node Circles -->
    <g fill="${cSub}">
      <circle cx="-160" cy="-50" r="5" />
      <circle cx="-170" cy="20" r="6" />
      <circle cx="-150" cy="60" r="5" />
      <circle cx="160" cy="-50" r="5" />
      <circle cx="170" cy="20" r="6" />
      <circle cx="150" cy="60" r="5" />
    </g>

    <!-- Isometric 3D Logic Cube in Center -->
    <g transform="translate(0, -10)">
      <!-- Top Face -->
      <polygon points="0,-64 56,-32 0,0 -56,-32" fill="${cFaceTop}" stroke="${cMain}" stroke-width="2" />
      <line x1="0" y1="-64" x2="0" y2="0" stroke="${cSub}" stroke-width="1.2" stroke-dasharray="2 2" />
      <line x1="-56" y1="-32" x2="56" y2="-32" stroke="${cSub}" stroke-width="1.2" stroke-dasharray="2 2" />

      <!-- Left Face -->
      <polygon points="-56,-32 0,0 0,64 -56,32" fill="${cFaceLeft}" stroke="${cMain}" stroke-width="2" />
      <line x1="-28" y1="-16" x2="-28" y2="48" stroke="${cSub}" stroke-width="1.2" />
      <line x1="-56" y1="0" x2="0" y2="32" stroke="${cSub}" stroke-width="1.2" />

      <!-- Right Face -->
      <polygon points="0,0 56,-32 56,32 0,64" fill="${cFaceRight}" stroke="${cMain}" stroke-width="2" />
      <line x1="28" y1="-16" x2="28" y2="48" stroke="${cSub}" stroke-width="1.2" />
      <line x1="0" y1="32" x2="56" y2="0" stroke="${cSub}" stroke-width="1.2" />

      <!-- Central Hexagon Accent Ring -->
      <polygon points="0,-76 66,-38 66,38 0,76 -66,38 -66,-38" fill="none" stroke="${cFaint}" stroke-width="1.5" stroke-dasharray="6 3" />
    </g>

    <!-- Analytical Labels -->
    <text x="-160" y="86" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="700" letter-spacing="1" fill="${cSub}">VERBAL</text>
    <text x="160" y="86" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="700" letter-spacing="1" fill="${cSub}">NON-VERBAL</text>
  `;
}

/**
 * 5. MATHEMATICS B39 (Maths Faculty • Batch 39)
 * Dynamic Calculus Integral ∫ + Summation Σ + Root √ + Coordinate Graph + Pi π
 */
function getMathsB39Artwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cSub = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(24,24,27,0.7)';
  const cFaint = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
  const cBadgeBg = isDark ? '#16161b' : '#f0f0f3';

  return `
    <!-- Cartesian Coordinate Axes -->
    <line x1="-120" y1="30" x2="120" y2="30" stroke="${cFaint}" stroke-width="1.5" />
    <line x1="-20" y1="-75" x2="-20" y2="75" stroke="${cFaint}" stroke-width="1.5" />
    <polygon points="120,30 114,27 114,33" fill="${cFaint}" />
    <polygon points="-20,-75 -23,-69 -17,-69" fill="${cFaint}" />

    <!-- Parabolic Curve and Sine Function -->
    <path d="M -100 65 Q -20 -80 60 65" fill="none" stroke="${cSub}" stroke-width="2" stroke-dasharray="5 3" />
    <path d="M -80 30 Q -50 0 -20 30 T 40 30 T 100 30" fill="none" stroke="${cMain}" stroke-width="2.5" />

    <!-- Calculus Integral Symbol '∫' -->
    <g transform="translate(-150, -5)">
      <text x="0" y="25" text-anchor="middle" font-family="'Georgia', serif" font-size="76" font-style="italic" font-weight="400" fill="${cMain}">∫</text>
      <text x="14" y="-32" font-family="'Space Grotesk', sans-serif" font-size="11" font-weight="700" fill="${cSub}">b</text>
      <text x="14" y="32" font-family="'Space Grotesk', sans-serif" font-size="11" font-weight="700" fill="${cSub}">a</text>
    </g>

    <!-- Greek Summation Sigma 'Σ' and Pi 'π' Badge -->
    <g transform="translate(150, -5)">
      <rect x="-35" y="-45" width="70" height="90" rx="12" fill="${cBadgeBg}" stroke="${cMain}" stroke-width="2" />
      <text x="0" y="-8" text-anchor="middle" font-family="'Georgia', serif" font-size="34" font-weight="700" fill="${cMain}">∑</text>
      <line x1="-20" y1="5" x2="20" y2="5" stroke="${cFaint}" stroke-width="1" />
      <text x="0" y="30" text-anchor="middle" font-family="'Georgia', serif" font-size="24" font-style="italic" fill="${cSub}">π • dx</text>
    </g>

    <!-- Radical Square Root Formula Badge -->
    <g transform="translate(0, -55)">
      <rect x="-60" y="-15" width="120" height="30" rx="8" fill="${cBadgeBg}" stroke="${cFaint}" stroke-width="1.2" />
      <text x="0" y="5" text-anchor="middle" font-family="'Space Grotesk', monospace" font-size="13" font-weight="700" fill="${cMain}">√x² + y² = r²</text>
    </g>
  `;
}

/**
 * 6. MATHEMATICS SPL 38 (Maths Faculty • Special 38)
 * Linear Algebra Matrix Brackets + Drafting Compass + Euler & Trigonometry
 */
function getMathsSpl38Artwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cSub = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(24,24,27,0.7)';
  const cFaint = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
  const cBadgeBg = isDark ? '#16161b' : '#f0f0f3';

  return `
    <!-- Concentric Golden Ratio Compass Arc -->
    <path d="M -90 50 A 90 90 0 0 1 90 50" fill="none" stroke="${cFaint}" stroke-width="1.5" stroke-dasharray="4 4" />
    <path d="M -60 50 A 60 60 0 0 1 60 50" fill="none" stroke="${cSub}" stroke-width="1" />

    <!-- Linear Algebra Matrix in Center -->
    <g transform="translate(0, -5)">
      <!-- Left Bracket -->
      <path d="M -50 -45 L -65 -45 L -65 45 L -50 45" fill="none" stroke="${cMain}" stroke-width="3" stroke-linecap="round" />
      <!-- Right Bracket -->
      <path d="M 50 -45 L 65 -45 L 65 45 L 50 45" fill="none" stroke="${cMain}" stroke-width="3" stroke-linecap="round" />

      <!-- Matrix Elements -->
      <text x="-32" y="-12" text-anchor="middle" font-family="'Space Grotesk', serif" font-size="18" font-weight="700" fill="${cMain}">a₁₁</text>
      <text x="32" y="-12" text-anchor="middle" font-family="'Space Grotesk', serif" font-size="18" font-weight="700" fill="${cMain}">a₁₂</text>
      <text x="-32" y="24" text-anchor="middle" font-family="'Space Grotesk', serif" font-size="18" font-weight="700" fill="${cMain}">a₂₁</text>
      <text x="32" y="24" text-anchor="middle" font-family="'Space Grotesk', serif" font-size="18" font-weight="700" fill="${cMain}">a₂₂</text>
    </g>

    <!-- Drafting Compass Left Graphic -->
    <g transform="translate(-150, -5)">
      <!-- Compass Legs -->
      <circle cx="0" cy="-35" r="5" fill="${cMain}" />
      <path d="M 0 -35 L -20 35 M 0 -35 L 20 35" stroke="${cMain}" stroke-width="2.5" />
      <line x1="-12" y1="0" x2="12" y2="0" stroke="${cSub}" stroke-width="1.8" />
      <text x="0" y="52" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="700" fill="${cSub}">GEOMETRY</text>
    </g>

    <!-- Advanced Function Badge Right Graphic -->
    <g transform="translate(150, -5)">
      <rect x="-40" y="-38" width="80" height="76" rx="10" fill="${cBadgeBg}" stroke="${cMain}" stroke-width="2" />
      <text x="0" y="-10" text-anchor="middle" font-family="'Georgia', serif" font-size="20" font-weight="700" fill="${cMain}">e^{iπ} + 1</text>
      <text x="0" y="16" text-anchor="middle" font-family="'Georgia', serif" font-size="18" font-weight="700" fill="${cSub}"> = 0</text>
      <text x="0" y="52" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="700" fill="${cSub}">ADVANCED</text>
    </g>
  `;
}

/**
 * 7. PARMAR ACADEMY GK (Parmar Sir • 4.0 GK)
 * 3D Globe with Longitude/Latitude + Parliament / Capitol Pillar Silhouette + Ashoka Chakra Motif
 */
function getParmar4Artwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cSub = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(24,24,27,0.7)';
  const cFaint = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
  const cGlobeBg = isDark ? '#16161c' : '#f0f0f4';

  return `
    <!-- Outer Globe Circle -->
    <circle cx="0" cy="0" r="74" fill="${cGlobeBg}" stroke="${cMain}" stroke-width="2.5" />
    
    <!-- Longitude and Latitude Curved Grid -->
    <ellipse cx="0" cy="0" rx="74" ry="24" fill="none" stroke="${cFaint}" stroke-width="1.5" />
    <line x1="-74" y1="0" x2="74" y2="0" stroke="${cSub}" stroke-width="1.5" />
    <ellipse cx="0" cy="0" rx="34" ry="74" fill="none" stroke="${cFaint}" stroke-width="1.5" />
    <line x1="0" y1="-74" x2="0" y2="74" stroke="${cSub}" stroke-width="1.5" />

    <!-- Center Ashoka Chakra Motif -->
    <circle cx="0" cy="0" r="26" fill="${isDark ? '#0b0b0e' : '#ffffff'}" stroke="${cMain}" stroke-width="2" />
    <circle cx="0" cy="0" r="8" fill="${cMain}" />
    <g stroke="${cMain}" stroke-width="1.5">
      <line x1="-26" y1="0" x2="26" y2="0" />
      <line x1="0" y1="-26" x2="0" y2="26" />
      <line x1="-18" y1="-18" x2="18" y2="18" />
      <line x1="-18" y1="18" x2="18" y2="-18" />
    </g>

    <!-- Classical Parliament / Capitol Pillar Silhouette on Left -->
    <g transform="translate(-160, 0)">
      <polygon points="0,-36 30,-22 -30,-22" fill="${cMain}" />
      <rect x="-32" y="-22" width="64" height="4" fill="${cMain}" />
      <rect x="-26" y="-18" width="6" height="38" rx="1" fill="${cSub}" />
      <rect x="-10" y="-18" width="6" height="38" rx="1" fill="${cSub}" />
      <rect x="4" y="-18" width="6" height="38" rx="1" fill="${cSub}" />
      <rect x="20" y="-18" width="6" height="38" rx="1" fill="${cSub}" />
      <rect x="-34" y="20" width="68" height="6" rx="1" fill="${cMain}" />
      <text x="0" y="42" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="700" letter-spacing="1" fill="${cSub}">POLITY</text>
    </g>

    <!-- Historical Scroll and Quill on Right -->
    <g transform="translate(160, 0)">
      <rect x="-24" y="-30" width="48" height="56" rx="4" fill="${cGlobeBg}" stroke="${cMain}" stroke-width="2" />
      <path d="M -24 -24 C -16 -28 -8 -22 0 -24 C 8 -26 16 -22 24 -24" stroke="${cSub}" stroke-width="1.5" fill="none" />
      <line x1="-14" y1="-10" x2="14" y2="-10" stroke="${cSub}" stroke-width="2" />
      <line x1="-14" y1="0" x2="14" y2="0" stroke="${cSub}" stroke-width="2" />
      <line x1="-14" y1="10" x2="6" y2="10" stroke="${cSub}" stroke-width="2" />
      <text x="0" y="42" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="700" letter-spacing="1" fill="${cSub}">HISTORY</text>
    </g>
  `;
}

/**
 * 8. PARMAR GK 3.0 (Parmar Sir • Static GK)
 * Nautical 8-Point Compass Rose Star + Heritage Monument Arch + Atlas Coordinates
 */
function getParmar3Artwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cSub = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(24,24,27,0.7)';
  const cFaint = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
  const cBg = isDark ? '#16161c' : '#f0f0f4';

  return `
    <!-- Outer Azimuth Ring with Degree Ticks -->
    <circle cx="0" cy="0" r="76" fill="${cBg}" stroke="${cMain}" stroke-width="2" />
    <circle cx="0" cy="0" r="68" fill="none" stroke="${cFaint}" stroke-width="1.2" stroke-dasharray="2 4" />
    <circle cx="0" cy="0" r="54" fill="none" stroke="${cSub}" stroke-width="1" />

    <!-- 8-Point Compass Rose Star -->
    <polygon points="0,0 0,-68 12,-12" fill="${cMain}" />
    <polygon points="0,0 0,-68 -12,-12" fill="${cSub}" />
    <polygon points="0,0 0,68 -12,12" fill="${cMain}" />
    <polygon points="0,0 0,68 12,12" fill="${cSub}" />
    <polygon points="0,0 68,0 12,12" fill="${cMain}" />
    <polygon points="0,0 68,0 12,-12" fill="${cSub}" />
    <polygon points="0,0 -68,0 -12,-12" fill="${cMain}" />
    <polygon points="0,0 -68,0 -12,12" fill="${cSub}" />

    <polygon points="0,0 38,-38 0,-12" fill="${cSub}" />
    <polygon points="0,0 38,-38 12,0" fill="${cFaint}" />
    <polygon points="0,0 -38,-38 -12,0" fill="${cSub}" />
    <polygon points="0,0 -38,-38 0,-12" fill="${cFaint}" />
    <polygon points="0,0 38,38 12,0" fill="${cSub}" />
    <polygon points="0,0 38,38 0,12" fill="${cFaint}" />
    <polygon points="0,0 -38,38 0,12" fill="${cSub}" />
    <polygon points="0,0 -38,38 -12,0" fill="${cFaint}" />

    <!-- Center Pivot Pin -->
    <circle cx="0" cy="0" r="6" fill="${isDark ? '#0b0b0e' : '#ffffff'}" stroke="${cMain}" stroke-width="2" />
    <circle cx="0" cy="0" r="2.5" fill="${cMain}" />

    <!-- Heritage Arch / Landmark Monument on Left -->
    <g transform="translate(-160, 0)">
      <path d="M -24 30 L -24 -15 A 24 24 0 0 1 24 -15 L 24 30 Z" fill="${cBg}" stroke="${cMain}" stroke-width="2" />
      <path d="M -12 30 L -12 -5 A 12 12 0 0 1 12 -5 L 12 30 Z" fill="${isDark ? '#0b0b0e' : '#ffffff'}" stroke="${cSub}" stroke-width="1.5" />
      <line x1="-30" y1="30" x2="30" y2="30" stroke="${cMain}" stroke-width="3" />
      <text x="0" y="46" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="700" letter-spacing="1" fill="${cSub}">HERITAGE</text>
    </g>

    <!-- Geographic Coordinate Badge on Right -->
    <g transform="translate(160, 0)">
      <rect x="-42" y="-24" width="84" height="48" rx="8" fill="${cBg}" stroke="${cMain}" stroke-width="2" />
      <text x="0" y="-4" text-anchor="middle" font-family="'Space Grotesk', monospace" font-size="11" font-weight="700" fill="${cMain}">28°36' N</text>
      <text x="0" y="14" text-anchor="middle" font-family="'Space Grotesk', monospace" font-size="11" font-weight="700" fill="${cSub}">77°12' E</text>
      <text x="0" y="46" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="700" letter-spacing="1" fill="${cSub}">STATIC GK</text>
    </g>
  `;
}

/**
 * 9. SSC PRATHAM BATCH 2 (Multiple Teachers • Complete Foundation)
 * Heraldic Academy Shield with Laurel Wreaths + 4 Pillars (Maths, English, Reasoning, GS)
 */
function getSscPrathamArtwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cSub = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(24,24,27,0.7)';
  const cFaint = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
  const cShieldBg = isDark ? '#16161c' : '#f0f0f4';

  return `
    <!-- Symmetrical Flanking Laurel Wreaths -->
    <g stroke="${cSub}" stroke-width="2" fill="none">
      <path d="M -55 55 C -85 45 -100 15 -100 -20 C -100 -45 -80 -65 -60 -75" />
      <path d="M -65 48 C -75 48 -85 42 -88 35 C -82 35 -72 40 -65 48 Z" fill="${cSub}" />
      <path d="M -85 30 C -95 30 -105 22 -108 14 C -100 15 -90 22 -85 30 Z" fill="${cSub}" />
      <path d="M -98 5 C -108 5 -115 -5 -115 -15 C -107 -12 -100 -3 -98 5 Z" fill="${cSub}" />
      <path d="M -95 -25 C -105 -28 -110 -40 -106 -48 C -100 -42 -95 -32 -95 -25 Z" fill="${cSub}" />
      <path d="M -80 -55 C -88 -60 -90 -72 -84 -80 C -80 -72 -76 -62 -80 -55 Z" fill="${cSub}" />

      <path d="M 55 55 C 85 45 100 15 100 -20 C 100 -45 80 -65 60 -75" />
      <path d="M 65 48 C 75 48 85 42 88 35 C 82 35 72 40 65 48 Z" fill="${cSub}" />
      <path d="M 85 30 C 95 30 105 22 108 14 C 100 15 90 22 85 30 Z" fill="${cSub}" />
      <path d="M 98 5 C 108 5 115 -5 115 -15 C 107 -12 100 -3 98 5 Z" fill="${cSub}" />
      <path d="M 95 -25 C 105 -28 110 -40 106 -48 C 100 -42 95 -32 95 -25 Z" fill="${cSub}" />
      <path d="M 80 -55 C 88 -60 90 -72 84 -80 C 80 -72 76 -62 80 -55 Z" fill="${cSub}" />
    </g>

    <!-- Heraldic Academy Shield -->
    <path d="M 0 -68 L 54 -48 C 54 10 36 50 0 76 C -36 50 -54 10 -54 -48 Z" fill="${cShieldBg}" stroke="${cMain}" stroke-width="2.5" />
    <path d="M 0 -58 L 44 -42 C 44 6 28 40 0 62 C -28 40 -44 6 -44 -42 Z" fill="none" stroke="${cFaint}" stroke-width="1.2" />

    <!-- 4 Quadrant Divider Lines -->
    <line x1="0" y1="-58" x2="0" y2="62" stroke="${cSub}" stroke-width="1.5" />
    <line x1="-44" y1="-5" x2="44" y2="-5" stroke="${cSub}" stroke-width="1.5" />

    <!-- Quadrant 1: Maths '±' -->
    <text x="-22" y="-22" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="16" font-weight="800" fill="${cMain}">±</text>
    <!-- Quadrant 2: English 'A' -->
    <text x="22" y="-22" text-anchor="middle" font-family="'Georgia', serif" font-size="16" font-weight="700" fill="${cMain}">A</text>
    <!-- Quadrant 3: Reasoning '⬡' -->
    <text x="-22" y="24" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="15" font-weight="800" fill="${cMain}">⬡</text>
    <!-- Quadrant 4: GS Star '★' -->
    <text x="22" y="24" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="16" font-weight="800" fill="${cMain}">★</text>

    <!-- Foundation Ribbon Banner below Shield -->
    <g transform="translate(0, 84)">
      <rect x="-90" y="-12" width="180" height="24" rx="12" fill="${cMain}" />
      <text x="0" y="4" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="10" font-weight="800" letter-spacing="2" fill="${isDark ? '#0b0b0e' : '#ffffff'}">FOUNDATION 2.0</text>
    </g>
  `;
}

/**
 * 10. BEU B.TECH 1ST YEAR (Bihar Engineering University • 7 Core Branches)
 * Interlocking Engineering Gears + PCB Traces + Drafting Protractor + Structural Truss
 */
function getBeuArtwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cSub = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(24,24,27,0.7)';
  const cFaint = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
  const cGearBg = isDark ? '#181820' : '#e4e4e8';

  return `
    <!-- Structural Bridge Truss Beam (Background) -->
    <g stroke="${cFaint}" stroke-width="1.5" fill="none">
      <line x1="-180" y1="50" x2="180" y2="50" stroke-width="2" />
      <line x1="-180" y1="20" x2="180" y2="20" stroke-width="2" />
      <path d="M -180 50 L -150 20 L -120 50 L -90 20 L -60 50 M 60 50 L 90 20 L 120 50 L 150 20 L 180 50" />
    </g>

    <!-- Primary Engineering Spur Gear (Center Left) -->
    <g transform="translate(-20, -10)">
      <circle cx="0" cy="0" r="54" fill="${cGearBg}" stroke="${cMain}" stroke-width="2" />
      <g fill="${cMain}">
        <rect x="-8" y="-62" width="16" height="12" rx="2" />
        <rect x="-8" y="50" width="16" height="12" rx="2" />
        <rect x="-62" y="-8" width="12" height="16" rx="2" />
        <rect x="50" y="-8" width="12" height="16" rx="2" />
        <rect x="-44" y="-44" width="14" height="14" rx="2" transform="rotate(45 -37 -37)" />
        <rect x="30" y="-44" width="14" height="14" rx="2" transform="rotate(-45 37 -37)" />
        <rect x="-44" y="30" width="14" height="14" rx="2" transform="rotate(-45 -37 37)" />
        <rect x="30" y="30" width="14" height="14" rx="2" transform="rotate(45 37 37)" />
      </g>
      <circle cx="0" cy="0" r="28" fill="${isDark ? '#0b0b0e' : '#fafafa'}" stroke="${cMain}" stroke-width="2" />
      <rect x="-4" y="-32" width="8" height="8" fill="${cMain}" />
      <circle cx="0" cy="0" r="10" fill="${cMain}" />
    </g>

    <!-- Secondary Intermeshed Gear (Upper Right) -->
    <g transform="translate(62, -48)">
      <circle cx="0" cy="0" r="32" fill="${cGearBg}" stroke="${cSub}" stroke-width="1.8" />
      <g fill="${cSub}">
        <rect x="-5" y="-38" width="10" height="8" rx="1.5" />
        <rect x="-5" y="30" width="10" height="8" rx="1.5" />
        <rect x="-38" y="-5" width="8" height="10" rx="1.5" />
        <rect x="30" y="-5" width="8" height="10" rx="1.5" />
      </g>
      <circle cx="0" cy="0" r="14" fill="${isDark ? '#0b0b0e' : '#fafafa'}" stroke="${cSub}" stroke-width="1.5" />
      <circle cx="0" cy="0" r="4" fill="${cSub}" />
    </g>

    <!-- Drafting Caliper / Ruler Icon Left -->
    <g transform="translate(-150, -15)">
      <rect x="-35" y="-25" width="70" height="50" rx="8" fill="${cGearBg}" stroke="${cMain}" stroke-width="1.8" />
      <line x1="-25" y1="-15" x2="-25" y2="0" stroke="${cMain}" stroke-width="2" />
      <line x1="-15" y1="-15" x2="-15" y2="-5" stroke="${cSub}" stroke-width="1.5" />
      <line x1="-5" y1="-15" x2="-5" y2="0" stroke="${cMain}" stroke-width="2" />
      <line x1="5" y1="-15" x2="5" y2="-5" stroke="${cSub}" stroke-width="1.5" />
      <line x1="15" y1="-15" x2="15" y2="0" stroke="${cMain}" stroke-width="2" />
      <line x1="25" y1="-15" x2="25" y2="-5" stroke="${cSub}" stroke-width="1.5" />
      <text x="0" y="16" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="9" font-weight="700" fill="${cSub}">CORE ENGG</text>
    </g>

    <!-- University Academic Crest Right -->
    <g transform="translate(150, -15)">
      <circle cx="0" cy="0" r="28" fill="${cGearBg}" stroke="${cMain}" stroke-width="1.8" />
      <polygon points="0,-18 16,-6 0,6 -16,-6" fill="${cMain}" />
      <path d="M -12 -3 L -12 12 C -12 18 12 18 12 12 L 12 -3" fill="none" stroke="${cMain}" stroke-width="2" />
      <text x="0" y="38" text-anchor="middle" font-family="'Space Grotesk', sans-serif" font-size="9" font-weight="700" letter-spacing="1" fill="${cSub}">7 BRANCHES</text>
    </g>
  `;
}

/**
 * 11. DEFAULT STUDY COURSE (Monochrome Clean Fallback)
 */
function getDefaultCourseArtwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cSub = isDark ? 'rgba(255,255,255,0.7)' : 'rgba(24,24,27,0.7)';
  const cFaint = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(24,24,27,0.2)';
  const cBg = isDark ? '#16161c' : '#f0f0f4';

  return `
    <circle cx="0" cy="0" r="74" fill="${cBg}" stroke="${cMain}" stroke-width="2" />
    <circle cx="0" cy="0" r="62" fill="none" stroke="${cFaint}" stroke-width="1.5" stroke-dasharray="4 4" />
    
    <g transform="translate(0, -10)">
      <path d="M 0 10 C -15 -5 -35 -5 -46 5 L -46 -25 C -35 -35 -15 -35 0 -20 C 15 -35 35 -35 46 -25 L 46 5 C 35 -5 15 -5 0 10 Z" fill="${isDark ? '#0b0b0e' : '#ffffff'}" stroke="${cMain}" stroke-width="2" />
      <line x1="0" y1="-20" x2="0" y2="10" stroke="${cSub}" stroke-width="2" />
      <line x1="-36" y1="-18" x2="-12" y2="-15" stroke="${cSub}" stroke-width="1.5" />
      <line x1="-36" y1="-10" x2="-12" y2="-7" stroke="${cSub}" stroke-width="1.5" />
      <line x1="12" y1="-15" x2="36" y2="-18" stroke="${cSub}" stroke-width="1.5" />
      <line x1="12" y1="-7" x2="36" y2="-10" stroke="${cSub}" stroke-width="1.5" />
    </g>

    <polygon points="0,20 4,30 14,30 6,36 10,46 0,40 -10,46 -6,36 -14,30 -4,30" fill="${cMain}" />
  `;
}

/**
 * 12. DEFAULT LECTURE (Monochrome Clean Fallback)
 */
function getDefaultLectureArtwork(theme) {
  const isDark = theme === 'dark';
  const cMain = isDark ? '#ffffff' : '#18181b';
  const cBg = isDark ? '#16161c' : '#f0f0f4';

  return `
    <circle cx="0" cy="0" r="70" fill="${cBg}" stroke="${cMain}" stroke-width="2" />
    <polygon points="-12,-24 24,0 -12,24" fill="${cMain}" />
  `;
}

// ── COURSE CONFIGURATIONS ──
const COURSES = [
  {
    key: 'computer_awareness',
    eyebrow: 'Computer Awareness &amp; IT',
    title: 'COMPUTER SPECIAL',
    subtitle: 'SPL 29 • YATENDRA SIR',
    getArtwork: getComputerArtwork,
  },
  {
    key: 'english_grammar',
    eyebrow: 'English Faculty • Foundation',
    title: 'ENGLISH GRAMMAR',
    subtitle: 'ENGLISH SPL-26 • RULES &amp; VOCAB',
    getArtwork: getEnglishGrammarArtwork,
  },
  {
    key: 'english_practice',
    eyebrow: 'English Faculty • Practice Drill',
    title: 'ENGLISH PRACTICE',
    subtitle: 'PRACTICE 26 • MOCK &amp; PYQ DRILL',
    getArtwork: getEnglishPracticeArtwork,
  },
  {
    key: 'logical_reasoning',
    eyebrow: 'Reasoning Faculty • SPL 60',
    title: 'LOGICAL REASONING',
    subtitle: 'REASONING SPL 60 • VERBAL &amp; NON-VERBAL',
    getArtwork: getLogicalReasoningArtwork,
  },
  {
    key: 'maths_b39',
    eyebrow: 'Maths Faculty • Complete Batch',
    title: 'MATHEMATICS B39',
    subtitle: 'BATCH 39 • ARITHMETIC &amp; ADVANCED',
    getArtwork: getMathsB39Artwork,
  },
  {
    key: 'maths_spl38',
    eyebrow: 'Maths Faculty • Special 38',
    title: 'MATHEMATICS SPL 38',
    subtitle: 'SPECIAL 38 • FOUNDATION TO ADVANCED',
    getArtwork: getMathsSpl38Artwork,
  },
  {
    key: 'parmar_gk_4_0',
    eyebrow: 'Parmar Sir • Complete GS 4.0',
    title: 'PARMAR ACADEMY GK',
    subtitle: 'PARMAR 4.0 GK • GENERAL AWARENESS &amp; GS',
    getArtwork: getParmar4Artwork,
  },
  {
    key: 'parmar_gk_3_0',
    eyebrow: 'Parmar Sir • Complete Batch',
    title: 'PARMAR GK 3.0',
    subtitle: 'COMPLETE GENERAL KNOWLEDGE &amp; STATIC GK',
    getArtwork: getParmar3Artwork,
  },
  {
    key: 'ssc_pratham_batch_2',
    eyebrow: 'Multiple Teachers • SSC CGL/CHSL',
    title: 'SSC PRATHAM BATCH 2',
    subtitle: 'COMPLETE FOUNDATION (MATHS, ENGLISH, REASONING, GS)',
    getArtwork: getSscPrathamArtwork,
  },
  {
    key: 'beu_1st_year',
    eyebrow: 'Bihar Engineering University',
    title: 'BEU B.TECH 1ST YEAR',
    subtitle: 'BIHAR ENGINEERING UNIVERSITY • 7 CORE BRANCHES',
    getArtwork: getBeuArtwork,
  },
];

console.log('Generating custom Black & White thumbnails with strict XML escaping...');

// Helper to validate XML well-formedness
function validateXml(svgString, fileName) {
  // Simple XML check using regex or simple balance
  const unescapedAmp = /&(?!amp;|lt;|gt;|quot;|apos;)/.test(svgString);
  if (unescapedAmp) {
    throw new Error(`Invalid XML in ${fileName}: contains unescaped '&'`);
  }
}

// 1. Generate Course Thumbnails (Dark, Light, and Default/Canonical)
for (const course of COURSES) {
  const darkSvg = createBwSvg({
    theme: 'dark',
    eyebrow: course.eyebrow,
    title: course.title,
    subtitle: course.subtitle,
    artwork: course.getArtwork('dark'),
  });

  const lightSvg = createBwSvg({
    theme: 'light',
    eyebrow: course.eyebrow,
    title: course.title,
    subtitle: course.subtitle,
    artwork: course.getArtwork('light'),
  });

  validateXml(darkSvg, `${course.key}_dark.svg`);
  validateXml(lightSvg, `${course.key}_light.svg`);

  fs.writeFileSync(path.join(SUBJECTS_DIR, `${course.key}_dark.svg`), darkSvg, 'utf-8');
  fs.writeFileSync(path.join(SUBJECTS_DIR, `${course.key}_light.svg`), lightSvg, 'utf-8');
  fs.writeFileSync(path.join(SUBJECTS_DIR, `${course.key}.svg`), darkSvg, 'utf-8');

  console.log(`✓ Generated and validated ${course.key} (dark, light, default)`);
}

// 2. Generate Default Course Fallbacks
const defaultDark = createBwSvg({
  theme: 'dark',
  eyebrow: 'Stutosed Learning Portal',
  title: 'STUDY COURSE',
  subtitle: 'VERIFIED ACADEMIC RESOURCE',
  artwork: getDefaultCourseArtwork('dark'),
});
const defaultLight = createBwSvg({
  theme: 'light',
  eyebrow: 'Stutosed Learning Portal',
  title: 'STUDY COURSE',
  subtitle: 'VERIFIED ACADEMIC RESOURCE',
  artwork: getDefaultCourseArtwork('light'),
});

validateXml(defaultDark, 'default_course_dark.svg');
validateXml(defaultLight, 'default_course_light.svg');

fs.writeFileSync(path.join(THUMBNAILS_DIR, 'default_course_dark.svg'), defaultDark, 'utf-8');
fs.writeFileSync(path.join(THUMBNAILS_DIR, 'default_course_light.svg'), defaultLight, 'utf-8');
fs.writeFileSync(path.join(THUMBNAILS_DIR, 'default_course.svg'), defaultDark, 'utf-8');
console.log('✓ Generated default_course SVGs');

// 3. Generate Default Lecture Fallbacks
const lectureDark = createBwSvg({
  theme: 'dark',
  eyebrow: 'Stutosed Video Lecture',
  title: 'STUDY LECTURE',
  subtitle: 'CURATED VIDEO SESSION',
  artwork: getDefaultLectureArtwork('dark'),
});
const lectureLight = createBwSvg({
  theme: 'light',
  eyebrow: 'Stutosed Video Lecture',
  title: 'STUDY LECTURE',
  subtitle: 'CURATED VIDEO SESSION',
  artwork: getDefaultLectureArtwork('light'),
});

validateXml(lectureDark, 'default_lecture_dark.svg');
validateXml(lectureLight, 'default_lecture_light.svg');

fs.writeFileSync(path.join(THUMBNAILS_DIR, 'default_lecture_dark.svg'), lectureDark, 'utf-8');
fs.writeFileSync(path.join(THUMBNAILS_DIR, 'default_lecture_light.svg'), lectureLight, 'utf-8');
console.log('✓ Generated default_lecture SVGs');

console.log('All Black & White SVG thumbnails generated and validated successfully!');
