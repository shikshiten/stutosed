/**
 * Stutosed Centralized Subject Thumbnail Architecture
 * Maps academic and competitive exam subjects to their exact, unified, high-aesthetic Mithila-infused thumbnails.
 *
 * PROTECTED CATEGORIES (NEVER OVERRIDDEN):
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

// 24 Unified Subject Thumbnails
export const SUBJECT_THUMBNAILS = {
  // ── ENGINEERING (13) ──
  ENGINEERING_PHYSICS: '/thumbnails/subjects/engineering_physics.svg',
  ENGINEERING_CHEMISTRY: '/thumbnails/subjects/engineering_chemistry.svg',
  ENGINEERING_MATHEMATICS_2: '/thumbnails/subjects/engineering_mathematics_2.svg',
  COMMUNICATIVE_ENGLISH: '/thumbnails/subjects/communicative_english.svg',
  ENGINEERING_GRAPHICS_DESIGN: '/thumbnails/subjects/engineering_graphics_design.svg',
  ELEMENTS_OF_MECHANICAL_ENGINEERING: '/thumbnails/subjects/elements_of_mechanical_engineering.svg',
  WORKSHOP_MANUFACTURING: '/thumbnails/subjects/workshop_manufacturing.svg',
  PROGRAMMING_FOR_PROBLEM_SOLVING: '/thumbnails/subjects/programming_for_problem_solving.svg',
  CIVIL_ENGINEERING_CORE: '/thumbnails/subjects/civil_engineering_core.svg',
  BASIC_ELECTRICAL_WORKSHOP: '/thumbnails/subjects/basic_electrical_workshop.svg',
  ENGINEERING_MATHEMATICS: '/thumbnails/subjects/engineering_mathematics.svg',
  COMPUTER_SCIENCE_CORE: '/thumbnails/subjects/computer_science_core.svg',
  ENGLISH_COMMUNICATION_SKILLS: '/thumbnails/subjects/english_communication_skills.svg',

  // ── GK / COMPETITIVE EXAMS (11) ──
  BIOLOGY: '/thumbnails/subjects/biology.svg',
  ECONOMICS: '/thumbnails/subjects/economics.svg',
  STATIC_GK: '/thumbnails/subjects/static_gk.svg',
  CHEMISTRY: '/thumbnails/subjects/chemistry.svg',
  PHYSICS: '/thumbnails/subjects/physics.svg',
  POLITY: '/thumbnails/subjects/polity.svg',
  ANCIENT_HISTORY: '/thumbnails/subjects/ancient_history.svg',
  MEDIEVAL_HISTORY: '/thumbnails/subjects/medieval_history.svg',
  MODERN_HISTORY: '/thumbnails/subjects/modern_history.svg',
  GEOGRAPHY: '/thumbnails/subjects/geography.svg',
  ENVIRONMENT_ECOLOGY: '/thumbnails/subjects/environment_ecology.svg',
} as const;

/**
 * Normalizes subject string and resolves the exact canonical thumbnail asset.
 */
