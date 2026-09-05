/**
 * Dynamic Educational Topic Description Engine
 * Automatically generates syllabus-aligned topic summaries, core concepts,
 * and exam tips for any lecture title across B.Tech and Competitive Exam courses.
 */

export interface TopicDescription {
  overview: string;
  keyPoints: string[];
  examTip: string;
  categoryTag: string;
  estimatedReadTime: string;
}

// Knowledge rules mapped to common exam keywords
const TOPIC_PATTERNS: {
  keywords: string[];
  category: string;
  getOverview: (title: string) => string;
  keyPoints: string[];
  examTip: string;
}[] = [
  // ── BIOLOGY ──
  {
    keywords: ['cell', 'koshika', 'mitochondria', 'nucleus'],
    category: 'Cell Biology',
    getOverview: () => 'Is lecture me Cell (Koshika) ke structure, discovery aur organelles (Mitochondria, Nucleus, Ribosome, Golgi body) ko detail me cover kiya gaya hai jo har competitive exam ka foundational core hai.',
    keyPoints: [
      'Prokaryotic vs Eukaryotic cells ke key structural differences.',
      'Powerhouse of the Cell (Mitochondria) aur ATP production mechanism.',
      'Cell Wall vs Cell Membrane aur transport functions.',
      'Endoplasmic reticulum aur Protein synthesis overview.'
    ],
    examTip: 'SSC CGL/CHSL aur CDS me Organelles ke discovery scientist aur specific nicknames (e.g. Suicidal Bags of Cell - Lysosomes) par direct questions aate hain.'
  },
  {
    keywords: ['tissue', 'utak', 'xylem', 'phloem', 'epithelial'],
    category: 'Histology & Tissues',
    getOverview: () => 'Plant aur Animal Tissues ka comprehensive analysis — Meristematic vs Permanent tissues aur muscular/connective tissues ka role.',
    keyPoints: [
      'Xylem aur Phloem: Plant water aur food conduction network.',
      'Meristematic Tissues: Apical, Lateral aur Intercalary growth.',
      'Animal Tissues: Epithelial, Connective (Blood & Bone) functions.'
    ],
    examTip: 'Complex Permanent Tissues (Xylem vs Phloem) ke components par matching question aksar pooche jate hain.'
  },
  {
    keywords: ['vitamin', 'nutrition', 'poshan', 'disease', 'rog'],
    category: 'Human Health & Nutrition',
    getOverview: () => 'Vitamins, Nutrients, deficiency diseases aur bacterial/viral pathogens ka complete high-yield exam breakdown.',
    keyPoints: [
      'Fat Soluble (A, D, E, K) vs Water Soluble (B, C) vitamins.',
      'Chemical names aur unki deficiency se hone wale rog (Scurvy, Rickets, Beriberi).',
      'Communicable vs Non-communicable diseases classification.'
    ],
    examTip: 'Har saal SSC CGL me Vitamins ke scientific/chemical names aur unke deficiency syndromes se 1 question pakka rehta hai.'
  },

  // ── POLITY ──
  {
    keywords: ['article', 'anuchhed', 'preamble', 'prastavana', 'constitution', 'samvidhan'],
    category: 'Indian Polity',
    getOverview: () => 'Indian Constitution ke basic structure, Preamble (Prastavana) aur key constitutional provisions ka in-depth legal aur conceptual analysis.',
    keyPoints: [
      'Preamble: Sovereign, Socialist, Secular, Democratic, Republic keywords ka significance.',
      '42nd Amendment Act 1976 aur added words ki timeline.',
      'Drafting Committee, Constituent Assembly sessions aur adoption dates.'
    ],
    examTip: 'Preamble me diye gaye Words ka sequence (Sovereign, Socialist, Secular...) aur Articles 1 to 4 ki territory boundaries directly exam me aati hain.'
  },
  {
    keywords: ['fundamental right', 'mool adhikar', 'fr ', 'dpsp', 'fundamental duty'],
    category: 'Constitutional Rights',
    getOverview: () => 'Articles 12 se 35 tak ke Fundamental Rights (Part III) aur Directive Principles of State Policy (Part IV) ka exhaustive exam-oriented session.',
    keyPoints: [
      '6 Fundamental Rights: Equality, Freedom, Exploitation, Religion, Culture, Constitutional Remedies.',
      'Article 32: Dr. B.R. Ambedkar ka "Heart & Soul of Constitution" aur 5 Writs.',
      'Article 21 (Right to Life) aur expanded dimensions.'
    ],
    examTip: 'Article 32 aur Article 226 ke Writs (Habeas Corpus, Mandamus, Quo-Warranto) ke meanings aur differences ko achhe se revise karein.'
  },
  {
    keywords: ['parliament', 'sansad', 'president', 'rashtrapati', 'prime minister', 'lok sabha', 'rajya sabha'],
    category: 'Union Executive & Legislature',
    getOverview: () => 'Union Executive — President, Prime Minister, Council of Ministers aur Parliament ke dono Houses ki legislative powers aur passing of bills.',
    keyPoints: [
      'President election, impeachment process (Article 61) aur ordinance power (Article 123).',
      'Lok Sabha vs Rajya Sabha: Special powers, tenure aur money bills (Article 110).',
      'Joint Sitting of Parliament (Article 108) aur presiding officer rules.'
    ],
    examTip: 'President ki Pardoning powers (Article 72) aur Money Bill certify karne ka Speaker ka special right sabse frequent repeat topics hain.'
  },

  // ── HISTORY ──
  {
    keywords: ['indus', 'harappa', 'mohenjo', 'vedic', 'sindhu'],
    category: 'Ancient Indian History',
    getOverview: () => 'Indus Valley Civilization (IVC) ke town planning, drainage systems, archaeological excavations aur Vedic Age literature ka analysis.',
    keyPoints: [
      'Great Bath (Mohenjodaro), Dockyard (Lothal) aur major excavated sites.',
      'IVC trade routes, seal scripts, metallurgy aur society.',
      'Early Vedic vs Later Vedic society aur 4 Vedas.'
    ],
    examTip: 'Harappan sites ki geographical river locations (e.g. Harappa on Ravi, Mohenjodaro on Indus) aur excavator names ko note karein.'
  },
  {
    keywords: ['maurya', 'ashoka', 'gupta', 'buddhism', 'jainism'],
    category: 'Empire & Religious Movements',
    getOverview: () => 'Buddhism, Jainism, Mauryan Empire under Chandragupta & Ashoka, aur Gupta Golden Age ke art, architecture aur edicts.',
    keyPoints: [
      'Four Buddhist Councils: Locations, kings aur presiding monks.',
      'Ashokan Rock Edicts: Dhamma policy aur Kalinga war timeline.',
      'Gupta Dynasty: Coins, temples aur literary achievements (Kalidasa, Aryabhata).'
    ],
    examTip: 'Buddhist Councils ke pairs (Council - Venue - Ruler) SSC aur State PSCs me sabse common multiple-choice questions hote hain.'
  },
  {
    keywords: ['1857', 'gandhi', 'congress', 'inc', 'freedom', 'movement', 'viceroy'],
    category: 'Modern Indian History',
    getOverview: () => 'Indian National Movement — 1857 Revolt, Indian National Congress sessions, Gandhian Mass Movements aur Independence struggle.',
    keyPoints: [
      '1857 Revolt ke key leaders (Kunwar Singh, Rani Lakshmibai, Nana Saheb) aur centres.',
      'Non-Cooperation (1920), Civil Disobedience (1930) aur Quit India Movement (1942).',
      'Important INC sessions (Surat Split 1907, Lucknow Pact 1916, Lahore 1929).'
    ],
    examTip: 'Poorna Swaraj resolution (1929 Lahore Session) aur Dandi March dates ko chronology questions ke liye yaad rakhein.'
  },

  // ── GEOGRAPHY ──
  {
    keywords: ['river', 'nadi', 'drainage', 'himalaya', 'mountain', 'dam', 'lake'],
    category: 'Indian Geography',
    getOverview: () => 'Indian Drainage System (Himalayan vs Peninsular rivers), River tributaries, origin glaciers, multipurpose dams aur physical physiography.',
    keyPoints: [
      'Indus, Ganga, Brahmaputra drainage basins aur left/right bank tributaries.',
      'West flowing rivers (Narmada, Tapti) aur East flowing rivers (Godavari, Krishna, Cauvery).',
      'Major Multipurpose River Valley Projects (Dams & Reservoirs).'
    ],
    examTip: 'Tributaries classification (Left bank vs Right bank) aur rivers origin points par frequently questions aate hain.'
  },

  // ── ENGINEERING & MATHEMATICS ──
  {
    keywords: ['integration', 'calculus', 'differential', 'derivative', 'matrix', 'matrices'],
    category: 'Engineering Mathematics',
    getOverview: () => 'Higher Engineering Mathematics — foundational calculus, integral transformations, matrix eigenspaces aur boundary value solving methods.',
    keyPoints: [
      'Standard integral techniques, partial fractions aur substitution laws.',
      'Eigenvalues, Eigenvectors aur Cayley-Hamilton theorem applications.',
      'Differential equations of higher order with constant coefficients.'
    ],
    examTip: 'BEU University exams me Cayley-Hamilton theorem verification aur inverse matrix finding 14 marks ke compulsory question me aate hain.'
  },
  {
    keywords: ['physics', 'optics', 'laser', 'quantum', 'fiber', 'wave'],
    category: 'Engineering Physics',
    getOverview: () => 'Technical Engineering Physics — Wave optics, interference, diffraction, quantum tunneling aur laser propagation in optical fibers.',
    keyPoints: [
      'Interference in thin films aur Newton’s rings experiment.',
      'He-Ne Laser working principle, population inversion aur optical pumping.',
      'Numerical aperture aur acceptance angle in fiber optics.'
    ],
    examTip: 'Newton’s Rings diameter derivation aur Laser 3-level vs 4-level energy diagram BEU semester questions ke core hot-topics hain.'
  },
  {
    keywords: ['thermo', 'entropy', 'heat', 'engine', 'carnot', 'cycle'],
    category: 'Thermal Engineering',
    getOverview: () => 'Thermodynamics core laws, Carnot heat engine efficiency, Entropy generation, steady flow energy equations (SFEE) aur gas power cycles.',
    keyPoints: [
      'Zeroth, First, Second & Third Laws of Thermodynamics.',
      'Carnot theorem aur reversible vs irreversible process entropy changes.',
      'Rankine Cycle aur Otto / Diesel power cycles comparisons.'
    ],
    examTip: 'Clausius inequality aur Carnot efficiency formula par numericals engineering exams me har saal aate hain.'
  },

  // ── QUANT & REASONING ──
  {
    keywords: ['percentage', 'profit', 'loss', 'discount', 'ratio', 'proportion'],
    category: 'Commercial Arithmetic',
    getOverview: () => 'Fast Arithmetic Shortcuts — Percentages, Cost Price vs Selling Price, successive discounts aur weighted ratios for 30-second solving speed.',
    keyPoints: [
      'Fraction-to-percentage conversion chart (1/2 to 1/20).',
      'Net percentage change formula: a + b + (ab/100).',
      'Marked price, Discount % aur Profit % connecting equations.'
    ],
    examTip: 'Calculation speed boost karne ke liye fraction table ko daily 2 minute revise karein.'
  },
  {
    keywords: ['syllogism', 'reasoning', 'coding', 'series', 'blood relation', 'direction'],
    category: 'Logical Reasoning',
    getOverview: () => 'Analytical Reasoning techniques — Venn diagram method for syllogisms, alphabet coding, direction sense maps aur family tree diagrams.',
    keyPoints: [
      '100-50 / Venn Diagram rules for "All", "Some", "No", "Some Not" syllogisms.',
      'Positional alphabet values (EJOTY rule) aur reverse letter pairs.',
      'Family Tree standard symbols: (+) Male, (-) Female, (=) Couple.'
    ],
    examTip: 'Syllogism me "Possibility" cases ko Venn diagram ke universal containment rule se test karein.'
  }
];

