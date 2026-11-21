"""Captures screens, component PNGs and standalone SVGs from the Number Sky v1 build.
Usage: python3 capture.py <index.html> <out_dir> <fonts_node_modules>
"""
import sys, json, os, base64
from playwright.sync_api import sync_playwright

src, out, fonts = sys.argv[1], sys.argv[2], sys.argv[3]
for d in ('svg', 'components', 'screens'):
    os.makedirs(os.path.join(out, d), exist_ok=True)

def b64(p):
    return base64.b64encode(open(p, 'rb').read()).decode()

FONT_CSS = """
@font-face{font-family:'Atkinson Hyperlegible';font-weight:400;src:url(data:font/woff2;base64,%s) format('woff2')}
@font-face{font-family:'Atkinson Hyperlegible';font-weight:700;src:url(data:font/woff2;base64,%s) format('woff2')}
@font-face{font-family:'Bricolage Grotesque';font-weight:200 800;src:url(data:font/woff2;base64,%s) format('woff2')}
""" % (
    b64(fonts + '/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-400-normal.woff2'),
    b64(fonts + '/@fontsource/atkinson-hyperlegible/files/atkinson-hyperlegible-latin-700-normal.woff2'),
    b64(fonts + '/@fontsource-variable/bricolage-grotesque/files/bricolage-grotesque-latin-opsz-normal.woff2'),
)

SETUP = """() => {
  // deterministic questions
  let a = 20261120; Math.random = () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const p = newProfile('Sam', '🦊'); APP.profiles = {}; APP.profiles[p.id] = p; APP.current = p.id; setProf();
  const now = Date.now(), day = 864e5;
  ['quantity','numberline','placevalue','makes10','addition','subtraction','multmeaning'].forEach((id, i) => { const s = prof.skills[id]; s.mastered = true; s.stage = 2; s.best = 2; s.pL = [.95,.93,.92]; s.att = [4,5,6]; s.cor = [4,4,5]; s.lastSeen = now - (i % 4) * day; });
  Object.assign(prof.skills.divmeaning, {stage: 1, best: 1, pL: [.93,.55,.1], att: [5,3,0], cor: [5,2,0], lastSeen: now});
  Object.assign(prof.skills.multeasy, {stage: 1, best: 1, pL: [.92,.4,.1], att: [4,2,0], cor: [4,1,0], lastSeen: now - day});
  prof.placementDone = true; prof.focus = 'divmeaning'; prof.gems = 46;
  prof.days = [0,1,3,4].map(d => dayKey(new Date(now - d * day)));
  prof.mis = {'op-sub-for-div': {count: 4, last: now}, 'fact-neighbor': {count: 2, last: now - day}, 'regroup': {count: 1, last: now - 3 * day}};
  prof.sessions = [{d: now - 4*day, n: 9, c: 6, min: 6, m: 'placement'}, {d: now - 3*day, n: 10, c: 7, min: 8, m: 'practice'}, {d: now - day, n: 10, c: 8, min: 7, m: 'practice'}, {d: now, n: 10, c: 8, min: 9, m: 'practice'}];
  for (let i = 0; i < 30; i++) prof.log.push({t: now - (i % 4) * day, s: 'divmeaning', g: 1, ok: i % 4 !== 0, h: 0, m: null, r: 0, u: 0});
  window.__show = (skill, stage, easy, n) => {
    S = {mode: 'practice', n: 10, i: n == null ? 3 : n, answered: 3, correct: 2, gems: 5, start: Date.now(), events: [], P: null};
    const q = makeQuestion(skill, stage, !!easy); q.review = false;
    Cur = {q, phase: 'answer', hinted: false, hintShown: false, entry: '', chosen: null, fchosen: null, b: q.kind === 'build' ? initBuild(q.build) : null, buildMiss: false};
    UI.screen = 'practice'; UI.modal = null; UI.toast = null; render(); window.scrollTo(0, 0); return q.kind + (q.build ? ':' + q.build.type : '');
  };
  window.__act = (act, attrs) => { const el = document.createElement('button'); el.dataset.act = act; Object.assign(el.dataset, attrs || {}); ACT[act](el, {clientX: 0}); };
  UI.screen = 'home'; UI.modal = null; render();
}"""

