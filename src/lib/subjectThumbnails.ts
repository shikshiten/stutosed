/**
 * Stutosed Centralized Subject Thumbnail Architecture
 * Resolves high-aesthetic vector SVGs for all academic subjects and batches.
 * 
 * Hierarchy:
 * 1. 10 Active Courses -> Dedicated High-Impact Centered SVG
 * 2. Active Subject Folders (BEU & Parmar) -> Dedicated Centered SVG
 * 3. Video Lectures -> Dynamic Centered Title SVG via /api/thumbnail
 */

export const SUBJECT_KEYS = {
  // ── ALL 10 COURSES ──
  COMPUTER_SPECIAL: 'computer_special',
  ENGLISH_GRAMMAR: 'english_grammar',
  ENGLISH_PRACTICE: 'english_practice',
  LOGICAL_REASONING: 'logical_reasoning',
  MATHS_B39: 'maths_b39',
  MATHS_SPL38: 'maths_spl38',
  PARMAR_ACADEMY_GK: 'parmar_academy_gk',
  PARMAR_GK_3_0: 'parmar_gk_3_0',
  SSC_PRATHAM_BATCH_2: 'ssc_pratham_batch_2',
  BEU_1ST_YEAR: 'beu_1st_year',

  // ── 15 NEW GOVERNMENT EXAM BATCHES ──
  REASONING_SPL_38: 'reasoning_spl_38',
  MATHS_SPL_B43: 'maths_spl_b43',
  MATHS_SPECIAL_VOD: 'maths_special_vod',
  VOCAB_MASTERY_VOD: 'vocab_mastery_vod',
  MATHS_SPL_B42: 'maths_spl_b42',
  SSC_AARAMBH_BATCH_02: 'ssc_aarambh_batch_02',
  MATHS_SPL_B47: 'maths_spl_b47',
  ENG_PRACTICE_31_TURBO: 'eng_practice_31_turbo',
  REASONING_SPL_58: 'reasoning_spl_58',
  MATHS_SPECIAL_1_LOKI: 'maths_special_1_loki',
  SELECTION_BATCH_1_LOKI: 'selection_batch_1_loki',
  AARAMBH_BATCH_100HR_SW: 'aarambh_batch_100hr_sw',
  LOKI_MATHS_SPECIAL_VOD_2: 'loki_maths_special_vod_2',
  SELECTION_BATCH_1: 'selection_batch_1',
  LOKI_SSC_COMPLETE_VOD: 'loki_ssc_complete_vod',

  // ── BEU 1ST YEAR SUBJECT FOLDERS ──
  EE_ECE_EEE: 'ee_ece_eee',
  MECHANICAL_ENGINEERING: 'mechanical_engineering',
  CIVIL_ENGINEERING: 'civil_engineering',
  CSE_UMEED: 'cse_umeed',
  ENGINEERING_CHEMISTRY: 'engineering_chemistry',
  ENGINEERING_MATHEMATICS_2: 'engineering_mathematics_2',
  ENGINEERING_PHYSICS: 'engineering_physics',

  // ── PARMAR GK 3.0 SUBJECT FOLDERS ──
  STATIC_GK: 'static_gk',
  BIOLOGY: 'biology',
  ECONOMICS: 'economics',
  CHEMISTRY: 'chemistry',
  ENVIRONMENT_ECOLOGY: 'environment_ecology',
} as const;

