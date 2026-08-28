const fs = require('fs');
const path = require('path');
const { parseBotMarkdownPair } = require('./parse-bot-courses');

function buildAllBEUCourses() {
  const baseBotDir = path.join(__dirname, '..', 'Links of coures by bot');
  const coursesJsonPath = path.join(__dirname, '..', 'src', 'lib', 'coursesData.json');
  const courses = JSON.parse(fs.readFileSync(coursesJsonPath, 'utf8'));

  const beuCourse = courses.find((c) => c.id === 'beu-1st-year');
  if (!beuCourse) {
    throw new Error('Course beu-1st-year not found');
  }

  // Preserve existing ece-ee-eee & engineering-chemistry tabs
  const existingEceTab = beuCourse.tabs.find((t) => t.id === 'ece-ee-eee');
  const existingChemTab = beuCourse.tabs.find((t) => t.id === 'engineering-chemistry');

  // 1. Parse Original Mechanical Engineering (UMEED) - 110 items
  console.log('\n--- Parsing Original Mechanical Engineering (UMEED) ---');
  const origMechAlba = path.join(baseBotDir, 'Engineering mathematics 2', 'ALBA_CODE_Mechanical_Engineering_UMEED_Complete_Link_List.md');
  const origMechEste = path.join(baseBotDir, 'Engineering mathematics 2', 'ESTE_CODE_PUBLICO_Mechanical_Engineering_FINAL.md');
  const origMechItems = parseBotMarkdownPair(origMechAlba, origMechEste, {
    idPrefix: 'mech-umeed',
    defaultSubject: 'Mechanical Engineering (UMEED)',
    inferSubject: (title, origSubject, num) => {
      if (num <= 2) return 'General';
      if (num >= 3 && num <= 34) return 'Engineering Mathematics-II (Unit 1)';
      if (num >= 35 && num <= 60) return 'Engineering Mathematics-II (Unit 2)';
      if (num >= 61 && num <= 72) return 'Engineering Mathematics-II (Unit 3)';
      if (num >= 73 && num <= 96) return 'Engineering Mathematics-II (Unit 4)';
      if (num >= 97 && num <= 110) return 'Engineering Mathematics-II (Unit 6)';
      return 'Engineering Mathematics-II';
    },
  });
  console.log(`Original Mechanical items parsed: ${origMechItems.length}`);

  // 2. Parse New Separate Mechanical Engineering Full Batch - 217 items
  console.log('\n--- Parsing New Mechanical Engineering (Full Batch) ---');
  const fullMechAlba = path.join(baseBotDir, 'mechanical engineering umeed batch', 'ALBA_Mechanical_Engineering_UMEED_Organized_FINAL.md');
  const fullMechEste = path.join(baseBotDir, 'mechanical engineering umeed batch', 'ESTE_Mechanical_Engineering_UMEED_SeparateBot_FINAL.md');
  const fullMechItems = parseBotMarkdownPair(fullMechAlba, fullMechEste, {
    idPrefix: 'mech-full',
    defaultSubject: 'Mechanical Engineering',
    inferSubject: (title, origSubject, num) => {
      const lower = title.toLowerCase();
      if (lower.includes('welding') || lower.includes('brazing') || lower.includes('soldering') || lower.includes('workshop') || lower.includes('wood') || lower.includes('joints')) {
        return 'Workshop & Manufacturing';
      }
      if (lower.includes('complex') || lower.includes('analytic') || lower.includes('fourier') || lower.includes('taylor') || lower.includes('residue') || lower.includes('integral') || lower.includes('series')) {
        return 'Engineering Mathematics-II';
      }
      if (lower.includes('c programming') || lower.includes('algorithm') || lower.includes('pseudo') || lower.includes('structure') || lower.includes('union') || lower.includes('file')) {
        return 'Programming for Problem Solving';
      }
      return 'Elements of Mechanical Engineering';
    },
  });
  console.log(`Full Mechanical items parsed: ${fullMechItems.length}`);

  // 3. Parse Civil Engineering (UMEED) - 201 items
  console.log('\n--- Parsing Civil Engineering (UMEED) ---');
  const civilAlba = path.join(baseBotDir, 'civil engineering btech umeed batch', 'ALBA_Civil_Engineering_UMEED_Organized_FINAL.md');
  const civilEste = path.join(baseBotDir, 'civil engineering btech umeed batch', 'ESTE_PUBLICO_Civil_Engineering_200_202.md');
  const civilItems = parseBotMarkdownPair(civilAlba, civilEste, {
    idPrefix: 'civil-umeed',
    defaultSubject: 'Civil Engineering',
    inferSubject: (title, origSubject, num) => {
      const lower = title.toLowerCase();
      if (lower.includes('complex') || lower.includes('analytic') || lower.includes('fourier') || lower.includes('taylor') || lower.includes('residue') || lower.includes('integral') || lower.includes('series') || lower.includes('cauchey')) {
        return 'Engineering Mathematics-II';
      }
      if (lower.includes('algorithm') || lower.includes('pseudo') || lower.includes('computer') || lower.includes('structure') || lower.includes('union') || lower.includes('file') || lower.includes('pointer')) {
        return 'Programming for Problem Solving';
      }
      if (lower.includes('soldering') || lower.includes('wiring') || lower.includes('wood') || lower.includes('seasoning') || lower.includes('kvl') || lower.includes('kcl')) {
        return 'Basic Electrical & Workshop';
      }
      return 'Civil Engineering Core';
    },
  });
  console.log(`Civil items parsed: ${civilItems.length}`);

  // 4. Parse CSE (Computer Science Engineering) (UMEED) - 143 items
  console.log('\n--- Parsing CSE (UMEED) ---');
  const cseAlba = path.join(baseBotDir, 'cse btech umeed batch', 'ALBA_CSE_UMEED_Organized_FINAL.md');
  const cseEste = path.join(baseBotDir, 'cse btech umeed batch', 'ESTE_PUBLICO_CSE_UMEED_Organized.md');
  const cseItems = parseBotMarkdownPair(cseAlba, cseEste, {
    idPrefix: 'cse-umeed',
    defaultSubject: 'Computer Science Engineering',
    inferSubject: (title, origSubject, num) => {
      const lower = title.toLowerCase();
      if (lower.includes('chemistry') || lower.includes('radiation') || lower.includes('photoelectric') || lower.includes('orbital') || lower.includes('vsepr') || lower.includes('spectroscopy') || lower.includes('theory')) {
        return 'Engineering Chemistry';
      }
      if (lower.includes('differential') || lower.includes('euler') || lower.includes('series') || lower.includes('ratio test') || lower.includes('comparison') || lower.includes('integral test') || lower.includes('cauchy') || lower.includes('seque')) {
        return 'Engineering Mathematics';
      }
      if (lower.includes('english') || lower.includes('prefix') || lower.includes('suffix') || lower.includes('synonyms') || lower.includes('tense') || lower.includes('voice') || lower.includes('writing') || lower.includes('7cs') || lower.includes('clause') || lower.includes('phrase')) {
        return 'English & Communication Skills';
      }
      return 'Computer Science Core';
    },
  });
  console.log(`CSE items parsed: ${cseItems.length}`);

  // 5. Parse Engineering Physics (UMEED) - 61 items
  console.log('\n--- Parsing Engineering Physics (UMEED) ---');
  const physAlba = path.join(baseBotDir, 'Engineering physics', 'ALBA_Engineering_Physics_UMEED_Organized.md');
  const physEste = path.join(baseBotDir, 'Engineering physics', 'ESTE_PUBLICO_Engineering_Physics_UMEED_FINAL.md');
  const physItems = parseBotMarkdownPair(physAlba, physEste, {
    idPrefix: 'phys-umeed',
    defaultSubject: 'Engineering Physics',
    inferSubject: (title, origSubject, num) => {
      if (origSubject && origSubject !== 'General') {
        return origSubject;
      }
      const lower = title.toLowerCase();
      if (lower.includes('frame of reference') || lower.includes('pseudo forces')) return 'Physics (Unit 1 • Frame of Reference)';
      if (lower.includes('oscillation') || lower.includes('harmonic')) return 'Physics (Unit 2 • Oscillations)';
      if (lower.includes('optics') || lower.includes('interference') || lower.includes('diffraction')) return 'Physics (Unit 3 • Optics)';
      if (lower.includes('laser') || lower.includes('ruby')) return 'Physics (Unit 4 • Laser)';
      if (lower.includes('quantum') || lower.includes('davvison') || lower.includes('schrodinger')) return 'Physics (Unit 5 • Quantum Mechanics)';
      if (lower.includes('problem solving') || lower.includes('programming')) return 'Programming for Problem Solving';
      return 'Engineering Physics';
    },
  });
  console.log(`Physics items parsed: ${physItems.length}`);

  // 6. Parse Engineering Mathematics-II (UMEED) - 110 items
  console.log('\n--- Parsing Engineering Mathematics-II (UMEED) ---');
  const math2Alba = path.join(baseBotDir, 'Engineering mathematics 2', 'ALBA_CODE_Mechanical_Engineering_UMEED_Complete_Link_List.md');
  const math2Este = path.join(baseBotDir, 'Engineering mathematics 2', 'ESTE_CODE_PUBLICO_Mechanical_Engineering_FINAL.md');
  const math2Items = parseBotMarkdownPair(math2Alba, math2Este, {
    idPrefix: 'math2-umeed',
    defaultSubject: 'Engineering Mathematics-II',
    inferSubject: (title, origSubject, num) => {
      if (num <= 2) return 'General';
      if (num >= 3 && num <= 34) return 'Mathematics-II (Unit 1 • Complex Numbers)';
      if (num >= 35 && num <= 60) return 'Mathematics-II (Unit 2 • Differential Equations)';
      if (num >= 61 && num <= 72) return 'Mathematics-II (Unit 3 • Partial Differential Equations)';
      if (num >= 73 && num <= 96) return 'Mathematics-II (Unit 4 • Numerical Methods)';
      if (num >= 97 && num <= 110) return 'Mathematics-II (Unit 6 • Fourier Series)';
      return 'Engineering Mathematics-II';
    },
  });
  console.log(`Maths-2 items parsed: ${math2Items.length}`);

  // Assemble full tabs for beu-1st-year
  const newTabs = [
    {
      id: 'ece-ee-eee',
      label: 'EE / ECE / EEE',
      subname: 'Electronics & Electrical',
      thumb: '/thumbnails/beu_ece_ee_eee.jpg',
      items: existingEceTab ? existingEceTab.items : [],
    },
    {
      id: 'engineering-chemistry',
      label: 'Engineering Chemistry',
      subname: 'B.Tech 1st Year Chemistry',
      thumb: '/thumbnails/beu_eng_chemistry.jpg',
      items: existingChemTab ? existingChemTab.items : [],
    },
    {
      id: 'mechanical-umeed',
      label: 'Mechanical Engineering (UMEED)',
      subname: 'Mechanical Core & Maths-2',
      thumb: '/thumbnails/beu_mech_umeed.jpg',
      items: origMechItems,
    },
    {
      id: 'mechanical-full',
      label: 'Mechanical Engineering (Full Batch)',
      subname: 'Mechanical 2nd Sem (217 Lectures)',
      thumb: '/thumbnails/beu_mech_umeed.jpg',
      items: fullMechItems,
    },
    {
      id: 'civil-umeed',
      label: 'Civil Engineering (UMEED)',
      subname: 'Civil 2nd Semester',
      thumb: '/thumbnails/beu_civil_umeed.jpg',
      items: civilItems,
    },
    {
      id: 'cse-umeed',
      label: 'CSE (UMEED)',
      subname: 'Computer Science 2nd Semester',
      thumb: '/thumbnails/beu_cse_umeed.jpg',
      items: cseItems,
    },
    {
      id: 'engineering-physics',
      label: 'Engineering Physics (UMEED)',
      subname: 'Applied Physics & Units',
      thumb: '/thumbnails/beu_engineering_physics.jpg',
      items: physItems,
    },
    {
      id: 'engineering-mathematics-2',
      label: 'Engineering Mathematics-II (UMEED)',
      subname: 'Maths-II (All Units & Notes)',
      thumb: '/thumbnails/beu_engineering_mathematics_2.jpg',
      items: math2Items,
    },
  ];

  beuCourse.tabs = newTabs;

  fs.writeFileSync(coursesJsonPath, JSON.stringify(courses, null, 2), 'utf8');

  console.log('\n========================================');
  console.log('✅ ALL BEU 1ST YEAR COURSES & THUMBNAILS UPDATED');
  console.log('========================================');
  beuCourse.tabs.forEach((t) => {
    console.log(`Tab: [${t.id}] -> "${t.label}" (${t.items.length} items) | thumb: ${t.thumb}`);
  });
}

buildAllBEUCourses();