EXPORT_SVG = """(items) => {
  const hex = c => { const m = String(c).match(/rgba?\\(([^)]+)\\)/); if (!m) return c; const p = m[1].split(',').map(s => parseFloat(s)); if (p.length > 3 && p[3] === 0) return 'none'; return '#' + p.slice(0,3).map(v => Math.round(v).toString(16).padStart(2,'0')).join('').toUpperCase(); };
  const PROPS = ['fill','stroke','stroke-width','stroke-linecap','stroke-linejoin','stroke-dasharray','opacity','stroke-opacity','font-family','font-size','font-weight','text-anchor','vector-effect'];
  const host = document.createElement('div'); host.id = '__host'; host.style.cssText = 'position:absolute;left:0;top:0;width:700px;background:var(--surface);padding:20px;z-index:99;color:var(--ink)'; document.body.appendChild(host);
  const res = {};
  for (const it of items) {
    host.innerHTML = it.wrap ? it.wrap.replace('%%', it.html) : it.html;
    const svg = host.querySelector('svg'); if (!svg) { res[it.name] = null; continue; }
    const clone = svg.cloneNode(true);
    const A = [svg, ...svg.querySelectorAll('*')], B = [clone, ...clone.querySelectorAll('*')];
    A.forEach((el, i) => {
      const t = B[i], tag = el.tagName.toLowerCase();
      [...t.attributes].forEach(at => { if (at.name === 'class' || at.name === 'style' || at.name.startsWith('data-') || at.name === 'aria-hidden') t.removeAttribute(at.name); });
      if (el === svg) { const vb = svg.viewBox.baseVal; t.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); t.setAttribute('width', vb.width); t.setAttribute('height', vb.height); return; }
      if (tag === 'g') return;
      const cs = getComputedStyle(el);
      for (const p of PROPS) {
        let v = cs.getPropertyValue(p); if (!v) continue;
        if (p === 'fill' || p === 'stroke') v = hex(v);
        if (p === 'stroke' && v === 'none') { continue; }
        if (p.startsWith('stroke-') && hex(cs.stroke) === 'none') continue;
        if ((p === 'opacity' || p === 'stroke-opacity') && v === '1') continue;
        if (p === 'stroke-dasharray' && v === 'none') continue;
        if (p === 'vector-effect' && v === 'none') continue;
        if (p.startsWith('font') || p === 'text-anchor') { if (tag !== 'text') continue; }
        if (p === 'stroke-linecap' && v === 'butt') continue;
        if (p === 'stroke-linejoin' && v === 'miter') continue;
        if (p === 'stroke-width' || p === 'font-size') v = v.replace(/px$/, '');
        t.setAttribute(p, v.replace(/"/g, "'"));
      }
    });
    res[it.name] = '<?xml version="1.0" encoding="UTF-8"?>\\n' + new XMLSerializer().serializeToString(clone) + '\\n';
  }
  host.remove();
  return res;
}"""