export const BATCH_SUBJECT_MAP: Record<string, string> = {
  // ── ALL 10 COURSES ──
  'computer': SUBJECT_KEYS.COMPUTER_SPECIAL,
  'computer-special': SUBJECT_KEYS.COMPUTER_SPECIAL,
  'computer-science': SUBJECT_KEYS.COMPUTER_SPECIAL,
  'yatendra-sir': SUBJECT_KEYS.COMPUTER_SPECIAL,

  'english-spl': SUBJECT_KEYS.ENGLISH_GRAMMAR,
  'english-grammar': SUBJECT_KEYS.ENGLISH_GRAMMAR,

  'english-practice': SUBJECT_KEYS.ENGLISH_PRACTICE,

  'reasoning': SUBJECT_KEYS.LOGICAL_REASONING,
  'logical-reasoning': SUBJECT_KEYS.LOGICAL_REASONING,

  'maths-b39': SUBJECT_KEYS.MATHS_B39,
  'mathematics-b39': SUBJECT_KEYS.MATHS_B39,

  'maths-spl38': SUBJECT_KEYS.MATHS_SPL38,
  'mathematics-spl-38': SUBJECT_KEYS.MATHS_SPL38,
  'maths-special-38': SUBJECT_KEYS.MATHS_SPL38,

  'parmar': SUBJECT_KEYS.PARMAR_ACADEMY_GK,
  'parmar-academy-gk': SUBJECT_KEYS.PARMAR_ACADEMY_GK,
  'parmar-4-0': SUBJECT_KEYS.PARMAR_ACADEMY_GK,

  'parmar-gk-3-0': SUBJECT_KEYS.PARMAR_GK_3_0,

  'pratham': SUBJECT_KEYS.SSC_PRATHAM_BATCH_2,
  'ssc-pratham-batch-2': SUBJECT_KEYS.SSC_PRATHAM_BATCH_2,

  'beu-1st-year': SUBJECT_KEYS.BEU_1ST_YEAR,
  '1st-year': SUBJECT_KEYS.BEU_1ST_YEAR,
  'beu-b-tech-1st-year': SUBJECT_KEYS.BEU_1ST_YEAR,

  // ── 15 NEW GOVERNMENT EXAM BATCHES ──
  'reasoning-spl-38': SUBJECT_KEYS.REASONING_SPL_38,
  'maths-spl-b43': SUBJECT_KEYS.MATHS_SPL_B43,
  'maths-special-vod': SUBJECT_KEYS.MATHS_SPECIAL_VOD,
  'vocab-mastery-vod': SUBJECT_KEYS.VOCAB_MASTERY_VOD,
  'maths-spl-b42': SUBJECT_KEYS.MATHS_SPL_B42,
  'ssc-aarambh-batch-02': SUBJECT_KEYS.SSC_AARAMBH_BATCH_02,
  'maths-spl-b47': SUBJECT_KEYS.MATHS_SPL_B47,
  'eng-practice-31-turbo': SUBJECT_KEYS.ENG_PRACTICE_31_TURBO,
  'reasoning-spl-58': SUBJECT_KEYS.REASONING_SPL_58,
  'maths-special-1-loki': SUBJECT_KEYS.MATHS_SPECIAL_1_LOKI,
  'selection-batch-1-loki': SUBJECT_KEYS.SELECTION_BATCH_1_LOKI,
  'aarambh-batch-100hr-sw': SUBJECT_KEYS.AARAMBH_BATCH_100HR_SW,
  'loki-maths-special-vod-2': SUBJECT_KEYS.LOKI_MATHS_SPECIAL_VOD_2,
  'selection-batch-1': SUBJECT_KEYS.SELECTION_BATCH_1,
  'loki-ssc-complete-vod': SUBJECT_KEYS.LOKI_SSC_COMPLETE_VOD,

  // ── BEU 1ST YEAR SUBJECT FOLDERS ──
  'ece-ee-eee': SUBJECT_KEYS.EE_ECE_EEE,
  'ee-ece-eee': SUBJECT_KEYS.EE_ECE_EEE,
  'mechanical-umeed': SUBJECT_KEYS.MECHANICAL_ENGINEERING,
  'mechanical-engineering': SUBJECT_KEYS.MECHANICAL_ENGINEERING,
  'civil-umeed': SUBJECT_KEYS.CIVIL_ENGINEERING,
  'civil-engineering': SUBJECT_KEYS.CIVIL_ENGINEERING,
  'cse-umeed': SUBJECT_KEYS.CSE_UMEED,
  'engineering-chemistry': SUBJECT_KEYS.ENGINEERING_CHEMISTRY,
  'engineering-mathematics-2': SUBJECT_KEYS.ENGINEERING_MATHEMATICS_2,
  'engineering-mathematics-ii': SUBJECT_KEYS.ENGINEERING_MATHEMATICS_2,
  'engineering-physics': SUBJECT_KEYS.ENGINEERING_PHYSICS,

  // ── PARMAR GK 3.0 SUBJECT FOLDERS ──
  'static-gk': SUBJECT_KEYS.STATIC_GK,
  'biology': SUBJECT_KEYS.BIOLOGY,
  'economics': SUBJECT_KEYS.ECONOMICS,
  'chemistry': SUBJECT_KEYS.CHEMISTRY,
  'env-ecology': SUBJECT_KEYS.ENVIRONMENT_ECOLOGY,
  'environment-ecology': SUBJECT_KEYS.ENVIRONMENT_ECOLOGY,
};

