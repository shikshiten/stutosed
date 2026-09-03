/**
 * Stutosed Centralized Subject Thumbnail Architecture
 * Maps academic and competitive exam subjects to their exact, unified, high-aesthetic Mithila-infused thumbnails.
 *
 * PROTECTED CATEGORIES (NEVER OVERRIDDEN WHEN RENDERING BATCH/COURSE CARDS):
 * - EE / ECE / EEE -> /thumbnails/beu_ece_ee_eee.jpg
 * - Mechanical Engineering (UMEED) -> /thumbnails/beu_mech_umeed.jpg
 * - Civil Engineering (UMEED) -> /thumbnails/beu_civil_umeed.jpg
 * - CSE (UMEED) -> /thumbnails/beu_cse_umeed.jpg
 * - Parmar GK 3.0 -> /thumbnails/parmar_gk_3.jpg
 * - Parmar Academy GK -> /thumbnails/parmar_gk_3.jpg
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

// 24 Unified Subject Keys
export const SUBJECT_KEYS = {
  // ── ENGINEERING (13) ──
  ENGINEERING_PHYSICS: 'engineering_physics',
  ENGINEERING_CHEMISTRY: 'engineering_chemistry',
  ENGINEERING_MATHEMATICS_2: 'engineering_mathematics_2',
  COMMUNICATIVE_ENGLISH: 'communicative_english',
  ENGINEERING_GRAPHICS_DESIGN: 'engineering_graphics_design',
  ELEMENTS_OF_MECHANICAL_ENGINEERING: 'elements_of_mechanical_engineering',
  WORKSHOP_MANUFACTURING: 'workshop_manufacturing',
  PROGRAMMING_FOR_PROBLEM_SOLVING: 'programming_for_problem_solving',
  CIVIL_ENGINEERING_CORE: 'civil_engineering_core',
  BASIC_ELECTRICAL_WORKSHOP: 'basic_electrical_workshop',
  ENGINEERING_MATHEMATICS: 'engineering_mathematics',
  COMPUTER_SCIENCE_CORE: 'computer_science_core',
  ENGLISH_COMMUNICATION_SKILLS: 'english_communication_skills',

  // ── GK / COMPETITIVE EXAMS (11) ──
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

/**
 * Normalizes subject string and resolves the exact canonical thumbnail asset.
 * Always prioritizes specific subject names (inside batches & lectures),
 * and uses protected batch covers when rendering the batch/course cards themselves.
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

  // If only tab/batch is being checked (no subject given, e.g. folder cover):
  if (!subjectName && tabIdOrName) {
    const rawId = tabIdOrName.toLowerCase().trim();
    if (PROTECTED_THUMBNAILS[rawId]) return PROTECTED_THUMBNAILS[rawId];
    if (rawId.includes('parmar')) return '/thumbnails/parmar_gk_3.jpg';
    if (rawId === 'ee / ece / eee' || rawId.includes('ece-ee-eee')) return '/thumbnails/beu_ece_ee_eee.jpg';
    if (rawId === 'mechanical engineering (umeed)' || rawId === 'mechanical-umeed') return '/thumbnails/beu_mech_umeed.jpg';
    if (rawId === 'civil engineering (umeed)' || rawId === 'civil-umeed') return '/thumbnails/beu_civil_umeed.jpg';
    if (rawId === 'cse (umeed)' || rawId === 'cse-umeed') return '/thumbnails/beu_cse_umeed.jpg';
  }

  // ── 1. MATCH SPECIFIC ENGINEERING & COMPETITIVE SUBJECTS ──
  if (text) {
    if (text.includes('graphics') || text.includes('engineering graphics') || text.includes('drawing')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_GRAPHICS_DESIGN, theme);
    }
    if (text.includes('elements of mechanical') || text.includes('mechanical engg') || text.includes('mechanics')) {
      return resolveSvgPath(SUBJECT_KEYS.ELEMENTS_OF_MECHANICAL_ENGINEERING, theme);
    }
    if (text.includes('workshop & manufacturing') || text.includes('workshop and manufacturing') || text.includes('manufacturing') || text.includes('workshop')) {
      return resolveSvgPath(SUBJECT_KEYS.WORKSHOP_MANUFACTURING, theme);
    }
    if (text.includes('programming for problem solving') || text.includes('problem solving') || text.includes('pps') || text.includes('reasoning') || text.includes('logical')) {
      return resolveSvgPath(SUBJECT_KEYS.PROGRAMMING_FOR_PROBLEM_SOLVING, theme);
    }
    if (text.includes('civil engineering core') || text.includes('civil core') || text.includes('civil engineering') || text.includes('civil')) {
      return resolveSvgPath(SUBJECT_KEYS.CIVIL_ENGINEERING_CORE, theme);
    }
    if (text.includes('basic electrical & workshop') || text.includes('basic electrical and workshop') || text.includes('basic electrical') || text.includes('electrical')) {
      return resolveSvgPath(SUBJECT_KEYS.BASIC_ELECTRICAL_WORKSHOP, theme);
    }
    if (text.includes('computer science core') || text.includes('cse core') || text.includes('computer science') || text.includes('computer')) {
      return resolveSvgPath(SUBJECT_KEYS.COMPUTER_SCIENCE_CORE, theme);
    }
    if (text.includes('communicative english')) {
      return resolveSvgPath(SUBJECT_KEYS.COMMUNICATIVE_ENGLISH, theme);
    }
    if (text.includes('communication skills') || text.includes('english & communication') || text.includes('english and communication') || text.includes('english') || text.includes('grammar') || text.includes('vocab') || text.includes('comprehension')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGLISH_COMMUNICATION_SKILLS, theme);
    }
    if (text.includes('mathematics-ii') || text.includes('mathematics 2') || text.includes('maths-ii') || text.includes('maths 2') || text.includes('math-ii') || text.includes('math 2') || text.includes('differential equations') || text.includes('fourier') || text.includes('numerical methods') || text.includes('complex numbers')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_MATHEMATICS_2, theme);
    }
    if (text.includes('engineering mathematics') || text.includes('engineering maths') || text.includes('math') || text.includes('number system') || text.includes('arithmetic') || text.includes('algebra') || text.includes('geometry') || text.includes('trigonometry') || text.includes('percentage')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_MATHEMATICS, theme);
    }
    if (text.includes('chemistry')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_CHEMISTRY, theme);
    }
    if (text.includes('physics')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_PHYSICS, theme);
    }

    // ── 2. MATCH SPECIFIC GK / COMPETITIVE EXAMS SUBJECTS ──
    if (text.includes('environment') || text.includes('enviroment') || text.includes('ecology')) {
      return resolveSvgPath(SUBJECT_KEYS.ENVIRONMENT_ECOLOGY, theme);
    }
    if (text.includes('ancient history') || text.includes('ancient')) {
      return resolveSvgPath(SUBJECT_KEYS.ANCIENT_HISTORY, theme);
    }
    if (text.includes('medieval history') || text.includes('medieval')) {
      return resolveSvgPath(SUBJECT_KEYS.MEDIEVAL_HISTORY, theme);
    }
    if (text.includes('modern history') || text.includes('modern') || text.includes('history')) {
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
    if (text.includes('biology')) {
      return resolveSvgPath(SUBJECT_KEYS.BIOLOGY, theme);
    }
    if (text.includes('static gk') || text.includes('static g.k') || text.includes('static') || text.includes('gk') || text.includes('gs') || text.includes('general awareness') || text.includes('general knowledge')) {
      return resolveSvgPath(SUBJECT_KEYS.STATIC_GK, theme);
    }
  }

  // ── 3. IF NO SUBJECT MATCH, CHECK PROTECTED BATCHES / TAB CARDS ──
  if (tabIdOrName) {
    const rawId = tabIdOrName.toLowerCase().trim();
    if (PROTECTED_THUMBNAILS[rawId]) return PROTECTED_THUMBNAILS[rawId];
    if (rawId.includes('parmar')) return '/thumbnails/parmar_gk_3.jpg';
    if (rawId === 'ee / ece / eee' || rawId.includes('ece-ee-eee')) return '/thumbnails/beu_ece_ee_eee.jpg';
    if (rawId === 'mechanical engineering (umeed)' || rawId === 'mechanical-umeed') return '/thumbnails/beu_mech_umeed.jpg';
    if (rawId === 'civil engineering (umeed)' || rawId === 'civil-umeed') return '/thumbnails/beu_civil_umeed.jpg';
    if (rawId === 'cse (umeed)' || rawId === 'cse-umeed') return '/thumbnails/beu_cse_umeed.jpg';
  }

  // If fallbackThumb is an SVG, resolve with current theme if applicable
  if (fallbackThumb && fallbackThumb.endsWith('.svg')) {
    if (theme && !fallbackThumb.includes('_light.svg') && !fallbackThumb.includes('_dark.svg')) {
      const themed = fallbackThumb.replace('.svg', `_${theme}.svg`);
      return themed;
    }
    return fallbackThumb;
  }

  return fallbackThumb || '/thumbnails/all_lecture_thumbnail.jpg';
}
