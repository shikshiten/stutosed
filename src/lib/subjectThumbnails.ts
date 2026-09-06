/**
 * Stutosed Centralized Subject Thumbnail Architecture
 * Resolves high-aesthetic vector SVGs for all academic subjects and batches.
 * Automatically falls back to dynamic Mithila SVG thumbnails for custom topics.
 */

export const PROTECTED_THUMBNAILS: Record<string, string> = {
  'ee-ece-eee': '/thumbnails/beu_ece_ee_eee.jpg',
  'ece-ee-eee': '/thumbnails/beu_ece_ee_eee.jpg',
  'mechanical-umeed': '/thumbnails/beu_mech_umeed.jpg',
  'civil-umeed': '/thumbnails/beu_civil_umeed.jpg',
  'cse-umeed': '/thumbnails/beu_cse_umeed.jpg',
  'parmar-gk-3-0': '/thumbnails/parmar_gk_3.jpg',
  'parmar': '/thumbnails/parmar_gk_3.jpg',
};

export const SUBJECT_KEYS = {
  // ── ENGINEERING CORE ──
  ENGINEERING_GRAPHICS_DESIGN: 'engineering_graphics_design',
  ELEMENTS_OF_MECHANICAL_ENGINEERING: 'elements_of_mechanical_engineering',
  ENGINEERING_CHEMISTRY: 'engineering_chemistry',
  ENGINEERING_PHYSICS: 'engineering_physics',
  ENGINEERING_MATHEMATICS_2: 'engineering_mathematics_2',
  WORKSHOP_MANUFACTURING: 'workshop_manufacturing',
  PROGRAMMING_FOR_PROBLEM_SOLVING: 'programming_for_problem_solving',
  CIVIL_ENGINEERING_CORE: 'civil_engineering_core',
  BASIC_ELECTRICAL_WORKSHOP: 'basic_electrical_workshop',
  ENGINEERING_MATHEMATICS: 'engineering_mathematics',
  COMPUTER_SCIENCE_CORE: 'computer_science_core',
  ENGLISH_COMMUNICATION_SKILLS: 'english_communication_skills',
  COMMUNICATIVE_ENGLISH: 'communicative_english',

  // ── GK / COMPETITIVE EXAMS ──
  BIOLOGY: 'biology',
  ECONOMICS: 'economics',
  STATIC_GK: 'static_gk',
  CHEMISTRY: 'chemistry',
  PHYSICS: 'physics',
  POLITY: 'polity',
  ANCIENT_HISTORY: 'ancient_history',
  MEDIEVAL_HISTORY: 'medieval_history',
  MODERN_HISTORY: 'modern_history',
  GEOGRAPHY: 'geography',
  ENVIRONMENT_ECOLOGY: 'environment_ecology',
} as const;

function resolveSvgPath(key: string, theme?: 'light' | 'dark'): string {
  const mode = theme === 'dark' ? 'dark' : 'light';
  return `/thumbnails/subjects/${key}_${mode}.svg`;
}

export function getDynamicThumbnailUrl(
  title?: string | null,
  category?: string | null,
  theme?: 'light' | 'dark'
): string {
  const cleanTitle = (title || 'Study Lecture').trim();
  const cleanCategory = (category || '').trim();
  const mode = theme === 'dark' ? 'dark' : 'light';
  return `/api/thumbnail?title=${encodeURIComponent(cleanTitle)}&category=${encodeURIComponent(cleanCategory)}&theme=${mode}`;
}

/**
 * Normalizes subject string and resolves the exact canonical thumbnail asset.
 * Always prioritizes handcrafted vector SVGs matching the subject,
 * then checks if fallback is an SVG, and finally falls back to dynamic Mithila generator.
 */
