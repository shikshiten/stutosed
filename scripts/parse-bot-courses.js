const fs = require('fs');
const path = require('path');

// Parser helper for any pair of ALBA & ESTE markdown files
function parseBotMarkdownPair(albaPath, estePath, options = {}) {
  const albaText = fs.existsSync(albaPath) ? fs.readFileSync(albaPath, 'utf8') : '';
  const esteText = fs.existsSync(estePath) ? fs.readFileSync(estePath, 'utf8') : '';

  function parseFile(text, isEste = false) {
    const blocks = text.split(/\n(?=###?\s+\d+\.)/);
    const map = new Map();
    for (const b of blocks) {
      const hm = b.match(/^###?\s+(\d+)\.\s+(.*)/m);
      if (!hm) continue;
      const num = parseInt(hm[1], 10);
      let title = hm[2].trim();
      const tm = b.match(/\*\*Type:\*\*\s*(.*)/i);
      const type = (tm ? tm[1].trim().toLowerCase() : 'video').includes('pdf') || title.toLowerCase().endsWith('.pdf') || title.toLowerCase().endsWith('.png') ? 'pdf' : 'video';
      const dlm = b.match(/\*\*Download:\*\*\s*(https?:\/\/[^\s\n]+)/i);
      const stm = b.match(/\*\*Stream:\*\*\s*(https?:\/\/[^\s\n]+)/i);

      let subject = options.defaultSubject || 'General';
      let unit = '';

      // Check bracket or slash format: e.g. [Engineering Physics/Unit-01 Frame of Reference] Lect - 01 ...
      const bracketMatch = title.match(/^\[?([^\]]+)\]\s*(.*)/);
      if (bracketMatch) {
        const prefix = bracketMatch[1].trim();
        title = bracketMatch[2].trim();
        const parts = prefix.split('/');
        if (parts.length > 1) {
          subject = parts[0].trim();
          unit = parts.slice(1).join(' / ').trim();
        } else {
          subject = prefix;
        }
      }

      map.set(num, {
        num,
        title,
        type,
        subject,
        unit,
        download: dlm ? dlm[1].trim() : null,
        stream: stm ? stm[1].trim() : null,
      });
    }
    return map;
  }

  const albaMap = parseFile(albaText, false);
  const esteMap = parseFile(esteText, true);

  // Collect all unique item numbers in order
  const allNums = Array.from(new Set([...albaMap.keys(), ...esteMap.keys()])).sort((a, b) => a - b);
  const items = [];

  for (const num of allNums) {
    const a = albaMap.get(num);
    const e = esteMap.get(num);
    const numPadded = String(num).padStart(3, '0');

    let rawTitle = e?.title || a?.title || `Item ${numPadded}`;
    // Clean file extensions
    let cleanTitle = rawTitle.replace(/\.(pdf|png|mp4|jpg)$/i, '');
    // Standardize Lect / Lecture
    cleanTitle = cleanTitle.replace(/lect(?:ure)?\s*[-–]?\s*0*(\d+)/i, (m, d) => `Lecture ${d.padStart(2, '0')} •`);
    // Clean double bullets or trailing bullets
    cleanTitle = cleanTitle.replace(/•\s*•/g, '•').replace(/•\s*$/, '').trim();

    const type = a?.type || e?.type || 'video';
    if (type === 'pdf') {
      if (/Lecture\s+\d+\s*•?\s*$/i.test(cleanTitle)) {
        cleanTitle = cleanTitle.replace(/•?\s*$/, '• Class Notes');
      }
    }

    let subject = options.inferSubject ? options.inferSubject(cleanTitle, e?.subject || a?.subject, num) : (e?.subject || a?.subject || options.defaultSubject || 'General');

    // Build Dual Servers (ALBA & ESTE)
    const servers = [];
    if (a?.download || a?.stream) {
      const dlUrl = a.download || a.stream.replace('/0:/stream/', '/0:/dl/');
      const stmUrl = a.stream || a.download.replace('/0:/dl/', '/0:/stream/');
      servers.push({
        name: 'ALBA',
        url: dlUrl,
        downloadUrl: dlUrl,
        streamUrl: stmUrl,
        type: type,
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
        type: type,
      });
    }

    const primaryUrl = servers[0]?.url || a?.download || a?.stream || e?.download || e?.stream || '';

    items.push({
      id: `${options.idPrefix}-${numPadded}`,
      label: `${numPadded}. ${cleanTitle}`,
      url: primaryUrl,
      downloadUrl: primaryUrl,
      type: type,
      subject: subject,
      category: type === 'pdf' ? 'pdfs' : 'videos',
      servers: servers,
    });
  }

  return items;
}

module.exports = { parseBotMarkdownPair };