export function getSubjectThumbnail(
  subjectName?: string | null,
  fallbackThumb?: string | null,
  tabIdOrName?: string | null
): string {
  // Check protected categories first
  if (tabIdOrName) {
    const rawId = tabIdOrName.toLowerCase().trim();
    if (PROTECTED_THUMBNAILS[rawId]) return PROTECTED_THUMBNAILS[rawId];
    if (rawId.includes('parmar')) return '/thumbnails/parmar_gk_3.jpg';
    if (rawId === 'ee / ece / eee' || rawId.includes('ece-ee-eee')) return '/thumbnails/beu_ece_ee_eee.jpg';
    if (rawId === 'mechanical engineering (umeed)' || rawId === 'mechanical-umeed') return '/thumbnails/beu_mech_umeed.jpg';
    if (rawId === 'civil engineering (umeed)' || rawId === 'civil-umeed') return '/thumbnails/beu_civil_umeed.jpg';
    if (rawId === 'cse (umeed)' || rawId === 'cse-umeed') return '/thumbnails/beu_cse_umeed.jpg';
  }

  const s = (subjectName || tabIdOrName || '').toLowerCase().trim();
  if (!s) return fallbackThumb || '/thumbnails/all_lecture_thumbnail.jpg';

  // ── 1. ENGINEERING SUBJECTS ──
  if (s.includes('graphics') || s.includes('engineering graphics')) {
    return SUBJECT_THUMBNAILS.ENGINEERING_GRAPHICS_DESIGN;
  }
  if (s.includes('elements of mechanical') || s.includes('mechanical engg')) {
    return SUBJECT_THUMBNAILS.ELEMENTS_OF_MECHANICAL_ENGINEERING;
  }
  if (s.includes('workshop & manufacturing') || s.includes('manufacturing')) {
    return SUBJECT_THUMBNAILS.WORKSHOP_MANUFACTURING;
  }
  if (s.includes('programming for problem solving') || s.includes('problem solving') || s.includes('pps')) {
    return SUBJECT_THUMBNAILS.PROGRAMMING_FOR_PROBLEM_SOLVING;
  }
  if (s.includes('civil engineering core') || s.includes('civil core')) {
    return SUBJECT_THUMBNAILS.CIVIL_ENGINEERING_CORE;
  }
  if (s.includes('basic electrical & workshop') || s.includes('basic electrical')) {
    return SUBJECT_THUMBNAILS.BASIC_ELECTRICAL_WORKSHOP;
  }
  if (s.includes('computer science core') || s.includes('cse core')) {
    return SUBJECT_THUMBNAILS.COMPUTER_SCIENCE_CORE;
  }
  if (s.includes('communicative english')) {
    return SUBJECT_THUMBNAILS.COMMUNICATIVE_ENGLISH;
  }
  if (s.includes('communication skills') || s.includes('english & communication')) {
    return SUBJECT_THUMBNAILS.ENGLISH_COMMUNICATION_SKILLS;
  }
  if (s.includes('mathematics-ii') || s.includes('mathematics 2') || s.includes('maths-ii') || s.includes('maths 2')) {
    return SUBJECT_THUMBNAILS.ENGINEERING_MATHEMATICS_2;
  }
  if (s.includes('engineering mathematics') || s.includes('engineering maths')) {
    return SUBJECT_THUMBNAILS.ENGINEERING_MATHEMATICS;
  }
  if (s.includes('engineering chemistry')) {
    return SUBJECT_THUMBNAILS.ENGINEERING_CHEMISTRY;
  }
  if (s.includes('engineering physics')) {
    return SUBJECT_THUMBNAILS.ENGINEERING_PHYSICS;
  }

  // ── 2. GK / COMPETITIVE EXAMS SUBJECTS ──
  if (s.includes('environment') || s.includes('enviroment') || s.includes('ecology')) {
    return SUBJECT_THUMBNAILS.ENVIRONMENT_ECOLOGY;
  }
  if (s.includes('ancient history') || s.includes('ancient')) {
    return SUBJECT_THUMBNAILS.ANCIENT_HISTORY;
  }
  if (s.includes('medieval history') || s.includes('medieval')) {
    return SUBJECT_THUMBNAILS.MEDIEVAL_HISTORY;
  }
  if (s.includes('modern history') || s.includes('modern')) {
    return SUBJECT_THUMBNAILS.MODERN_HISTORY;
  }
  if (s.includes('polity') || s.includes('constitution')) {
    return SUBJECT_THUMBNAILS.POLITY;
  }
  if (s.includes('geography')) {
    return SUBJECT_THUMBNAILS.GEOGRAPHY;
  }
  if (s.includes('economics') || s.includes('economy')) {
    return SUBJECT_THUMBNAILS.ECONOMICS;
  }
  if (s.includes('biology')) {
    return SUBJECT_THUMBNAILS.BIOLOGY;
  }
  if (s.includes('static gk') || s.includes('static g.k') || s.includes('static')) {
    return SUBJECT_THUMBNAILS.STATIC_GK;
  }
  if (s.includes('chemistry')) {
    return SUBJECT_THUMBNAILS.CHEMISTRY;
  }
  if (s.includes('physics')) {
    return SUBJECT_THUMBNAILS.PHYSICS;
  }

  return fallbackThumb || '/thumbnails/all_lecture_thumbnail.jpg';
}