/**
 * Clean and normalize lecture titles
 */
function cleanLectureTitle(rawTitle: string): string {
  return rawTitle
    .replace(/^lec(?:ture)?\s*[-_:]?\s*\d+\s*[-_:]?\s*/i, '')
    .replace(/\s*[-_:]?\s*lec(?:ture)?\s*\d+$/i, '')
    .trim();
}

/**
 * Generate syllabus-aligned topic description dynamically
 */
export function getLectureTopicDescription(
  lectureTitle: string,
  courseName?: string,
  subjectName?: string
): TopicDescription {
  const cleanTitle = cleanLectureTitle(lectureTitle);
  const searchStr = `${cleanTitle} ${lectureTitle} ${subjectName || ''} ${courseName || ''}`.toLowerCase();

  // Try matching against topic knowledge patterns
  for (const pattern of TOPIC_PATTERNS) {
    const isMatch = pattern.keywords.some((kw) => searchStr.includes(kw));
    if (isMatch) {
      return {
        overview: pattern.getOverview(cleanTitle),
        keyPoints: pattern.keyPoints,
        examTip: pattern.examTip,
        categoryTag: pattern.category,
        estimatedReadTime: '45 - 60 min session',
      };
    }
  }

  // Dynamic Intelligent Context Generator if no specific pattern matched
  const isEngineering = searchStr.includes('beu') || searchStr.includes('b.tech') || searchStr.includes('engineering');
  const isGovt = searchStr.includes('ssc') || searchStr.includes('parmar') || searchStr.includes('gk') || searchStr.includes('cgl');

  let defaultCategory = subjectName || (isEngineering ? 'Engineering Sciences' : 'Comprehensive Syllabus');
  let defaultOverview = `Is class me "${cleanTitle || lectureTitle}" topic ko bilkul basic foundation se exam standard tak complete explain kiya gaya hai. Concept clarity aur application orientation is lecture ka main objective hai.`;
  
  let defaultPoints = [
    `"${cleanTitle || 'Current Topic'}" ke theoretical foundations aur core principles.`,
    'Step-by-step concept illustration aur exam point-of-view important facts.',
    'Class notes ke sath previous year questions (PYQs) solve karne ka smart approach.'
  ];

  let defaultExamTip = isGovt
    ? 'Is lecture ke main keywords aur dates/formulas ko apne short revision notes me highlight karein — direct factual questions ke liye yeh section high-weightage hai.'
    : 'Semester aur internal examination me numerical clarity aur diagrammatic representation se full marks secure kiye ja sakte hain.';

  return {
    overview: defaultOverview,
    keyPoints: defaultPoints,
    examTip: defaultExamTip,
    categoryTag: defaultCategory,
    estimatedReadTime: 'Comprehensive Module',
  };
}
