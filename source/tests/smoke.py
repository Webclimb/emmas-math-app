import sys, json
from playwright.sync_api import sync_playwright

path = sys.argv[1]
out = sys.argv[2]
errs = []
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 390, 'height': 844}, device_scale_factor=2)
    pg.on('pageerror', lambda e: errs.append('pageerror: ' + str(e)))
    pg.on('console', lambda m: errs.append('console: ' + m.text) if m.type == 'error' and 'fonts.g' not in m.text else None)
    pg.goto('file://' + path)
    pg.wait_for_timeout(1900)
    # welcome -> create learner
    pg.fill('#pname', 'Ava')
    pg.click('button.av >> nth=1')
    pg.click('button[type=submit]')
    pg.wait_for_timeout(200)
    pg.click('[data-act=beginPlace]')
    # placement: answer by first option / type 1 / unsure for builds
    for _ in range(14):
        if pg.locator('[data-act=next]').count() == 0:
            if pg.locator('[data-act=opt]').count():
                pg.click('[data-act=opt] >> nth=0')
            else:
                pg.click('[data-act=unsure]')
        pg.click('[data-act=next]')
        pg.wait_for_timeout(50)
        if pg.locator('[data-act=home]').count():
            break
    pg.click('[data-act=home]')
    pg.wait_for_timeout(200)
    pg.screenshot(path=out + '/home.png', full_page=True)

    # render every skill/stage in the DOM and drive the build widgets
    res = pg.evaluate("""() => {
      const out = [];
      S = {mode:'practice', n:10, i:0, answered:0, correct:0, gems:0, start:Date.now(), events:[], P:null};
      UI.screen = 'practice';
      for (const s of SKILLS) for (let st = 0; st < 3; st++) for (const easy of [true, false]) for (let rep = 0; rep < 6; rep++) {
        try {
          const q = makeQuestion(s.id, st, easy); q.review = false;
          Cur = {q, phase:'answer', hinted:false, hintShown:false, entry:'', chosen:null, fchosen:null, b: q.kind==='build' ? initBuild(q.build) : null, buildMiss:false};
          render();
          ACT.hint(); render();
          if (q.kind === 'build') {
            const bd = q.build, b = Cur.b;
            // solve the build correctly through the real action handlers
            const click = (act, attrs={}) => { const el = document.createElement('button'); el.dataset.act = act; Object.assign(el.dataset, attrs); ACT[act](el, {clientX:0}); };
            switch (bd.type) {
              case 'tenframe': for (let i = bd.preset; i < bd.target; i++) click('cell', {i:String(i)}); click('bcheck'); break;
              case 'blocks': { const H=Math.floor(bd.target/100), T=Math.floor(bd.target/10)%10, O=bd.target%10; for(let i=0;i<H;i++)click('blk',{d:'h+'}); for(let i=0;i<T;i++)click('blk',{d:'t+'}); for(let i=0;i<O;i++)click('blk',{d:'o+'}); click('bcheck'); break; }
              case 'nlplace': click('nlnudge',{d:'1'}); for(let i=1;i<bd.target;i++) click('nlnudge',{d:'1'}); click('bcheck'); break;
              case 'jumps': { let rem = bd.target - bd.start; while (rem >= 10 && bd.tens) { click('jump',{d:'10'}); rem -= 10; } while (rem > 0) { click('jump',{d:'1'}); rem--; } click('jdone'); break; }
              case 'crossout': for (let i = 0; i < bd.k; i++) click('cross',{i:String(i)}); click('bcheck'); break;
              case 'groups': for(let i=1;i<bd.a;i++)click('grp',{d:'a+'}); for(let i=1;i<bd.b;i++)click('grp',{d:'b+'}); click('bcheck'); break;
              case 'rows': for (let i = 0; i < bd.target; i++) click('row',{d:'+'}); click('bcheck'); break;
              case 'share': for (let i = 0; i < bd.n; i++) click('plate',{i:String(i % bd.k)}); break;
              case 'makegroups': for (let i = 0; i < bd.n / bd.k; i++) click('mkgrp'); break;
              case 'shade': for (let i = 0; i < bd.k; i++) click('part',{i:String(i)}); click('bcheck'); break;
            }
            if (q.followup) {
              if (!Cur.b.done) out.push(`${s.id}[${st}] build not done (${bd.type})`);
              else { const i = q.followup.options.findIndex(o => String(o.value) === String(q.followup.answer)); click('fopt', {i:String(i)}); }
            }
            if (Cur.phase !== 'feedback') out.push(`${s.id}[${st}] no feedback after build ${bd.type}`);
            else if (!Cur.ok) out.push(`${s.id}[${st}] correct build marked wrong (${bd.type}) hinted=${Cur.hinted}`);
          } else if (q.kind === 'mc') {
            const i = q.options.findIndex(o => String(o.value) === String(q.answer));
            const el = document.createElement('button'); el.dataset.i = String(i); ACT.opt(el);
            if (!Cur.ok) out.push(`${s.id}[${st}] correct mc marked wrong`);
          } else {
            for (const ch of String(q.answer)) padKey(ch); padKey('ok');
            if (!Cur.ok) out.push(`${s.id}[${st}] correct pad marked wrong`);
          }
          render();
          // also render a wrong-answer feedback
          const q2 = makeQuestion(s.id, st, easy); q2.review = false;
          Cur = {q:q2, phase:'answer', hinted:false, hintShown:false, entry:'', chosen:null, fchosen:null, b: q2.kind==='build' ? initBuild(q2.build) : null, buildMiss:false};
          render(); ACT.unsure(); render();
          if (!document.querySelector('#fb')) out.push(`${s.id}[${st}] no feedback card`);
        } catch (e) { out.push(`${s.id}[${st}] threw ${e.message}`); }
      }
      return out;
    }""")
    errs += res
    # a fresh real session: a build question in the middle of play for the screenshot
    pg.evaluate("""() => { prof.skills.divmeaning.stage = 0; prof.focus = 'divmeaning'; for (const id of ['quantity','numberline','placevalue','makes10','addition','subtraction','multmeaning']) prof.skills[id].mastered = true; UI.screen='home'; render(); }""")
    pg.click('[data-act=start]')
    pg.wait_for_timeout(150)
    # deal two counters for a mid-build look
    if pg.locator('[data-act=plate]').count():
        pg.click('[data-act=plate] >> nth=0'); pg.click('[data-act=plate] >> nth=1')
    pg.screenshot(path=out + '/practice.png', full_page=True)
    # finish the session quickly via unsure / next / event modals
    for _ in range(30):
        if pg.locator('[data-act=eventOk]').count(): pg.click('[data-act=eventOk]'); continue
        if pg.locator('[data-act=more]').count(): break
        if pg.locator('[data-act=next]').count(): pg.click('[data-act=next]'); continue
        if pg.locator('[data-act=unsure]').count(): pg.click('[data-act=unsure]'); continue
    pg.screenshot(path=out + '/feedback_or_summary.png', full_page=False)
    pg.click('[data-act=home]')
    pg.click('[data-act=shop]'); pg.wait_for_timeout(100)
    pg.click('[data-act=home]')
    # hold to open grown-ups
    pg.locator('[data-hold]').scroll_into_view_if_needed()
    box = pg.locator('[data-hold]').bounding_box()
    pg.mouse.move(box['x'] + 10, box['y'] + 10); pg.mouse.down(); pg.wait_for_timeout(1400); pg.mouse.up()
    pg.wait_for_timeout(100)
    if pg.locator('text=Grown-up view').count() == 0:
        errs.append('grown-up view did not open; screen=' + str(pg.evaluate('UI.screen')) + ' holdT=' + str(pg.evaluate('holdT')) + ' cls=' + str(pg.evaluate("(document.querySelector('[data-hold]')||{}).className")))
        pg.evaluate("UI.screen='grown';render()")
    pg.screenshot(path=out + '/grown.png', full_page=True)
    pg.click('[data-act=copyBackup]')
    # dark theme render check
    pg.evaluate("document.documentElement.setAttribute('data-theme','dark')")
    pg.click('[data-act=back]')
    pg.wait_for_timeout(100)
    pg.screenshot(path=out + '/home_dark.png', full_page=False)
    b.close()
print(json.dumps(errs, indent=1) if errs else 'NO UI ERRORS')
