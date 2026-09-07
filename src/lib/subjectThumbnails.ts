/**
 * Stutosed Centralized Subject Thumbnail Architecture
 * Resolves high-aesthetic vector SVGs for all academic subjects and batches.
 * Features Title-First topic matching to accurately identify subject context
 * from lecture titles even inside multi-disciplinary engineering batches.
 */

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

export const BATCH_SUBJECT_MAP: Record<string, string> = {
  'ee-ece-eee': SUBJECT_KEYS.BASIC_ELECTRICAL_WORKSHOP,
  'ece-ee-eee': SUBJECT_KEYS.BASIC_ELECTRICAL_WORKSHOP,
  'mechanical-umeed': SUBJECT_KEYS.ELEMENTS_OF_MECHANICAL_ENGINEERING,
  'civil-umeed': SUBJECT_KEYS.CIVIL_ENGINEERING_CORE,
  'cse-umeed': SUBJECT_KEYS.COMPUTER_SCIENCE_CORE,
  'engineering-chemistry': SUBJECT_KEYS.ENGINEERING_CHEMISTRY,
  'engineering-mathematics-2': SUBJECT_KEYS.ENGINEERING_MATHEMATICS_2,
  'engineering-physics': SUBJECT_KEYS.ENGINEERING_PHYSICS,
  'parmar-gk-3-0': SUBJECT_KEYS.STATIC_GK,
  'parmar': SUBJECT_KEYS.STATIC_GK,
  'beu-1st-year': SUBJECT_KEYS.ENGINEERING_MATHEMATICS,
};

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
 * Evaluates a string for specific academic subject topics using keyword matching.
 */
