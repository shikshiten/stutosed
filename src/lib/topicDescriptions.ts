/**
 * Dynamic Educational Topic Description Engine
 * Automatically generates syllabus-aligned topic summaries, core concepts,
 * and high-yield exam tips in professional English for any lecture title.
 */

export interface TopicDescription {
  overview: string;
  keyPoints: string[];
  examTip: string;
  categoryTag: string;
  estimatedReadTime: string;
}

// Knowledge rules mapped to common exam and syllabus keywords
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
    getOverview: () =>
      'This lecture provides a comprehensive study of cell structure, historical discovery milestones, and cell organelles (Mitochondria, Nucleus, Ribosomes, and Golgi apparatus) essential for competitive and academic examinations.',
    keyPoints: [
      'Key structural and functional differences between Prokaryotic and Eukaryotic cells.',
      'The Powerhouse of the Cell (Mitochondria) and cellular ATP generation mechanisms.',
      'Cell wall vs. cell membrane permeability, lipid bilayers, and transport pathways.',
      'Endoplasmic reticulum, Golgi complex, and protein synthesis workflows.',
    ],
    examTip:
      'Frequently tested items in SSC CGL, CHSL, and CDS include organelle discovery scientists and nomenclature (e.g., Lysosomes as the "Suicidal Bags of the Cell").',
  },
  {
    keywords: ['tissue', 'utak', 'xylem', 'phloem', 'epithelial'],
    category: 'Histology & Tissues',
    getOverview: () =>
      'Detailed breakdown of Plant and Animal Tissues — distinguishing Meristematic from Permanent tissues, alongside epithelial, muscular, and connective organ systems.',
    keyPoints: [
      'Xylem and Phloem: Vascular transport networks for water and organic nutrients.',
      'Meristematic tissues: Apical, lateral, and intercalary cellular division mechanisms.',
      'Animal tissue taxonomy: Epithelial barriers, muscle fibers, and connective matrix (blood and bone).',
    ],
    examTip:
      'Matching and assertion-reason questions frequently test the functional distinction between simple and complex permanent plant tissues.',
  },
  {
    keywords: ['vitamin', 'nutrition', 'poshan', 'disease', 'rog'],
    category: 'Human Health & Nutrition',
    getOverview: () =>
      'Comprehensive review of essential vitamins, macronutrients, nutritional deficiencies, and major bacterial, viral, and protozoan pathogens.',
    keyPoints: [
      'Fat-soluble (A, D, E, K) vs. Water-soluble (B-complex, C) vitamin classifications.',
      'Chemical nomenclatures and hallmark deficiency syndromes (Scurvy, Rickets, Beriberi).',
      'Pathogenic disease taxonomy: Transmission vectors, incubation periods, and preventive immunization.',
    ],
    examTip:
      'Always memorize the scientific chemical names of vitamins and their corresponding clinical deficiency disorders for guaranteed exam scoring.',
  },

  // ── POLITY ──
  {
    keywords: ['article', 'anuchhed', 'preamble', 'prastavana', 'constitution', 'samvidhan'],
    category: 'Indian Polity',
    getOverview: () =>
      'An in-depth legal and conceptual analysis of the Indian Constitution, the basic structure doctrine, the Preamble, and foundational constitutional provisions.',
    keyPoints: [
      'Preamble terminology: Sovereign, Socialist, Secular, Democratic, and Republic keywords.',
      'The 42nd Constitutional Amendment Act of 1976 and landmark Supreme Court rulings.',
      'Constituent Assembly drafting timeline, major committees, and constitutional adoption milestones.',
    ],
    examTip:
      'Memorize the exact sequence of philosophical terms in the Preamble and the territorial boundaries codified under Articles 1 through 4.',
  },
  {
    keywords: ['fundamental right', 'mool adhikar', 'fr ', 'dpsp', 'fundamental duty'],
    category: 'Constitutional Rights',
    getOverview: () =>
      'Exhaustive exam-oriented breakdown of Fundamental Rights (Articles 12–35, Part III), Directive Principles of State Policy (Part IV), and Fundamental Duties (Part IV-A).',
    keyPoints: [
      'The 6 core Fundamental Rights: Equality, Freedom, Protection, Religion, Culture, and Remedies.',
      'Article 32: Constitutional remedies and the five prerogative high court / supreme court writs.',
      'Article 21: Right to Life and Personal Liberty and its evolving judicial scope.',
    ],
    examTip:
      'Master the definitions and scope of the 5 constitutional writs (Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo-Warranto) under Articles 32 and 226.',
  },
  {
    keywords: ['parliament', 'sansad', 'president', 'rashtrapati', 'prime minister', 'lok sabha', 'rajya sabha'],
    category: 'Union Executive & Legislature',
    getOverview: () =>
      'Detailed study of the Union Executive — the President, Prime Minister, Council of Ministers, and the bicameral Parliament’s legislative functions.',
    keyPoints: [
      'Presidential elections, ordinance promulgation powers (Article 123), and impeachment (Article 61).',
      'Lok Sabha vs. Rajya Sabha: Jurisdiction, tenure, money bills (Article 110), and financial bills.',
      'Joint sitting provisions (Article 108) and presiding authority rules.',
    ],
    examTip:
      'Focus closely on the President’s pardoning powers under Article 72 and the Lok Sabha Speaker’s exclusive certification authority over Money Bills.',
  },

  // ── HISTORY ──
  {
    keywords: ['indus', 'harappa', 'mohenjo', 'vedic', 'sindhu'],
    category: 'Ancient Indian History',
    getOverview: () =>
      'Systematic examination of the Indus Valley Civilization (IVC) town planning, drainage networks, archaeological excavations, and Early/Later Vedic literature.',
    keyPoints: [
      'Major excavated urban centers: The Great Bath (Mohenjodaro), Dockyard (Lothal), and Kalibangan.',
      'IVC trade routes, bronze metallurgy, pictographic seals, and socioeconomic hierarchy.',
      'Vedic literature: The four Vedas, Brahmanas, Upanishads, and early socio-religious structures.',
    ],
    examTip:
      'Pay close attention to Harappan site locations alongside their respective riverbanks (e.g., Harappa on the Ravi, Mohenjodaro on the Indus) and archaeological excavators.',
  },
  {
    keywords: ['maurya', 'ashoka', 'gupta', 'buddhism', 'jainism'],
    category: 'Empire & Religious Movements',
    getOverview: () =>
      'Historical survey of Buddhism, Jainism, the Mauryan Empire under Chandragupta and Ashoka, and the Golden Age of the Gupta Dynasty.',
    keyPoints: [
      'The Four Buddhist Councils: Venues, patron rulers, and presiding Buddhist scholars.',
      'Ashokan Major and Minor Rock Edicts: The Dhamma policy and Kalinga campaign timeline.',
      'Gupta administrative governance, classical literature (Kalidasa), and scientific treatises (Aryabhata).',
    ],
    examTip:
      'The Four Buddhist Councils (Venue, Ruler, Presiding Monk) are among the most frequently recurring multiple-choice questions in competitive examinations.',
  },
  {
    keywords: ['1857', 'gandhi', 'congress', 'inc', 'freedom', 'movement', 'viceroy'],
    category: 'Modern Indian History',
    getOverview: () =>
      'Comprehensive walkthrough of the Indian National Movement — the 1857 Revolt, Indian National Congress sessions, Gandhian mass satyagrahas, and the road to independence.',
    keyPoints: [
      'Outbreak of the 1857 Revolt: Key leadership hubs (Kunwar Singh, Rani Lakshmibai, Nana Saheb).',
      'Non-Cooperation (1920), Civil Disobedience (1930), and the Quit India Movement (1942).',
      'Landmark Congress sessions: Surat Split (1907), Lucknow Pact (1916), and Lahore Session (1929).',
    ],
    examTip:
      'Memorize the chronology of British viceroys, legislative reforms, and significant freedom struggle resolutions like Poorna Swaraj (1929).',
  },

  // ── GEOGRAPHY ──
  {
    keywords: ['river', 'nadi', 'drainage', 'himalaya', 'mountain', 'dam', 'lake'],
    category: 'Indian Geography',
    getOverview: () =>
      'Complete geographic analysis of Indian drainage basins (Himalayan vs. Peninsular systems), major river tributaries, glaciers, and multipurpose river valley projects.',
    keyPoints: [
      'Indus, Ganga, and Brahmaputra river networks with left-bank and right-bank tributary mapping.',
      'East-flowing (Godavari, Krishna, Cauvery) vs. West-flowing (Narmada, Tapti) rift valley rivers.',
      'Key national dams, reservoirs, and mountain passes across the Himalayan arc.',
    ],
    examTip:
      'Tributary classification (Left Bank vs. Right Bank) and river origins are tested year after year in state and central examinations.',
  },

  // ── ENGINEERING & MATHEMATICS ──
  {
    keywords: ['integration', 'calculus', 'differential', 'derivative', 'matrix', 'matrices'],
    category: 'Engineering Mathematics',
    getOverview: () =>
      'Advanced engineering mathematical methods — differential and integral calculus, multivariable transformations, linear algebra, and boundary value solutions.',
    keyPoints: [
      'Standard integration techniques, substitutions, and definite integral properties.',
      'Eigenvalues, eigenvectors, and Cayley-Hamilton theorem matrix applications.',
      'Higher-order linear differential equations with constant and variable coefficients.',
    ],
    examTip:
      'Verify Cayley-Hamilton steps carefully to score full marks in high-weightage semester and competitive engineering exams.',
  },
  {
    keywords: ['physics', 'optics', 'laser', 'quantum', 'fiber', 'wave'],
    category: 'Engineering Physics',
    getOverview: () =>
      'Applied engineering physics covering wave optics, thin-film interference, diffraction, quantum tunneling, and laser propagation in optical waveguides.',
    keyPoints: [
      'Interference by division of amplitude and the Newton’s rings experimental derivation.',
      'Laser principles: Stimulated emission, population inversion, and optical pumping mechanisms.',
      'Optical fibers: Total internal reflection, numerical aperture, and fractional index calculations.',
    ],
    examTip:
      'Newton’s ring diameter derivations and comparative energy diagrams of 3-level vs. 4-level laser systems are essential semester exam topics.',
  },
  {
    keywords: ['thermo', 'entropy', 'heat', 'engine', 'carnot', 'cycle'],
    category: 'Thermal Engineering',
    getOverview: () =>
      'Foundational laws of thermodynamics, Carnot engine efficiency, entropy generation, steady-flow energy equations (SFEE), and power gas cycles.',
    keyPoints: [
      'Zeroth, First, Second, and Third Laws of Thermodynamics.',
      'Reversible vs. irreversible processes, Carnot theorem, and Clausius inequality.',
      'Vapor and gas power cycles: Rankine, Otto, Diesel, and Dual cycles.',
    ],
    examTip:
      'Numerical calculations on Carnot heat pump COP and Clausius entropy integrals are frequent scoring areas.',
  },

  // ── QUANT & REASONING ──
  {
    keywords: ['percentage', 'profit', 'loss', 'discount', 'ratio', 'proportion'],
    category: 'Commercial Arithmetic',
    getOverview: () =>
      'High-speed quantitative arithmetic methods — percentages, cost vs. selling price relationships, successive discounts, and proportional ratios for rapid solving.',
    keyPoints: [
      'Fraction-to-percentage conversion fundamentals (1/2 through 1/20 equivalents).',
      'Net percentage variation formula: a + b + (ab/100).',
      'Interlinking marked price, discount rates, and net profit margins.',
    ],
    examTip:
      'Daily mental revision of fraction-to-percentage tables significantly boosts calculation speed and reduces rough work time.',
  },
  {
    keywords: ['syllogism', 'reasoning', 'coding', 'series', 'blood relation', 'direction'],
    category: 'Logical Reasoning',
    getOverview: () =>
      'Systematic analytical reasoning strategies — Venn diagram containment for syllogisms, alphanumeric coding, compass direction sense, and family tree mapping.',
    keyPoints: [
      'Deductive logic rules for universal ("All", "No") and particular ("Some", "Some Not") statements.',
      'Alphabet positional rank mappings (EJOTY rule) and reverse letter pairings.',
      'Standard genealogical notation for rapid family tree deduction.',
    ],
    examTip:
      'Always test "Possibility" cases in syllogisms using universal Venn diagram inclusion rules to avoid false negatives.',
  },
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
 * Generate syllabus-aligned topic description dynamically in professional English
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
  const isEngineering =
    searchStr.includes('beu') || searchStr.includes('b.tech') || searchStr.includes('engineering');
  const isGovt =
    searchStr.includes('ssc') || searchStr.includes('parmar') || searchStr.includes('gk') || searchStr.includes('cgl');

  const defaultCategory = subjectName || (isEngineering ? 'Engineering Sciences' : 'Comprehensive Syllabus');
  const defaultOverview = `This lecture provides a structured, syllabus-aligned conceptual breakdown of "${cleanTitle || lectureTitle}". It systematically covers foundational principles through advanced examination standards to ensure concept clarity and problem-solving readiness.`;

  const defaultPoints = [
    `Core theoretical frameworks, fundamental definitions, and guiding principles of "${cleanTitle || 'Current Topic'}".`,
    'Step-by-step concept illustrations with emphasis on high-yield exam takeaways.',
    'Effective techniques for solving previous years’ exam questions (PYQs) alongside lecture notes.',
  ];

  const defaultExamTip = isGovt
    ? 'Highlight critical keywords, factual dates, and key formulas in your short revision notes — this section carries high weightage in objective questions.'
    : 'In university semester exams, focus on clear step-by-step numerical working and well-labeled diagrams to secure full marks.';

  return {
    overview: defaultOverview,
    keyPoints: defaultPoints,
    examTip: defaultExamTip,
    categoryTag: defaultCategory,
    estimatedReadTime: 'Comprehensive Module',
  };
}