SVG_ITEMS = """() => {
  const star = s => ({wrap: '<div class="star ' + s + '">%%</div>', html: starSVG(s)});
  const I = (name, html, wrap) => ({name, html, wrap});
  const L = [];
  ['lit','now','open','locked'].forEach(s => L.push(Object.assign({name: 'star-' + s}, star(s))));
  L.push(I('gem', GEM));
  Object.entries({close:'icon-close', speak:'icon-read-aloud', bulb:'icon-hint', back:'icon-backspace', left:'icon-left', right:'icon-right'}).forEach(([k, n]) => L.push(I(n, ICON[k], '<div style="width:24px;height:24px;color:var(--ink)">%%</div>')));
  L.push(I('badge-level-up', ICON.up)); L.push(I('badge-switch-level', ICON.shift));
  Object.entries({'+':'op-add-put-together', '−':'op-subtract-take-away', '×':'op-multiply-equal-groups', '÷':'op-divide-share'}).forEach(([k, n]) => L.push(I(n, OPICON[k])));
  L.push(I('ten-frame-7', vTF([1,1,1,1,1,1,1,0,0,0])));
  L.push(I('ten-frame-given-4-added-3', vTF([2,2,2,2,1,1,1,0,0,0])));
  L.push(I('block-hundred', FLAT)); L.push(I('block-ten', ROD)); L.push(I('block-one', CUBE));
  L.push(I('array-4x6-double-double', stratArray(4, 6)));
  L.push(I('array-7x6-five-plus-two', stratArray(7, 6)));
  L.push(I('array-9x6-ten-minus-one', stratArray(9, 6)));
  L.push(I('array-3x5-plain', vArray(3, 5)));
  L.push(I('number-line-0-20-marker', vLine({min:0, max:20, labels:[0,5,10,15,20], marker:13})));
  L.push(I('number-line-0-100-arrow', vLine({min:0, max:100, tick:10, labels:[0,50,100], arrow:70})));
  L.push(I('number-line-jumps-34-plus-23', vLine({min:30, max:60, labels:[30,40,50,60], jumps: jumpList(34, 23, true), marker:57})));
  L.push(I('fraction-bar-3-of-4', vFracBar(4, 3)));
  L.push(I('fraction-circle-3-of-8', vFracCircle(8, 3)));
  L.push(I('fact-triangle-24-4-6', vTri(24, 4, 6, null)));
  L.push(I('fact-triangle-missing', vTri(24, 4, 6, 'r')));
  return L;
}"""

COMPONENTS = """() => {
  const e = '🍓';
  return [
    ['blocks-247', vBlocks(2, 4, 7)],
    ['blocks-sum-27-and-15', vSum(27, 15)],
    ['plates-3-groups-of-4', vPlates(3, 4, e)],
    ['plates-labelled-friends', vPlates(3, 4, '🍪', {label: 'Friend'})],
    ['boxes-4-groups-of-3', vPlates(4, 3, '🍎', {label: 'Box', box: true})],
    ['items-12-take-away-5', vItems(12, '🐚', 5)],
    ['bar-model-52-17-unknown', vBarModel(52, 17)],
    ['bar-model-52-17-35', vBarModel(52, 17, 35)],
    ['place-value-table-347', vPlace([3, 4, 7], 1)],
    ['ten-frames-14', vFrames(14, 2)],
    ['fraction-compare-quarter-eighth', '<div style="display:flex;flex-direction:column;gap:12px">' + vFracBar(4, 1) + vFracBar(8, 1) + '</div>'],
    ['stage-chips', '<div style="display:flex;gap:10px;flex-wrap:wrap">' + [0,1,2].map(stageChip).join('') + '<span class="chip">Sharing equally</span><span class="chip rev">Review</span><span class="chip good">Mastered</span><span class="chip acc">Pictures level</span></div>'],
    ['buttons', '<div style="display:flex;flex-direction:column;gap:12px;width:340px"><button class="btn big">Start · 10 questions</button><button class="btn secondary">Back to my stars</button><div class="helpers"><button class="btn ghost">' + ICON.bulb + ' Hint</button><button class="btn ghost">I\\'m not sure</button></div></div>'],
    ['answer-options-states', '<div class="opts" style="width:420px"><button class="opt right">4</button><button class="opt wrong">9</button><button class="opt">15</button><button class="opt">5</button></div>'],
    ['number-pad', '<div style="width:360px;display:flex;flex-direction:column;gap:10px"><div class="padshow">42</div><div class="pad">' + ['1','2','3','4','5','6','7','8','9','del','0','ok'].map(k => '<button class="key' + (k === 'ok' ? ' ok' : '') + '">' + (k === 'del' ? ICON.back : k === 'ok' ? 'Check' : k) + '</button>').join('') + '</div></div>'],
    ['stepper', '<div class="steppers"><div class="stepper"><span class="sl">Tens</span><button class="sbtn">−</button><span class="sv">4</span><button class="sbtn">+</button></div><div class="stepper"><span class="sl">Ones</span><button class="sbtn">−</button><span class="sv">7</span><button class="sbtn">+</button></div></div>'],
    ['star-tiles-four-states', '<div class="stars" style="width:440px">' + ['lit','now','open','locked'].map((s, i) => '<div class="star ' + s + '">' + starSVG(s) + '<span class="sname">' + ['Mastered','Practising','Ready','Locked'][i] + '</span><span class="pips">' + [0,1,2].map(j => '<i class="' + (j < [3,1,0,0][i] ? 'on' : '') + '"></i>').join('') + '</span>' + (s === 'now' ? '<span class="nowtag">Now</span>' : '') + '</div>').join('') + '</div>'],
    ['gem-pill-and-avatar', '<div style="display:flex;gap:14px;align-items:center"><span class="avatar">🦊</span>' + gemPill() + '</div>'],
    ['week-dots', weekDots()],
    ['avatars-all', '<div class="avs" style="width:460px">' + AVATARS.map(a => '<span class="av">' + a[0] + '</span>').join('') + '</div>'],
    ['story-item-emoji', '<div style="display:flex;gap:10px;font-size:34px">' + ITEMS.map(i => '<span>' + i.e + '</span>').join('') + '</div>'],
    ['accent-themes', '<div style="display:flex;gap:14px">' + Object.entries(THEMES).map(([k, t]) => '<div style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:13px"><span style="width:44px;height:44px;border-radius:50%;background:' + (isDark() ? t.dark[0] : t.light[0]) + ';display:block"></span>' + t.name + '</div>').join('') + '</div>'],
  ];
}"""