function resolveSvgPath(key: string, theme?: 'light' | 'dark'): string {
  const mode = theme === 'dark' ? 'dark' : 'light';
  return `/thumbnails/subjects/${key}_${mode}.svg`;
}

/**
 * Returns dynamic SVG thumbnail URL pointing to /api/thumbnail endpoint.
 * This dynamically renders the exact lecture or item title centered on the card.
 */
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
 * Convenience helper for lecture thumbnails
 */
export function getLectureThumbnail(
  title?: string | null,
  category?: string | null,
  theme?: 'light' | 'dark'
): string {
  return getDynamicThumbnailUrl(title, category, theme);
}

/**
 * Normalizes subject/title string and resolves the exact canonical thumbnail asset.
 * 1. Checks BATCH_SUBJECT_MAP for tab id (folders or courses)
 * 2. Checks BATCH_SUBJECT_MAP for normalized subject/course name
 * 3. Resolves themed version if fallbackThumb is provided
 * 4. Falls back to clean dynamic SVG generator with the item's title centered
 */
export function getSubjectThumbnail(
  subjectName?: string | null,
  fallbackThumb?: string | null,
  tabIdOrName?: string | null,
  theme?: 'light' | 'dark'
): string {
  const s = (subjectName || '').trim();
  const t = (tabIdOrName || '').trim();
  const mode = theme === 'dark' ? 'dark' : 'light';

  // 1. Check tab ID in canonical mapping (e.g. 'static-gk', 'civil-umeed', 'computer')
  const normTabId = t.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (normTabId && BATCH_SUBJECT_MAP[normTabId]) {
    return resolveSvgPath(BATCH_SUBJECT_MAP[normTabId], theme);
  }

  // 2. Check subject / course name in canonical mapping
  const normSubj = s.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  if (normSubj && BATCH_SUBJECT_MAP[normSubj]) {
    return resolveSvgPath(BATCH_SUBJECT_MAP[normSubj], theme);
  }

  // 3. Themed SVG fallback if provided (e.g. from coursesData.json thumb field)
  if (fallbackThumb && fallbackThumb.endsWith('.svg')) {
    if (fallbackThumb.includes('_dark.svg') || fallbackThumb.includes('_light.svg')) {
      return fallbackThumb.replace(/_(dark|light)\.svg$/, `_${mode}.svg`);
    }
    return fallbackThumb.replace(/\.svg$/, `_${mode}.svg`);
  }

  if (fallbackThumb && (fallbackThumb.endsWith('.png') || fallbackThumb.endsWith('.jpg') || fallbackThumb.endsWith('.webp'))) {
    return fallbackThumb;
  }

  // 4. Dynamic Title-based Minimalist SVG generator with centered title
  const cleanTitle = (s || t || 'Study Lecture').trim();
  if (cleanTitle) {
    return getDynamicThumbnailUrl(cleanTitle, t, theme);
  }

  return `/thumbnails/default_course_${mode}.svg`;
}