function matchTopicToSubjectKey(raw: string): string | null {
  const t = raw.toLowerCase();

  // 1. Mathematics & Higher Calculus
  if (
    t.includes('mathematics-ii') ||
    t.includes('maths-ii') ||
    t.includes('mathematics 2') ||
    t.includes('maths 2') ||
    t.includes('complex variable') ||
    t.includes('complex number') ||
    t.includes('analytic function') ||
    t.includes('analytic information') ||
    t.includes('cauchy') ||
    t.includes('contour') ||
    t.includes('residue') ||
    t.includes('taylor') ||
    t.includes('laurent') ||
    t.includes('conformal') ||
    t.includes('special 38') ||
    t.includes('spl 38') ||
    t.includes('spl38')
  ) {
    return SUBJECT_KEYS.ENGINEERING_MATHEMATICS_2;
  }

  if (
    t.includes('calculus') ||
    t.includes('matrix') ||
    t.includes('matrices') ||
    t.includes('differential') ||
    t.includes('integration') ||
    t.includes('integral') ||
    t.includes('derivative') ||
    t.includes('probability') ||
    t.includes('statistics') ||
    t.includes('vector algebra') ||
    t.includes('algebra') ||
    t.includes('trigonometry') ||
    t.includes('geometry') ||
    t.includes('arithmetic') ||
    t.includes('percentage') ||
    t.includes('ratio and proportion') ||
    t.includes('profit and loss') ||
    t.includes('simple interest') ||
    t.includes('compound interest') ||
    t.includes('time and work') ||
    t.includes('speed and distance') ||
    t.includes('number system') ||
    t.includes('simplification') ||
    t.includes('maths b39') ||
    t.includes('maths-b39') ||
    t.includes('mathematics b39') ||
    t.includes('math')
  ) {
    return SUBJECT_KEYS.ENGINEERING_MATHEMATICS;
  }

  // 2. Chemistry
  if (
    t.includes('electromagnetic radiation') ||
    t.includes('spectroscopy') ||
    t.includes('polymer') ||
    t.includes('corrosion') ||
    t.includes('water treatment') ||
    t.includes('photoelectric') ||
    (t.includes('atomic') && t.includes('orbital')) ||
    t.includes('molecular orbital') ||
    t.includes('vsepr') ||
    t.includes('bent theory') ||
    t.includes('heisenberg') ||
    t.includes('chemical bonding') ||
    (t.includes('thermodynamics') && t.includes('chemical')) ||
    t.includes('periodic table') ||
    t.includes('states of matter') ||
    t.includes('acid') && t.includes('base') ||
    t.includes('organic chemistry') ||
    t.includes('inorganic chemistry') ||
    t.includes('chemistry')
  ) {
    return SUBJECT_KEYS.ENGINEERING_CHEMISTRY;
  }

  // 3. Physics
  if (
    t.includes('quantum mechanics') ||
    t.includes('wave optics') ||
    t.includes('interference') ||
    t.includes('diffraction') ||
    t.includes('polarization') ||
    t.includes('laser') ||
    t.includes('fiber optics') ||
    t.includes('optical fiber') ||
    t.includes('semiconductor') ||
    t.includes('dielectric') ||
    t.includes('magnetic properties') ||
    t.includes('superconductivity') ||
    t.includes('nanotechnology') ||
    t.includes('maxwell') ||
    t.includes('frame of reference') ||
    t.includes('laws of motion') ||
    t.includes('gravitation') ||
    t.includes('work energy') ||
    t.includes('rotational motion') ||
    t.includes('physics')
  ) {
    return SUBJECT_KEYS.ENGINEERING_PHYSICS;
  }

  // 4. Programming & Problem Solving
  if (
    t.includes('programming') ||
    t.includes('c language') ||
    t.includes('c programming') ||
    t.includes('pointer') ||
    t.includes('array') ||
    t.includes('loop') ||
    t.includes('recursion') ||
    t.includes('function in c') ||
    (t.includes('structure') && t.includes('union')) ||
    t.includes('file handling') ||
    t.includes('dynamic memory') ||
    t.includes('algorithm') ||
    t.includes('data structure') ||
    t.includes('pps') ||
    t.includes('logical reasoning') ||
    t.includes('syllogism') ||
    t.includes('blood relation') ||
    t.includes('coding decoding') ||
    t.includes('seating arrangement') ||
    t.includes('reasoning')
  ) {
    return SUBJECT_KEYS.PROGRAMMING_FOR_PROBLEM_SOLVING;
  }

  // 5. Computer Science Core
  if (
    t.includes('operating system') ||
    t.includes('dbms') ||
    t.includes('database') ||
    t.includes('compiler') ||
    t.includes('computer network') ||
    t.includes('software engineering') ||
    t.includes('computer science') ||
    t.includes('cse')
  ) {
    return SUBJECT_KEYS.COMPUTER_SCIENCE_CORE;
  }

  // 6. Engineering Graphics & Design
  if (
    t.includes('graphics') ||
    t.includes('drawing') ||
    t.includes('projection of line') ||
    t.includes('projection of plane') ||
    t.includes('projection of solid') ||
    t.includes('isometric') ||
    t.includes('perspective') ||
    (t.includes('scale') && t.includes('plane')) ||
    t.includes('autocad') ||
    t.includes('cad software') ||
    t.includes('conic section')
  ) {
    return SUBJECT_KEYS.ENGINEERING_GRAPHICS_DESIGN;
  }

  // 7. Workshop & Manufacturing
  if (
    t.includes('workshop') ||
    t.includes('manufacturing') ||
    t.includes('welding') ||
    t.includes('carpentry') ||
    t.includes('fitting') ||
    t.includes('smithy') ||
    t.includes('foundry') ||
    t.includes('sheet metal') ||
    t.includes('lathe') ||
    t.includes('machining') ||
    t.includes('machine tool')
  ) {
    return SUBJECT_KEYS.WORKSHOP_MANUFACTURING;
  }

  // 8. Basic Electrical & Workshop
  if (
    t.includes('basic electrical') ||
    t.includes('electric circuit') ||
    t.includes('kvl') ||
    t.includes('kcl') ||
    t.includes('thevenin') ||
    t.includes('norton') ||
    t.includes('superposition') ||
    t.includes('ac circuit') ||
    t.includes('three phase') ||
    t.includes('single phase') ||
    t.includes('transformer') ||
    t.includes('dc motor') ||
    t.includes('induction motor') ||
    t.includes('alternator') ||
    t.includes('electronics') ||
    t.includes('diode') ||
    t.includes('transistor')
  ) {
    return SUBJECT_KEYS.BASIC_ELECTRICAL_WORKSHOP;
  }

  // 9. Civil Engineering Core
  if (
    t.includes('surveying') ||
    t.includes('fluid mechanics') ||
    t.includes('building material') ||
    t.includes('concrete technology') ||
    t.includes('soil mechanics') ||
    t.includes('strength of material') ||
    t.includes('structural analysis') ||
    t.includes('highway engineering') ||
    t.includes('civil engineering') ||
    t.includes('civil')
  ) {
    return SUBJECT_KEYS.CIVIL_ENGINEERING_CORE;
  }

  // 10. Elements of Mechanical Engineering
  if (
    t.includes('ic engine') ||
    t.includes('steam boiler') ||
    t.includes('refrigeration') ||
    t.includes('air conditioning') ||
    t.includes('power transmission') ||
    t.includes('belt drive') ||
    t.includes('gear drive') ||
    t.includes('mechanical engineering') ||
    t.includes('mechanical engg') ||
    t.includes('mechanics')
  ) {
    return SUBJECT_KEYS.ELEMENTS_OF_MECHANICAL_ENGINEERING;
  }

  // 11. Biology
  if (
    t.includes('cell') ||
    t.includes('tissue') ||
    t.includes('plant kingdom') ||
    t.includes('animal kingdom') ||
    t.includes('genetics') ||
    t.includes('dna') ||
    t.includes('rna') ||
    t.includes('biomolecules') ||
    t.includes('photosynthesis') ||
    t.includes('respiration') ||
    t.includes('digestive system') ||
    t.includes('circulatory system') ||
    t.includes('nervous system') ||
    t.includes('endocrine system') ||
    t.includes('disease') ||
    t.includes('vitamin') ||
    t.includes('taxonomy') ||
    t.includes('biology') ||
    t.includes('botany') ||
    t.includes('zoology')
  ) {
    return SUBJECT_KEYS.BIOLOGY;
  }

  // 12. History (Ancient, Medieval, Modern)
  if (
    t.includes('ancient') ||
    t.includes('stone age') ||
    t.includes('indus valley') ||
    t.includes('harappa') ||
    t.includes('vedic') ||
    t.includes('buddhism') ||
    t.includes('jainism') ||
    t.includes('maurya') ||
    t.includes('gupta') ||
    t.includes('sangam') ||
    t.includes('mahajanapada')
  ) {
    return SUBJECT_KEYS.ANCIENT_HISTORY;
  }

  if (
    t.includes('medieval') ||
    t.includes('delhi sultanate') ||
    t.includes('mughal') ||
    t.includes('maratha') ||
    t.includes('vijayanagar') ||
    t.includes('bhakti') ||
    t.includes('sufi') ||
    t.includes('islam') ||
    t.includes('slave dynasty') ||
    t.includes('khilji') ||
    t.includes('tughlaq') ||
    t.includes('akbar')
  ) {
    return SUBJECT_KEYS.MEDIEVAL_HISTORY;
  }

  if (
    t.includes('modern') ||
    t.includes('advent of european') ||
    t.includes('east india') ||
    t.includes('revolt of 1857') ||
    t.includes('governor general') ||
    t.includes('viceroy') ||
    t.includes('reform movement') ||
    t.includes('national congress') ||
    t.includes('gandhi') ||
    t.includes('non cooperation') ||
    t.includes('civil disobedience') ||
    t.includes('quit india') ||
    t.includes('partition') ||
    t.includes('british') ||
    t.includes('history')
  ) {
    return SUBJECT_KEYS.MODERN_HISTORY;
  }

  // 13. Polity
  if (
    t.includes('polity') ||
    t.includes('constitution') ||
    t.includes('preamble') ||
    t.includes('fundamental right') ||
    t.includes('fundamental dut') ||
    t.includes('dpsp') ||
    t.includes('president') ||
    t.includes('parliament') ||
    t.includes('supreme court') ||
    t.includes('high court') ||
    t.includes('governor') ||
    t.includes('panchayat') ||
    t.includes('article') ||
    t.includes('amendment') ||
    t.includes('election commission') ||
    t.includes('upsc') ||
    t.includes('judiciary')
  ) {
    return SUBJECT_KEYS.POLITY;
  }

  // 14. Geography
  if (
    t.includes('geography') ||
    t.includes('solar system') ||
    t.includes('latitude') ||
    t.includes('longitude') ||
    (t.includes('earth') && t.includes('interior')) ||
    t.includes('plate techtonic') ||
    t.includes('volcano') ||
    t.includes('earthquake') ||
    t.includes('rock') ||
    t.includes('atmosphere') ||
    t.includes('pressure belt') ||
    t.includes('wind') ||
    t.includes('cyclone') ||
    t.includes('ocean') ||
    t.includes('tide') ||
    t.includes('current') ||
    t.includes('river') ||
    t.includes('mountain') ||
    t.includes('monsoon') ||
    t.includes('soil of india') ||
    t.includes('mineral')
  ) {
    return SUBJECT_KEYS.GEOGRAPHY;
  }

  // 15. Economics
  if (
    t.includes('economics') ||
    t.includes('economy') ||
    t.includes('inflation') ||
    t.includes('gdp') ||
    t.includes('national income') ||
    t.includes('monetary policy') ||
    t.includes('fiscal policy') ||
    t.includes('rbi') ||
    t.includes('banking') ||
    t.includes('budget') ||
    t.includes('taxation') ||
    t.includes('five year plan') ||
    t.includes('unemployment') ||
    t.includes('poverty') ||
    t.includes('microeconomics') ||
    t.includes('macroeconomics')
  ) {
    return SUBJECT_KEYS.ECONOMICS;
  }

  // 16. Environment & Ecology
  if (
    t.includes('environment') ||
    t.includes('ecology') ||
    t.includes('biodiversity') ||
    t.includes('pollution') ||
    t.includes('climate change') ||
    t.includes('global warming') ||
    t.includes('national park') ||
    t.includes('wildlife sanctuary') ||
    t.includes('wetland') ||
    t.includes('ramsar') ||
    t.includes('ecosystem') ||
    t.includes('greenhouse')
  ) {
    return SUBJECT_KEYS.ENVIRONMENT_ECOLOGY;
  }

  // 17. Static GK
  if (
    t.includes('classical dance') ||
    t.includes('folk dance') ||
    t.includes('dance') ||
    t.includes('festival') ||
    t.includes('temple') ||
    t.includes('monument') ||
    t.includes('award') ||
    t.includes('sport') ||
    t.includes('stadium') ||
    (t.includes('book') && t.includes('author')) ||
    t.includes('first in india') ||
    t.includes('national symbol') ||
    t.includes('headquarters') ||
    t.includes('unesco') ||
    t.includes('census') ||
    t.includes('fair') ||
    t.includes('static gk') ||
    t.includes('static g.k') ||
    t.includes('general awareness') ||
    t.includes('general knowledge')
  ) {
    return SUBJECT_KEYS.STATIC_GK;
  }

  // 18. English
  if (
    t.includes('communicative english') ||
    t.includes('practice 26') ||
    t.includes('english practice')
  ) {
    return SUBJECT_KEYS.COMMUNICATIVE_ENGLISH;
  }

  if (
    t.includes('english') ||
    t.includes('communication') ||
    t.includes('grammar') ||
    t.includes('vocabulary') ||
    t.includes('vocab') ||
    t.includes('narration') ||
    t.includes('voice') ||
    t.includes('tense') ||
    t.includes('noun') ||
    t.includes('pronoun') ||
    t.includes('verb') ||
    t.includes('adjective') ||
    t.includes('preposition') ||
    t.includes('conjunction') ||
    t.includes('idiom') ||
    t.includes('one word') ||
    t.includes('synonym') ||
    t.includes('antonym') ||
    t.includes('spelling') ||
    t.includes('comprehension') ||
    t.includes('cloze test')
  ) {
    return SUBJECT_KEYS.ENGLISH_COMMUNICATION_SKILLS;
  }

  return null;
}