SHOTS = [  # name, skill, stage, easy, actions
    ('practice-01-hands-on-ten-frame', 'quantity', 0, False, [('cell', {'i': '0'}), ('cell', {'i': '1'}), ('cell', {'i': '2'})]),
    ('practice-02-hands-on-number-line-place', 'numberline', 0, False, [('nlnudge', {'d': '1'})] * 6),
    ('practice-03-hands-on-blocks', 'placevalue', 0, False, [('blk', {'d': 'h+'}), ('blk', {'d': 't+'}), ('blk', {'d': 't+'}), ('blk', {'d': 'o+'})]),
    ('practice-04-hands-on-make-ten', 'makes10', 0, False, []),
    ('practice-05-hands-on-number-line-jumps', 'addition', 0, False, [('jump', {'d': '10'}), ('jump', {'d': '1'}), ('jump', {'d': '1'})]),
    ('practice-06-hands-on-take-away', 'subtraction', 0, False, [('cross', {'i': '0'}), ('cross', {'i': '1'})]),
    ('practice-07-hands-on-equal-groups', 'multmeaning', 0, False, [('grp', {'d': 'a+'}), ('grp', {'d': 'a+'}), ('grp', {'d': 'b+'})]),
    ('practice-08-hands-on-rows', 'multmid', 0, False, [('row', {'d': '+'}), ('row', {'d': '+'})]),
    ('practice-09-hands-on-sharing', 'divmeaning', 0, False, [('plate', {'i': '0'}), ('plate', {'i': '1'}), ('plate', {'i': '2'})]),
    ('practice-10-hands-on-make-groups', 'divfacts', 0, False, [('mkgrp', {})]),
    ('practice-11-hands-on-shade-fraction', 'fractions', 0, False, [('part', {'i': '0'})]),
    ('practice-12-hands-on-story-situation', 'whichop', 0, False, []),
    ('practice-13-pictures-ten-frames', 'quantity', 1, False, []),
    ('practice-14-pictures-number-line', 'numberline', 1, False, []),
    ('practice-15-pictures-blocks', 'placevalue', 1, False, []),
    ('practice-16-pictures-add-blocks', 'addition', 1, False, []),
    ('practice-17-pictures-bar-model', 'subtraction', 1, False, []),
    ('practice-18-pictures-equal-groups', 'multmeaning', 1, False, []),
    ('practice-19-pictures-array-strategy', 'multhard', 1, False, []),
    ('practice-20-pictures-sharing', 'divmeaning', 1, False, []),
    ('practice-21-pictures-fact-triangle', 'divfacts', 1, False, []),
    ('practice-22-pictures-story', 'whichop', 1, False, []),
    ('practice-23-pictures-fraction', 'fractions', 1, False, []),
    ('practice-24-numbers-keypad', 'subtraction', 2, False, []),
    ('practice-25-numbers-division-meaning', 'divmeaning', 2, False, []),
    ('practice-26-numbers-story', 'whichop', 2, False, []),
    ('practice-27-numbers-times-fact', 'multhard', 2, False, []),
]

