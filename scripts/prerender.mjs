/**
 * Post-build prerender for GitHub Pages.
 *
 * The app is a SPA, but GitHub Pages has no server-side rewrites, so every
 * route other than `/` used to return 404 (see vercel.json — dead config on
 * the current host). This script turns the built `dist/index.html` into real
 * static pages for the content routes so crawlers and AI systems get a 200
 * with the main content in the initial HTML. React still boots on top and
 * replaces the static fallback, exactly like it does on the homepage.
 *
 * It also:
 *  - refreshes sitemap.xml lastmod to the build date
 *  - writes dist/404.html (copy of index.html) so client-side app routes
 *    like /challenge and /ranking still load on refresh. GitHub Pages
 *    serves it with a 404 status, which is fine: those are interactive app
 *    routes that should not be indexed anyway.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const DIST = new URL('../dist/', import.meta.url).pathname;
const SITE = 'https://ketsuin.clothpath.com';
const OG_IMAGE = `${SITE}/asset/ketsuin.png`;

const STYLE = {
  page: 'font-family:system-ui,sans-serif;max-width:800px;margin:0 auto;padding:2rem;color:#e5e5e5;background:#0f0f0f;min-height:100vh',
  h1: 'color:#F2A900;font-size:2rem;margin-bottom:1rem',
  h2: 'color:#F2A900;font-size:1.5rem;margin:2rem 0 0.5rem',
  table: 'width:100%;border-collapse:collapse;margin:1rem 0',
  th: 'border:1px solid #333;padding:0.5rem;background:#1a1a1a;color:#F2A900',
  td: 'border:1px solid #333;padding:0.5rem',
  link: 'color:#F2A900',
};

const SIGN_ROWS = [
  ['1', 'Rat', '子', '.,?!'],
  ['2', 'Ox', '丑', 'ABC'],
  ['3', 'Tiger', '寅', 'DEF'],
  ['4', 'Hare', '卯', 'GHI'],
  ['5', 'Dragon', '辰', 'JKL'],
  ['6', 'Snake', '巳', 'MNO'],
  ['7', 'Horse', '午', 'PQRS'],
  ['8', 'Ram', '未', 'TUV'],
  ['9', 'Monkey', '申', 'WXYZ'],
  ['0', 'Dog (Space)', '戌', 'SPC'],
  ['*', 'Bird (Delete)', '酉', 'DEL'],
  ['#', 'Boar (Next)', '亥', 'NEXT'],
];

const signTable = `
      <table style="${STYLE.table}">
        <thead><tr><th style="${STYLE.th}">Key</th><th style="${STYLE.th}">Sign</th><th style="${STYLE.th}">Kanji</th><th style="${STYLE.th}">Letters</th></tr></thead>
        <tbody>
${SIGN_ROWS.map(([key, name, kanji, letters]) =>
  `          <tr><td style="${STYLE.td}">${key}</td><td style="${STYLE.td}">${name}</td><td style="${STYLE.td}">${kanji}</td><td style="${STYLE.td}">${letters}</td></tr>`
).join('\n')}
        </tbody>
      </table>`;

const ROUTES = [
  {
    path: 'about',
    title: 'About Ketsuin — Ninja Hand Sign Input Method',
    description:
      'Learn about Ketsuin, a free, open-source web-based ninja hand sign input method powered by AI. Detect 12 hand seals via webcam and type with T9 logic.',
    body: `
      <h1 style="${STYLE.h1}">About Ketsuin</h1>
      <h2 style="${STYLE.h2}">What is Ketsuin?</h2>
      <p>Ketsuin (結印) is a web-based input method that lets you type text using ninja hand signs detected through your webcam. Inspired by the hand seals from Japanese ninja tradition, it maps 12 zodiac seals to T9 phone keypad groups — enabling text input through gesture.</p>
      <p>The name 結印 means "binding seal" in Japanese, referring to the hand positions used in ninja jutsu.</p>
      <h2 style="${STYLE.h2}">How It Works</h2>
      <ol style="margin:0.5rem 0 0.5rem 1.5rem;line-height:1.8">
        <li>Allow webcam access when prompted</li>
        <li>Form one of the 12 ninja hand seals in front of your camera</li>
        <li>The AI model (YOLOX-Nano) detects your hand sign in real time</li>
        <li>Each sign maps to a T9 key group (like an old phone keypad)</li>
        <li>Combine signs to spell words — cycle through candidates with the Boar seal</li>
      </ol>
      <h2 style="${STYLE.h2}">Technology</h2>
      <ul style="margin:0.5rem 0 0.5rem 1.5rem;line-height:1.8">
        <li><strong>YOLOX-Nano</strong> — lightweight object detection model for hand sign recognition</li>
        <li><strong>ONNX Runtime Web</strong> — runs ML inference entirely in the browser via WebAssembly</li>
        <li><strong>T9 Engine</strong> — predictive text input mapped to 12 ninja seals</li>
        <li><strong>React 19 + TypeScript + Vite</strong> — modern web stack</li>
        <li><strong>Cloudflare Workers + D1</strong> — global leaderboard for challenge mode</li>
      </ul>
      <p style="font-size:0.9rem;color:#888">All detection happens locally in your browser. No video data is sent to any server.</p>
      <h2 style="${STYLE.h2}">Challenge Mode</h2>
      <p>Test your hand sign speed by performing jutsu sequences as fast as possible. Compete on the global leaderboard and earn ninja ranks from Genin (rookie) to Six Paths (godlike speed).</p>
      <p>There are 8 jutsu challenges ranging from Chidori (4 seals, difficulty 1) to the legendary Water Dragon (44 seals, difficulty 5).</p>
      <h2 style="${STYLE.h2}">Open Source</h2>
      <p>Ketsuin is free and open source. Source code: <a style="${STYLE.link}" href="https://github.com/huanglizhuo/Ketsuin">github.com/huanglizhuo/Ketsuin</a>. See also the <a style="${STYLE.link}" href="${SITE}/hand-signs">12 hand signs reference</a>.</p>`,
    breadcrumb: 'About',
  },
  {
    path: 'hand-signs',
    title: '12 Ninja Hand Signs Reference — Ketsuin',
    description:
      'Complete reference for the 12 ninja hand signs used in Ketsuin. Each zodiac seal (子丑寅卯辰巳午未申酉戌亥) maps to a T9 key group for text input via webcam.',
    body: `
      <h1 style="${STYLE.h1}">12 Ninja Hand Signs</h1>
      <p>Each hand sign corresponds to one of the 12 Chinese zodiac branches (十二支) and maps to a T9 key group. Form these signs in front of your webcam to type text.</p>
      ${signTable}
      <h2 style="${STYLE.h2}">How to Use the Signs</h2>
      <p>Hold a sign in front of your webcam until Ketsuin recognizes it, then chain signs to spell words letter by letter. Use the Dog seal (戌) for space, the Bird seal (酉) to delete, and the Boar seal (亥) to cycle through T9 word candidates.</p>
      <p>Ready to try? <a style="${STYLE.link}" href="${SITE}/">Open the Ketsuin input method</a> or learn <a style="${STYLE.link}" href="${SITE}/about">how it works</a>.</p>`,
    breadcrumb: '12 Hand Signs',
  },
];

function setMeta(html, { title, description, url }) {
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${title}</title>`)
    .replace(
      /(<meta name="description"\s*\n?\s*content=")[^"]*(")/,
      `$1${description}$2`
    )
    .replace(
      /(<link rel="canonical" href=")[^"]*(")/,
      `$1${url}$2`
    )
    .replace(/(<meta property="og:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="og:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(
      /(<meta property="og:description"\s*\n?\s*content=")[^"]*(")/,
      `$1${description}$2`
    )
    .replace(/(<meta property="twitter:url" content=")[^"]*(")/, `$1${url}$2`)
    .replace(/(<meta property="twitter:title" content=")[^"]*(")/, `$1${title}$2`)
    .replace(
      /(<meta property="twitter:description"\s*\n?\s*content=")[^"]*(")/,
      `$1${description}$2`
    );
}

function setBody(html, bodyHtml) {
  return html.replace(
    /(<div id="root">)[\s\S]*?(<\/div>\s*<\/body>)/,
    `$1\n    <div style="${STYLE.page}">${bodyHtml}
    </div>\n  $2`
  );
}

function addBreadcrumbSchema(html, route) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Ketsuin', item: `${SITE}/` },
      { '@type': 'ListItem', position: 2, name: route.breadcrumb, item: `${SITE}/${route.path}` },
    ],
  };
  return html.replace(
    '</head>',
    `  <script type="application/ld+json">${JSON.stringify(schema)}</script>\n</head>`
  );
}

const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf8');

for (const route of ROUTES) {
  const url = `${SITE}/${route.path}`;
  let html = setMeta(indexHtml, { title: route.title, description: route.description, url });
  html = setBody(html, route.body);
  html = addBreadcrumbSchema(html, route);
  const dir = join(DIST, route.path);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'index.html'), html);
  console.log(`prerendered /${route.path}`);
}

// SPA fallback for app routes (/challenge, /ranking, shared challenge links).
writeFileSync(join(DIST, '404.html'), indexHtml);
console.log('wrote 404.html (SPA fallback for app routes)');

// Keep sitemap lastmod honest: build date, not a hardcoded one.
const today = new Date().toISOString().slice(0, 10);
const sitemapPath = join(DIST, 'sitemap.xml');
const sitemap = readFileSync(sitemapPath, 'utf8').replaceAll(
  /<lastmod>[^<]*<\/lastmod>/g,
  `<lastmod>${today}</lastmod>`
);
writeFileSync(sitemapPath, sitemap);
console.log(`sitemap lastmod -> ${today}`);
