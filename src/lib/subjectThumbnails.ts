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

  // ── 1. MATCH SPECIFIC ENGINEERING SUBJECTS FIRST ──
  if (s) {
    if (s.includes('graphics') || s.includes('engineering graphics')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_GRAPHICS_DESIGN, theme);
    }
    if (s.includes('elements of mechanical') || s.includes('mechanical engg')) {
      return resolveSvgPath(SUBJECT_KEYS.ELEMENTS_OF_MECHANICAL_ENGINEERING, theme);
    }
    if (s.includes('workshop & manufacturing') || s.includes('workshop and manufacturing') || s.includes('manufacturing')) {
      return resolveSvgPath(SUBJECT_KEYS.WORKSHOP_MANUFACTURING, theme);
    }
    if (s.includes('programming for problem solving') || s.includes('problem solving') || s.includes('pps')) {
      return resolveSvgPath(SUBJECT_KEYS.PROGRAMMING_FOR_PROBLEM_SOLVING, theme);
    }
    if (s.includes('civil engineering core') || s.includes('civil core')) {
      return resolveSvgPath(SUBJECT_KEYS.CIVIL_ENGINEERING_CORE, theme);
    }
    if (s.includes('basic electrical & workshop') || s.includes('basic electrical and workshop') || s.includes('basic electrical')) {
      return resolveSvgPath(SUBJECT_KEYS.BASIC_ELECTRICAL_WORKSHOP, theme);
    }
    if (s.includes('computer science core') || s.includes('cse core') || s.includes('computer science')) {
      return resolveSvgPath(SUBJECT_KEYS.COMPUTER_SCIENCE_CORE, theme);
    }
    if (s.includes('communicative english')) {
      return resolveSvgPath(SUBJECT_KEYS.COMMUNICATIVE_ENGLISH, theme);
    }
    if (s.includes('communication skills') || s.includes('english & communication') || s.includes('english and communication')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGLISH_COMMUNICATION_SKILLS, theme);
    }
    if (s.includes('mathematics-ii') || s.includes('mathematics 2') || s.includes('maths-ii') || s.includes('maths 2') || s.includes('math-ii') || s.includes('math 2') || s.includes('differential equations') || s.includes('fourier') || s.includes('numerical methods') || s.includes('complex numbers')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_MATHEMATICS_2, theme);
    }
    if (s.includes('engineering mathematics') || s.includes('engineering maths')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_MATHEMATICS, theme);
    }
    if (s.includes('engineering chemistry')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_CHEMISTRY, theme);
    }
    if (s.includes('engineering physics')) {
      return resolveSvgPath(SUBJECT_KEYS.ENGINEERING_PHYSICS, theme);
    }

    // ── 2. MATCH SPECIFIC GK / COMPETITIVE EXAMS SUBJECTS ──
    if (s.includes('environment') || s.includes('enviroment') || s.includes('ecology')) {
      return resolveSvgPath(SUBJECT_KEYS.ENVIRONMENT_ECOLOGY, theme);
    }
    if (s.includes('ancient history') || s.includes('ancient')) {
      return resolveSvgPath(SUBJECT_KEYS.ANCIENT_HISTORY, theme);
    }
    if (s.includes('medieval history') || s.includes('medieval')) {
      return resolveSvgPath(SUBJECT_KEYS.MEDIEVAL_HISTORY, theme);
    }
    if (s.includes('modern history') || s.includes('modern')) {
      return resolveSvgPath(SUBJECT_KEYS.MODERN_HISTORY, theme);
    }
    if (s.includes('polity') || s.includes('constitution')) {
      return resolveSvgPath(SUBJECT_KEYS.POLITY, theme);
    }
    if (s.includes('geography')) {
      return resolveSvgPath(SUBJECT_KEYS.GEOGRAPHY, theme);
    }
    if (s.includes('economics') || s.includes('economy')) {
      return resolveSvgPath(SUBJECT_KEYS.ECONOMICS, theme);
    }
    if (s.includes('biology')) {
      return resolveSvgPath(SUBJECT_KEYS.BIOLOGY, theme);
    }
    if (s.includes('static gk') || s.includes('static g.k') || s.includes('static')) {
      return resolveSvgPath(SUBJECT_KEYS.STATIC_GK, theme);
    }
    if (s.includes('chemistry')) {
      return resolveSvgPath(SUBJECT_KEYS.CHEMISTRY, theme);
    }
    if (s.includes('physics')) {
      return resolveSvgPath(SUBJECT_KEYS.PHYSICS, theme);
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

  return fallbackThumb || '/thumbnails/all_lecture_thumbnail.jpg';
}