log = []
with sync_playwright() as p:
    b = p.chromium.launch()
    def page(w, h, scheme='light'):
        pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=2, color_scheme=scheme, reduced_motion='reduce')
        pg.on('pageerror', lambda e: log.append('pageerror: ' + str(e)))
        pg.goto('file://' + src)
        pg.add_style_tag(content=FONT_CSS + '.star.now .st{animation:none!important}')
        pg.wait_for_timeout(1900)
        pg.evaluate('document.fonts.ready')
        return pg
    def shot(pg, name, full=True):
        pg.wait_for_timeout(60)
        pg.screenshot(path=f'{out}/screens/{name}.png', full_page=full)

    pg = page(390, 844)
    shot(pg, 'flow-01-welcome')
    pg.evaluate(SETUP)
    pg.evaluate("() => { prof.placementDone = false; UI.screen = 'placeIntro'; render(); }"); shot(pg, 'flow-02-warm-up-intro')
    pg.evaluate("() => { prof.placementDone = true; UI.screen = 'placed'; render(); }"); shot(pg, 'flow-03-warm-up-result')
    pg.evaluate("() => { UI.screen = 'home'; render(); window.scrollTo(0,0); }"); shot(pg, 'flow-04-home-star-chart')
    for name, sk, st, easy, acts in SHOTS:
        kind = pg.evaluate('([s,g,e]) => __show(s,g,e)', [sk, st, easy])
        for a, attrs in acts:
            pg.evaluate('([a,at]) => __act(a,at)', [a, attrs])
        shot(pg, name)
        log.append(f'{name}: {kind}')
    # states
    pg.evaluate("() => { __show('divmeaning', 1, false); __act('hint'); }"); shot(pg, 'state-01-hint-open')
    pg.evaluate("() => { __show('multhard', 2, false); __act('chart'); __act('chartcell', {i: '7', d: '6'}); }"); shot(pg, 'state-02-times-chart', full=False)
    pg.evaluate("() => { __show('divmeaning', 2, false); let q = Cur.q, tries = 0; while (!(q.kind === 'mc' && q.options.some(o => o.mis === 'op-sub-for-div')) && tries++ < 40) { __show('divmeaning', 2, false); q = Cur.q; } const i = q.options.findIndex(o => o.mis === 'op-sub-for-div'); __act('opt', {i: String(i)}); }"); shot(pg, 'state-03-feedback-wrong-subtracted-on-division')
    pg.evaluate("() => { __show('divmeaning', 1, false); const q = Cur.q; const i = q.options.findIndex(o => String(o.value) === String(q.answer)); __act('opt', {i: String(i)}); }"); shot(pg, 'state-04-feedback-correct')
    for i, ev in enumerate([{'type': 'up', 'skill': 'divmeaning', 'stage': 2}, {'type': 'mastered', 'skill': 'divmeaning'}, {'type': 'down', 'skill': 'divmeaning', 'stage': 0}, {'type': 'prereq', 'skill': 'divfacts', 'to': 'multeasy'}]):
        pg.evaluate('(ev) => { UI.modal = {type: "event", ev}; render(); }', ev); shot(pg, f'state-0{5+i}-modal-{ev["type"]}', full=False)
    pg.evaluate("() => { UI.modal = {type: 'star', id: 'multeasy'}; UI.screen = 'home'; render(); }"); shot(pg, 'state-09-modal-star-info', full=False)
    pg.evaluate("() => { UI.modal = null; S = {mode:'practice', n:10, i:10, answered:10, correct:8, gems:27, start:Date.now()-5e5, events:[{type:'up',skill:'divmeaning',stage:2},{type:'mastered',skill:'multmeaning'}], early:false}; UI.screen = 'summary'; render(); }"); shot(pg, 'flow-05-session-summary')
    pg.evaluate("() => { UI.screen = 'shop'; render(); }"); shot(pg, 'flow-06-shop')
    pg.evaluate("() => { UI.screen = 'grown'; render(); }"); shot(pg, 'flow-07-grown-up-view')

    # components + svgs (light)
    items = pg.evaluate(SVG_ITEMS)
    svgs = pg.evaluate(EXPORT_SVG, items)
    for name, s in svgs.items():
        if s is None: log.append('NO SVG ' + name); continue
        open(f'{out}/svg/{name}.svg', 'w', encoding='utf-8').write(s)
    comps = pg.evaluate(COMPONENTS)
    pg.evaluate("() => { UI.screen = 'home'; UI.modal = null; render(); document.getElementById('app').style.display = 'none'; document.getElementById('layer').style.display = 'none'; const h = document.createElement('div'); h.id = '__c'; h.style.cssText = 'position:absolute;left:0;top:0;z-index:99;background:var(--surface);padding:16px;display:inline-block'; document.body.appendChild(h); }")
    for name, html in comps:
        pg.evaluate('(h) => { document.getElementById("__c").innerHTML = h; }', html)
        pg.wait_for_timeout(40)
        pg.locator('#__c').screenshot(path=f'{out}/components/{name}.png')
    pg.evaluate("() => { document.getElementById('__c').remove(); document.getElementById('app').style.display = ''; document.getElementById('layer').style.display = ''; }")
    tokens = pg.evaluate("""() => { const cs = getComputedStyle(document.documentElement); const names = ['--bg','--surface','--surface-2','--ink','--ink-soft','--line','--sky','--accent','--accent-ink','--accent-soft','--good','--good-soft','--warm','--warm-soft','--blk','--blk-line']; const o = {}; names.forEach(n => o[n] = cs.getPropertyValue(n).trim()); return o; }""")
    themes = pg.evaluate('() => THEMES')
    pg.close()

    # dark + tablet
    pd = page(390, 844, 'dark'); pd.evaluate(SETUP)
    shot(pd, 'dark-01-home-star-chart')
    pd.evaluate("() => { __show('divmeaning', 0, false); __act('plate', {i:'0'}); __act('plate', {i:'1'}); }"); shot(pd, 'dark-02-practice-sharing')
    pd.evaluate("() => { __show('divmeaning', 1, false); const q = Cur.q; const i = q.options.findIndex(o => String(o.value) !== String(q.answer)); __act('opt', {i: String(i)}); }"); shot(pd, 'dark-03-feedback-wrong')
    pd.evaluate("() => { UI.screen = 'grown'; render(); }"); shot(pd, 'dark-04-grown-up-view')
    tokens_dark = pd.evaluate("""() => { const cs = getComputedStyle(document.documentElement); const names = ['--bg','--surface','--surface-2','--ink','--ink-soft','--line','--sky','--accent','--accent-ink','--accent-soft','--good','--good-soft','--warm','--warm-soft','--blk','--blk-line']; const o = {}; names.forEach(n => o[n] = cs.getPropertyValue(n).trim()); return o; }""")
    pd.close()
    pt = page(820, 1180); pt.evaluate(SETUP)
    shot(pt, 'tablet-01-home-star-chart')
    pt.evaluate("() => { __show('placevalue', 0, false); __act('blk', {d:'h+'}); __act('blk', {d:'t+'}); __act('blk', {d:'o+'}); }"); shot(pt, 'tablet-02-practice-blocks')
    pt.evaluate("() => { __show('multhard', 1, false); }"); shot(pt, 'tablet-03-practice-array')
    pt.close()
    b.close()

json.dump({'light': tokens, 'dark': tokens_dark, 'accentThemes': themes}, open(f'{out}/tokens.raw.json', 'w'), indent=1, ensure_ascii=False)
print('\n'.join(log))
