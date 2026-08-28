const fs = require('fs');
const path = require('path');

function parseMarkdownLinks() {
  const albaPath = path.join(__dirname, '..', 'Mechanical_Engineering_UMEED_Batch_Organized_Links.md');
  const estePath = path.join(__dirname, '..', 'PUBLICO_Mechanical_Engineering_UMEED_Batch_Organized.md');

  const albaText = fs.readFileSync(albaPath, 'utf8');
  const esteText = fs.readFileSync(estePath, 'utf8');

  function parseFile(text, isEste = false) {
    const blocks = text.split(/\n(?=##\s+\d+\.)/);
    const map = new Map();
    for (const b of blocks) {
      const hm = b.match(/^##\s+(\d+)\.\s+(.*)/m);
      if (!hm) continue;
      const num = parseInt(hm[1], 10);
      let title = hm[2].trim();
      const tm = b.match(/\*\*Type:\*\*\s*(.*)/i);
      const type = (tm ? tm[1].trim().toLowerCase() : 'video').includes('pdf') ? 'pdf' : 'video';
      const dlm = b.match(/\*\*Download:\*\*\s*(https?:\/\/[^\s\n]+)/i);
      const stm = b.match(/\*\*Stream:\*\*\s*(https?:\/\/[^\s\n]+)/i);

      let subject = 'General';
      let unit = '';
      if (isEste) {
        // e.g. Engineering Mathematics-II/Unit-1] Lect-01 Basics of Complex Number
        // or Mechanical EngineeringUMEED BATCHBEU] Live Class Schedule.png
        const bracket = title.match(/^\[?([^\]]+)\]\s*(.*)/);
        if (bracket) {
          const prefix = bracket[1].trim();
          title = bracket[2].trim();
          if (prefix.includes('Engineering Mathematics-II')) {
            subject = 'Engineering Mathematics-II';
            const unitMatch = prefix.match(/Unit\s*[-–]?\s*0*(\d+)/i);
            if (unitMatch) unit = 'Unit ' + parseInt(unitMatch[1], 10);
          } else {
            subject = 'General';
          }
        }
      }

      map.set(num, {
        num,
        title,
        type,
        subject,
        unit,
        download: dlm ? dlm[1] : null,
        stream: stm ? stm[1] : null
      });
    }
    return map;
  }

  const albaMap = parseFile(albaText, false);
  const esteMap = parseFile(esteText, true);

  console.log(`Parsed ALBA: ${albaMap.size} items, ESTE: ${esteMap.size} items`);

  const merged = [];
  for (let i = 1; i <= 110; i++) {
    const a = albaMap.get(i);
    const e = esteMap.get(i);
    if (!a && !e) continue;

    const numPadded = String(i).padStart(3, '0');
    let label = e?.title || a?.title || `Item ${numPadded}`;

    // Clean file extensions from label
    label = label.replace(/\.(pdf|png|mp4)$/i, '');

    // Format lecture titles consistently: "Lect-01", "Lect 01", "Lect - 01" -> "Lecture 01 •"
    label = label.replace(/Lect\s*[-–]?\s*0*(\d+)/i, (m, d) => `Lecture ${d.padStart(2, '0')} •`);

    // Clean any awkward double bullets or trailing bullets
    label = label.replace(/•\s*•/g, '•').replace(/•\s*$/, '').trim();

    // If it's a PDF note for a lecture, e.g. "Lecture 01 •" without description -> "Lecture 01 • Notes"
    const type = (a?.type || e?.type || 'video');
    if (type === 'pdf') {
      if (/Lecture\s+\d+\s*•?\s*$/i.test(label)) {
        label = label.replace(/•?\s*$/, '• Class Notes');
      }
    }

    // Determine subject & unit
    let subject = e?.subject || 'Engineering Mathematics-II';
    let topic = e?.unit || '';

    // If unit missing from ESTE (e.g. items 93..98 and 106..110), infer from context
    if (!topic && i >= 3 && i <= 34) { topic = 'Unit 1'; }
    else if (!topic && i >= 35 && i <= 60) { topic = 'Unit 2'; }
    else if (!topic && i >= 61 && i <= 72) { topic = 'Unit 3'; }
    else if (!topic && i >= 73 && i <= 96) { topic = 'Unit 4'; }
    else if (!topic && i >= 97 && i <= 110) { topic = 'Unit 6'; }

    if (i <= 2) {
      subject = 'General';
      topic = '';
    } else {
      subject = topic ? `Engineering Mathematics-II (${topic})` : 'Engineering Mathematics-II';
    }

    // Build dual servers (ALBA & ESTE) without emojis
    const servers = [];
    if (a?.download || a?.stream) {
      const dlUrl = a.download || a.stream.replace('/0:/stream/', '/0:/dl/');
      const stmUrl = a.stream || a.download.replace('/0:/dl/', '/0:/stream/');
      servers.push({
        name: 'ALBA',
        url: dlUrl,
        downloadUrl: dlUrl,
        streamUrl: stmUrl,
        type: type
      });
    }
    if (e?.download || e?.stream) {
      const matchId = (e.download || e.stream).match(/(?:[?&](?:dl|watch)=|dl\/)([a-zA-Z0-9]+)/);
      const esteDirectUrl = matchId ? `https://fs1qydv17g1-161-162e5df28a45.herokuapp.com/dl/${matchId[1]}` : (e.download || e.stream);
      const publicoPageUrl = matchId ? `https://publicbotshub.blogspot.com/p/file-stream-bot.html?dl=${matchId[1]}` : (e.download || esteDirectUrl);
      servers.push({
        name: 'ESTE',
        url: esteDirectUrl,
        downloadUrl: publicoPageUrl,
        type: type
      });
    }

    const primaryUrl = servers[0]?.url || '';

    merged.push({
      id: `mech-umeed-${numPadded}`,
      label: `${numPadded}. ${label}`,
      url: primaryUrl,
      downloadUrl: primaryUrl,
      type: type,
      subject: subject,
      topic: topic || undefined,
      category: type === 'pdf' ? 'pdfs' : 'videos',
      servers: servers
    });
  }

  console.log(`Merged ${merged.length} items for Mechanical Engineering (UMEED Batch)`);

  // Update coursesData.json
  const coursesJsonPath = path.join(__dirname, '..', 'src', 'lib', 'coursesData.json');
  const courses = JSON.parse(fs.readFileSync(coursesJsonPath, 'utf8'));

  const beuCourse = courses.find((c) => c.id === 'beu-1st-year');
  if (!beuCourse) {
    throw new Error('Course beu-1st-year not found');
  }

  if (!beuCourse.tabs) {
    beuCourse.tabs = [];
  }

  const existingTabIdx = beuCourse.tabs.findIndex((t) => t.id === 'mechanical-umeed');
  const newTab = {
    id: 'mechanical-umeed',
    label: 'Mechanical Engineering (UMEED)',
    items: merged
  };

  if (existingTabIdx >= 0) {
    beuCourse.tabs[existingTabIdx] = newTab;
    console.log('Updated existing mechanical-umeed tab');
  } else {
    beuCourse.tabs.push(newTab);
    console.log('Appended new mechanical-umeed tab to beu-1st-year');
  }

  fs.writeFileSync(coursesJsonPath, JSON.stringify(courses, null, 2), 'utf8');
  console.log('coursesData.json updated successfully!');
  console.log('beu-1st-year tabs now:');
  beuCourse.tabs.forEach((t) => console.log(`  - ${t.id} (${t.label}): ${t.items.length} items`));
}

parseMarkdownLinks();