export function getSubjectThumbnail(
  subjectName?: string | null,
  fallbackThumb?: string | null,
  tabIdOrName?: string | null,
  theme?: 'light' | 'dark'
): string {
  const s = (subjectName || '').toLowerCase().trim();
  const t = (tabIdOrName || '').toLowerCase().trim();
  const text = `${s} ${t}`.trim();

  // 1. If explicit SVG fallback provided, theme it appropriately
  if (fallbackThumb && fallbackThumb.endsWith('.svg')) {
    if (theme && !fallbackThumb.includes('_light.svg') && !fallbackThumb.includes('_dark.svg')) {
      return fallbackThumb.replace('.svg', `_${theme}.svg`);
    }
    return fallbackThumb;
  }

  // 2. Check protected batch thumbnails (if no explicit subject match needed)
  if (!subjectName && tabIdOrName) {
    const rawId = tabIdOrName.toLowerCase().trim();
    if (PROTECTED_THUMBNAILS[rawId]) return PROTECTED_THUMBNAILS[rawId];
  }

  // 3. Match Specific Subject Names to Handcrafted Vector SVGs
  if (text) {
    if (text.includes('graphics') || text.includes('drawing')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_GRAPHICS_DESIGN, theme);
    }
    if (text.includes('elements of mechanical') || text.includes('mechanical engg') || text.includes('mechanics')) {
      return resolveSvgPath(SUBJECT_KEYS.ELEMENTS_OF_MECHANICAL_ENGINEERING, theme);
    }
    if (text.includes('workshop') || text.includes('manufacturing')) {
      return resolveSvgPath(SUBJECT_KEYS.WORKSHOP_MANUFACTURING, theme);
    }
    if (text.includes('programming') || text.includes('pps') || text.includes('reasoning') || text.includes('logical')) {
      return resolveSvgPath(SUBJECT_KEYS.PROGRAMMING_FOR_PROBLEM_SOLVING, theme);
    }
    if (text.includes('civil')) {
      return resolveSvgPath(SUBJECT_KEYS.CIVIL_ENGINEERING_CORE, theme);
    }
    if (text.includes('electrical') || text.includes('electronics') || text.includes('eee') || text.includes('ece')) {
      return resolveSvgPath(SUBJECT_KEYS.BASIC_ELECTRICAL_WORKSHOP, theme);
    }
    if (text.includes('computer') || text.includes('cse') || text.includes('software')) {
      return resolveSvgPath(SUBJECT_KEYS.COMPUTER_SCIENCE_CORE, theme);
    }
    if (text.includes('communicative english') || text.includes('practice 26') || text.includes('english practice')) {
      return resolveSvgPath(SUBJECT_KEYS.COMMUNICATIVE_ENGLISH, theme);
    }
    if (text.includes('english') || text.includes('communication') || text.includes('grammar') || text.includes('vocab')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGLISH_COMMUNICATION_SKILLS, theme);
    }
    if (text.includes('mathematics-ii') || text.includes('mathematics 2') || text.includes('maths-ii') || text.includes('maths 2') || text.includes('special 38') || text.includes('spl 38') || text.includes('spl38')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_MATHEMATICS_2, theme);
    }
    if (text.includes('math') || text.includes('arithmetic') || text.includes('algebra') || text.includes('geometry') || text.includes('trigonometry') || text.includes('quant')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_MATHEMATICS, theme);
    }
    if (text.includes('chemistry')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_CHEMISTRY, theme);
    }
    if (text.includes('physics')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_PHYSICS, theme);
    }
    if (text.includes('environment') || text.includes('ecology')) {
      return resolveSvgPath(SUBJECT_KEYS.ENVIRONMENT_ECOLOGY, theme);
    }
    if (text.includes('ancient')) {
      return resolveSvgPath(SUBJECT_KEYS.ANCIENT_HISTORY, theme);
    }
    if (text.includes('medieval')) {
      return resolveSvgPath(SUBJECT_KEYS.MEDIEVAL_HISTORY, theme);
    }
    if (text.includes('modern')) {
      return resolveSvgPath(SUBJECT_KEYS.MODERN_HISTORY, theme);
    }
    if (text.includes('history')) {
      return resolveSvgPath(SUBJECT_KEYS.MODERN_HISTORY, theme);
    }
    if (text.includes('polity') || text.includes('constitution')) {
      return resolveSvgPath(SUBJECT_KEYS.POLITY, theme);
    }
    if (text.includes('geography')) {
      return resolveSvgPath(SUBJECT_KEYS.GEOGRAPHY, theme);
    }
    if (text.includes('economics') || text.includes('economy')) {
      return resolveSvgPath(SUBJECT_KEYS.ECONOMICS, theme);
    }
    if (text.includes('biology') || text.includes('botany') || text.includes('zoology')) {
      return resolveSvgPath(SUBJECT_KEYS.BIOLOGY, theme);
    }
    if (text.includes('static') || text.includes('gk') || text.includes('gs') || text.includes('pratham') || text.includes('general awareness') || text.includes('general knowledge')) {
      return resolveSvgPath(SUBJECT_KEYS.STATIC_GK, theme);
    }
  }

  // 4. Dynamic Title-based Mithila SVG fallback
  const cleanTitle = (subjectName || tabIdOrName || '').trim();
  if (cleanTitle) {
    return getDynamicThumbnailUrl(cleanTitle, text, theme);
  }

  return fallbackThumb || '/thumbnails/all_lecture_thumbnail.jpg';
}
