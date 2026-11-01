// IV&V independent verification of the core system requirements in the HC-2 variant (VAR-f23826).
// Usage: node ivv-hc2.cjs <dist dir> <serve.mjs> <out dir> [<dist dir with HC2-01 empty mass 643 kg>]
// Expected values were computed by IV&V by hand from D-91084e and data/fleet.csv (HC2-01: 640 kg, 2.150 m,
// weighed 2025-11-20; front seats 2.000 m max 220 kg; baggage 2.900 m max 40 kg; MTOM 880 kg;
// envelope (550,2.050) (750,2.050) (880,2.130) (880,2.170) (550,2.170)).
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const [dist, serve, out, distMod] = process.argv.slice(2);
const URL = 'http://127.0.0.1:4197/hc2/';
const URLMOD = 'http://127.0.0.1:4196/hc2/';
const IN = 'Within limits (without fuel)';
const OM = 'Outside limits: total mass above maximum take-off mass';
const OC = 'Outside limits: centre of gravity outside envelope';
const INC = 'Check not complete: fill in or correct the marked entries';
const rows = [];
function rec(sr, ak, what, ok, seen) { rows.push({ sr, ak, what, ok: !!ok, seen: String(seen) }); }

(async () => {
  const srv = spawn('node', [serve, dist, '4197'], { stdio: 'ignore' });
  const srv2 = distMod ? spawn('node', [serve, distMod, '4196'], { stdio: 'ignore' }) : null;
  await new Promise((r) => setTimeout(r, 1000));
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true });
  const p = await ctx.newPage();
  const txt = async (s) => ((await p.locator(s).count()) ? (await p.locator(s).innerText()).trim() : '');
  const ind = () => txt('#indication');
  async function open(url = URL) { await p.goto(url); await p.waitForSelector('body[data-ready=true]'); }
  async function load(f, bg, url = URL) {
    await open(url);
    await p.selectOption('#aircraft', 'HC2-01');
    const inputs = p.locator('#entries input');
    if (f !== null) await inputs.nth(0).fill(String(f));
    if (bg !== null) await inputs.nth(1).fill(String(bg));
  }
  const point = async () => p.evaluate(() => {
    const g = document.querySelector('#point'); const poly = document.querySelector('#chart polygon.envelope');
    if (!g) return null;
    const c = g.querySelector('circle'); let x, y;
    if (c) { x = +c.getAttribute('cx'); y = +c.getAttribute('cy'); } else { const m = g.querySelector('path').getAttribute('d').match(/M([\d.-]+) ([\d.-]+)/); x = +m[1] + 7; y = +m[2] + 7; }
    const svg = document.querySelector('#chart'); const pt = svg.createSVGPoint(); pt.x = x; pt.y = y;
    const lab = document.querySelector('#point-label');
    return { mass: g.dataset.mass, cg: g.dataset.cg, state: g.dataset.state, inFill: poly.isPointInFill(pt), label: lab ? lab.textContent : '', corners: poly.dataset.corners };
  });

  // SR-1329af fixed notices
  await load(160, 20);
  const first = await p.evaluate(() => { const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, { acceptNode: (n) => n.textContent.trim() ? 1 : 3 }); return w.nextNode().textContent.trim(); });
  rec('SR-1329af', 1, 'first text of the page', first === 'Invented aircraft. Not for flight operations.', first);
  const aidAbove = await p.evaluate(() => !!(document.querySelector('#aid').compareDocumentPosition(document.querySelector('#indication')) & Node.DOCUMENT_POSITION_FOLLOWING));
  rec('SR-1329af', 2, 'aid statement above the first result', aidAbove && (await txt('#aid')).startsWith('This app is an aid. The pilot in command remains responsible'), await txt('#aid'));
  const fuelNext = await p.evaluate(() => document.querySelector('#indication').nextElementSibling.id === 'fuel');
  rec('SR-1329af', 3, 'fuel note directly below the indication (160/20)', fuelNext && (await txt('#fuel')) === 'Fuel is not included in this version.', await txt('#fuel'));

  // SR-348143 total mass, SR-29562e CG, SR-3a4905 within
  rec('SR-348143', 1, '160/20 → 820 kg', (await txt('#total')) === '820 kg', await txt('#total'));
  rec('SR-29562e', 1, '160/20 → 2.139 m (1754.0/820)', (await txt('#cg')) === '2.139 m', await txt('#cg'));
  rec('SR-3a4905', 1, '160/20 (820 kg, 2.139 m) within', (await ind()) === IN, await ind());
  // SR-0b76d9 table
  const table = (await p.locator('#table tbody tr').allInnerTexts()).map((s) => s.replace(/\s+/g, ' ').trim());
  const expT = ['Empty mass 640 kg 2.150 m 1376.0 kg·m', 'Front seats 160 kg 2.000 m 320.0 kg·m', 'Baggage compartment 20 kg 2.900 m 58.0 kg·m', 'Total 820 kg 2.139 m 1754.0 kg·m'];
  rec('SR-0b76d9', 1, 'table rows 160/20', JSON.stringify(table) === JSON.stringify(expT), table.join(' ; '));
  rec('SR-0b76d9', 2, 'rounding stated below the table', (await txt('#rounding')) === 'Masses rounded to 1 kg, lever arms to 0.001 m, moments to 0.1 kg·m', await txt('#rounding'));
  // SR-5e3579 top view
  const marks = async () => p.locator('#topview g.station').evaluateAll((gs) => gs.map((g) => ({ o: +g.dataset.order, y: g.querySelector('rect').getBBox().y, l: g.querySelector('.mark-label').getAttribute('aria-label') })));
  let mk = await marks();
  const ordered = mk.every((m, i) => i === 0 || m.y > mk[i - 1].y);
  rec('SR-5e3579', 1, 'marks front to back: Front seats 160 kg, Baggage compartment 20 kg', ordered && mk.map((m) => m.l).join('|') === 'Front seats 160 kg|Baggage compartment 20 kg', mk.map((m) => `${m.l}@${m.y}`).join(' ; '));
  await p.locator('#entries input').nth(1).fill('40');
  mk = await marks();
  rec('SR-5e3579', 2, 'baggage changed to 40 → mark 40 kg', mk[1].l === 'Baggage compartment 40 kg', mk[1].l);
  // SR-3f6229 chart
  await load(160, 20);
  let pt = await point();
  rec('SR-3f6229', 1, 'corners and point (820 kg, 2.139 m) inside', pt.corners === '550:2050 750:2050 880:2130 880:2170 550:2170' && pt.mass === '820' && pt.state === 'inside' && pt.inFill && !pt.label, JSON.stringify(pt));
  const corners = (await p.locator('#corners tbody tr').allInnerTexts()).map((s) => s.replace(/\s+/g, ' ').trim());
  rec('SR-3f6229', 4, 'corner table', JSON.stringify(corners) === JSON.stringify(['1 550 kg 2.050 m', '2 750 kg 2.050 m', '3 880 kg 2.130 m', '4 880 kg 2.170 m', '5 550 kg 2.170 m']), corners.join(' ; '));
  await load(60, 40);
  pt = await point();
  rec('SR-3f6229', 2, '60/40 point (740 kg, 2.178 m) aft, label', pt.mass === '740' && pt.state === 'outside' && !pt.inFill && pt.label === 'Aft limit exceeded', JSON.stringify(pt));
  rec('SR-29562e', 2, '60/40 → 2.178 m (1612.0/740)', (await txt('#cg')) === '2.178 m', await txt('#cg'));
  rec('SR-687e88', 1, '60/40 (740 kg, 2.178 m, aft 2.170 m) CG outside', (await ind()) === OC && (await p.getByText('Within limits').count()) === 0, await ind());
  await load(212, 0);
  pt = await point();
  rec('SR-3f6229', 3, '212/0 point (852 kg, 2.113 m) forward of 2.11277 m, label', pt.mass === '852' && pt.state === 'outside' && !pt.inFill && pt.label === 'Forward limit exceeded', JSON.stringify(pt));
  rec('SR-687e88', 2, '212/0 (852 kg, 1800.0/852 = 2.11268 m < forward 2.11277 m) CG outside', (await ind()) === OC && (await p.getByText('Within limits').count()) === 0, await ind());
  await load(211, 0);
  rec('SR-687e88', 3, '211/0 (851 kg, 2.11281 m, forward 2.11215 m; no exact integer forward edge exists in HC-2) not CG outside', (await ind()) !== OC && (await ind()) === IN, await ind());
  await load(75, 35);
  rec('SR-3a4905', 3, '75/35 (750 kg, exactly 2.170 m aft limit) within', (await ind()) === IN && (await txt('#cg')) === '2.170 m', `${await ind()} ${await txt('#cg')}`);
  await load(200, 40);
  rec('SR-3a4905', 2, '200/40 (exactly 880 kg MTOM) within', (await ind()) === IN && (await txt('#total')) === '880 kg', `${await ind()} ${await txt('#total')}`);
  rec('SR-45198e', 2, '200/40 (880 kg) not mass outside', (await ind()) !== OM, await ind());
  await load(201, 40);
  rec('SR-45198e', 1, '201/40 (881 kg) mass outside', (await ind()) === OM && (await p.getByText('Within limits').count()) === 0, await ind());
  pt = await point();
  rec('SR-3f6229', '(extra)', '201/40 label Mass limit exceeded', pt.label === 'Mass limit exceeded', pt.label);
  // SR-348143 AK2, SR-e95f42
  await load(0, 0);
  rec('SR-348143', 2, '0/0 → 640 kg', (await txt('#total')) === '640 kg', await txt('#total'));
  await open(); await p.selectOption('#aircraft', 'HC2-01');
  const labels = (await p.locator('#entries label').allInnerTexts()).map((s) => s.trim());
  const empties = await p.locator('#entries input').evaluateAll((es) => es.map((e) => e.value));
  rec('SR-e95f42', 1, 'empty entries Front seats (max 220 kg), Baggage compartment (max 40 kg)', labels.join('|') === 'Front seats (max 220 kg)|Baggage compartment (max 40 kg)' && empties.every((v) => v === ''), labels.join(' | '));
  await load(160, 0);
  rec('SR-e95f42', 2, '160/0 → field 160, total 800 kg', (await p.locator('#entries input').nth(0).inputValue()) === '160' && (await txt('#total')) === '800 kg', await txt('#total'));
  // SR-181ae8 messages
  const msg = async (i) => (await p.locator('#entries .message').nth(i).innerText()).trim();
  await load(221, null); rec('SR-181ae8', 1, '221 front → Enter 0 to 220 kg', (await msg(0)) === 'Enter 0 to 220 kg', await msg(0));
  await load(-5, null); rec('SR-181ae8', 2, '-5 front → Enter 0 to 220 kg', (await msg(0)) === 'Enter 0 to 220 kg', await msg(0));
  await load(null, '7.5'); rec('SR-181ae8', 3, '7.5 baggage → Enter 0 to 40 kg', (await msg(1)) === 'Enter 0 to 40 kg', await msg(1));
  // SR-b59c9a
  await load(221, 0);
  rec('SR-b59c9a', 1, '221/0 → check not complete, no within', (await ind()) === INC && (await p.getByText('Within limits').count()) === 0, await ind());
  await p.locator('#entries input').nth(0).fill('220');
  rec('SR-b59c9a', 3, 'front changed to 220 → another indication', !(await ind()).startsWith('Check not complete'), await ind());
  await load(160, null);
  rec('SR-b59c9a', 2, '160/empty → check not complete, no within', (await ind()) === INC && (await p.getByText('Within limits').count()) === 0, await ind());
  // SR-588924 update within 100 ms
  await load(160, 20);
  const ms = await p.evaluate(() => { const i = document.querySelectorAll('#entries input')[0]; const t0 = performance.now(); i.value = '170'; i.dispatchEvent(new Event('input', { bubbles: true })); const v = document.querySelector('#total').textContent; return { dt: performance.now() - t0, v }; });
  rec('SR-588924', 1, '160→170 front → 830 kg within 100 ms, no button', ms.v === '830 kg' && ms.dt < 100 && (await p.locator('button').count()) === 0, `${ms.v} in ${ms.dt.toFixed(1)} ms`);
  // SR-663a61 fleet data
  await open(); await p.selectOption('#aircraft', 'HC2-01');
  rec('SR-663a61', 1, 'Empty mass 640 kg at 2.150 m, weighed 2025-11-20', (await txt('#empty-data')) === 'Empty mass 640 kg at 2.150 m, weighed 2025-11-20', await txt('#empty-data'));
  if (distMod) { await load(0, 0, URLMOD); rec('SR-663a61', 2, 'build with HC2-01 empty mass 643 kg → 0/0 shows 643 kg', (await txt('#total')) === '643 kg', await txt('#total')); }
  // SR-54e043 phone
  await load(160, 0);
  const w = await p.evaluate(() => document.documentElement.scrollWidth);
  rec('SR-54e043', 1, 'page width at most 360 px', w <= 360, w);
  const inView = async (s) => p.locator(s).evaluate((el) => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; });
  rec('SR-54e043', 2, '160/0: total and indication without horizontal scrolling', w <= 360 && (await inView('#indication')) && (await inView('#total')), w);
  rec('SR-54e043', 3, 'after the baggage entry the indication is inside the viewport', await inView('#indication'), await inView('#indication'));
  await load(160, 41);
  const hit = async (s) => p.locator(s).evaluate((el) => { const r = el.getBoundingClientRect(); const t = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return t === el || el.contains(t); });
  rec('SR-54e043', 4, '160/41: baggage entry and "Enter 0 to 40 kg" not covered', (await hit('#entries input >> nth=1')) && (await hit('#entries .message >> nth=1')) && (await msg(1)) === 'Enter 0 to 40 kg', await msg(1));
  await p.screenshot({ path: out + '/hc2-phone-41.png' });
  // SR-070ac3 contrast
  for (const scheme of ['light', 'dark']) {
    await p.emulateMedia({ colorScheme: scheme });
    await load(160, 20);
    const c = await p.evaluate(() => {
      const parse = (s) => { const m = s.match(/rgba?\(([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)(?:[,/ ]+([\d.]+))?/); return m ? [+m[1], +m[2], +m[3], m[4] === undefined ? 1 : +m[4]] : null; };
      const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
      const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
      const bg = (el) => { for (let e = el; e; e = e.parentElement) { const v = parse(getComputedStyle(e).backgroundColor); if (v && v[3] > 0) return v; } return [255, 255, 255, 1]; };
      const fg = (el, prop) => parse(getComputedStyle(el)[prop]);
      const r = {};
      r.indication = ratio(fg(document.querySelector('#indication'), 'color'), bg(document.querySelector('#indication')));
      r.body = ratio(fg(document.querySelector('#loading-title').nextElementSibling, 'color'), bg(document.querySelector('#loading-title')));
      const svgBg = bg(document.querySelector('#chart'));
      r.envelope = ratio(fg(document.querySelector('#chart polygon.envelope'), 'stroke'), svgBg);
      const pc = document.querySelector('#point circle, #point path');
      const pf = fg(pc, 'fill'); r.point = ratio(pf && pf[3] > 0 ? pf : fg(pc, 'stroke'), svgBg);
      const mk = document.querySelector('#topview rect.mark'); r.mark = ratio(fg(mk, 'stroke'), bg(document.querySelector('#topview')));
      return r;
    });
    const ak = scheme === 'light' ? 1 : 2;
    rec('SR-070ac3', ak, `${scheme}: indication and body text ≥ 4.5:1`, c.indication >= 4.5 && c.body >= 4.5, `indication ${c.indication.toFixed(2)}, body ${c.body.toFixed(2)}`);
    rec('SR-070ac3', 3, `${scheme}: envelope, point, marks ≥ 3:1`, c.envelope >= 3 && c.point >= 3 && c.mark >= 3, `envelope ${c.envelope.toFixed(2)}, point ${c.point.toFixed(2)}, mark ${c.mark.toFixed(2)}`);
    await p.screenshot({ path: `${out}/hc2-${scheme}.png` });
  }
  await p.emulateMedia({ colorScheme: 'light' });
  // SR-384eab offline (service worker)
  const ctx2 = await b.newContext({ viewport: { width: 360, height: 740 }, serviceWorkers: 'allow' });
  const q = await ctx2.newPage();
  await q.goto(URL); await q.waitForSelector('body[data-ready=true]');
  await q.waitForTimeout(1500); await q.reload(); await q.waitForSelector('body[data-ready=true]');
  await ctx2.setOffline(true);
  await q.reload(); await q.waitForSelector('body[data-ready=true]');
  await q.selectOption('#aircraft', 'HC2-01');
  await q.locator('#entries input').nth(0).fill('160'); await q.locator('#entries input').nth(1).fill('0');
  rec('SR-384eab', 1, 'opened once, offline reload, 160/0 → 800 kg', (await q.locator('#total').innerText()).trim() === '800 kg', await q.locator('#total').innerText());
  rec('SR-384eab', 4, 'offline notice shown', (await q.locator('#offline').isVisible()) && (await q.locator('#offline').innerText()).trim() === 'Offline: aircraft data as of the last opening with network. Check the weighing date against the aircraft documents.', await q.locator('#offline').isVisible());
  await ctx2.setOffline(false);
  await q.waitForTimeout(300);
  rec('SR-384eab', '4b', 'notice hidden when the network is back', !(await q.locator('#offline').isVisible()), await q.locator('#offline').isVisible());
  const reqs = [];
  const ctx3 = await b.newContext({ viewport: { width: 360, height: 740 } });
  const r3 = await ctx3.newPage();
  await r3.goto(URL); await r3.waitForSelector('body[data-ready=true]');
  rec('SR-384eab', 3, 'fresh browser: selection shown, no sign-in or install step', (await r3.locator('#aircraft').isVisible()) && (await r3.locator('input[type=password], form[action]').count()) === 0, await r3.locator('#aircraft').isVisible());
  await r3.waitForLoadState('networkidle');
  r3.on('request', (r) => reqs.push(r.url()));
  await r3.selectOption('#aircraft', 'HC2-01');
  await r3.locator('#entries input').nth(0).fill('160'); await r3.locator('#entries input').nth(1).fill('20');
  await r3.waitForTimeout(500);
  rec('SR-384eab', 2, 'no network request while entering a loading', reqs.length === 0, reqs.length ? reqs.join(' ') : 'none');

  await b.close(); srv.kill(); if (srv2) srv2.kill();
  const md = ['| SR | AK | HC-2 case (IV&V expected value) | Result | Seen |', '|---|---|---|---|---|', ...rows.map((r) => `| ${r.sr} | ${r.ak} | ${r.what} | ${r.ok ? 'pass' : '**FAIL**'} | ${r.seen.replace(/\|/g, '/')} |`)].join('\n');
  fs.writeFileSync(out + '/hc2-results.md', md + '\n');
  console.log(md);
  console.log(rows.every((r) => r.ok) ? 'ALL PASS' : 'FAILURES');
})();