/**
 * Normalizes subject/title string and resolves the exact canonical thumbnail asset.
 * Features Title-First resolution:
 * 1. Checks PROTECTED_THUMBNAILS (e.g. batch cover banners)
 * 2. Checks explicit valid image fallbacks (.jpg, .png, etc.)
 * 3. Evaluates lecture title (subjectName) FIRST for academic topic keywords
 * 4. Falls back to evaluating category/tab (tabIdOrName)
 * 5. Falls back to clean dynamic SVG generator
 */
export function getSubjectThumbnail(
  subjectName?: string | null,
  fallbackThumb?: string | null,
  tabIdOrName?: string | null,
  theme?: 'light' | 'dark'
): string {
  const s = (subjectName || '').trim();
  const t = (tabIdOrName || '').trim();

  // 1. Canonical Batch Subject Mapping (theme-aware)
  const normTabId = t.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
  if (normTabId && BATCH_SUBJECT_MAP[normTabId]) {
    return resolveSvgPath(BATCH_SUBJECT_MAP[normTabId], theme);
  }
  const normSubj = s.toLowerCase().replace(/[^a-z0-9_-]/g, '-').replace(/-+/g, '-');
  if (normSubj && BATCH_SUBJECT_MAP[normSubj]) {
    return resolveSvgPath(BATCH_SUBJECT_MAP[normSubj], theme);
  }

  // 2. TITLE-FIRST TOPIC MATCHING: Check lecture title (s) first!
  if (s) {
    const titleMatch = matchTopicToSubjectKey(s);
    if (titleMatch) {
      return resolveSvgPath(titleMatch, theme);
    }
  }

  // 3. If title didn't match an academic topic, check tab / category name (t)
  if (t) {
    const tabMatch = matchTopicToSubjectKey(t);
    if (tabMatch) {
      return resolveSvgPath(tabMatch, theme);
    }
  }

  // 4. Themed SVG fallback if provided
  if (fallbackThumb && fallbackThumb.endsWith('.svg')) {
    if (theme && !fallbackThumb.includes('_light.svg') && !fallbackThumb.includes('_dark.svg')) {
      return fallbackThumb.replace('.svg', `_${theme}.svg`);
    }
    return fallbackThumb;
  }

  // 5. Dynamic Title-based Minimalist SVG generator
  const cleanTitle = (s || t || 'Study Lecture').trim();
  if (cleanTitle) {
    return getDynamicThumbnailUrl(cleanTitle, t, theme);
  }

  const mode = theme === 'dark' ? 'dark' : 'light';
  return `/thumbnails/default_lecture_${mode}.svg`;
}
