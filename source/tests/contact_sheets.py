import os, base64, html, sys
from playwright.sync_api import sync_playwright
os.chdir(sys.argv[1])
def uri(p, mime): return f"data:{mime};base64," + base64.b64encode(open(p,'rb').read()).decode()
svgs = sorted(os.listdir('svg')); comps = sorted(os.listdir('components')); screens = sorted(os.listdir('screens'))
css = "body{margin:0;padding:24px;font:14px Verdana,sans-serif;background:#EEF1F9;color:#19203F}h1{font-size:22px;margin:0 0 16px}.g{display:grid;gap:14px}.t{background:#fff;border-radius:12px;padding:12px;display:flex;flex-direction:column;align-items:center;gap:8px;justify-content:space-between}.t img{max-width:100%;max-height:170px}.t span{font-size:11px;color:#4D5679;text-align:center;word-break:break-all}"
def sheet(title, files, folder, mime, cols, w, imgh=None):
    tiles = ''.join(f'<div class="t"><img src="{uri(os.path.join(folder,f), mime)}"{f" style=max-height:{imgh}px" if imgh else ""}><span>{html.escape(f)}</span></div>' for f in files)
    return f'<!DOCTYPE html><meta charset=utf-8><style>{css}.g{{grid-template-columns:repeat({cols},1fr)}}body{{width:{w}px}}</style><h1>{title}</h1><div class=g>{tiles}</div>'
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, doc, w in [('contact-sheet-svg', sheet('Number Sky v1: vector assets (standalone SVG files)', svgs, 'svg', 'image/svg+xml', 6, 1300), 1348),
                         ('contact-sheet-components', sheet('Number Sky v1: components and composite graphics (PNG captures)', comps, 'components', 'image/png', 4, 1300), 1348),
                         ('contact-sheet-screens', sheet('Number Sky v1: screens (phone 390 px unless named dark or tablet)', screens, 'screens', 'image/png', 10, 2200, 330), 2248)]:
        pg = b.new_page(viewport={'width': w, 'height': 900}); pg.set_content(doc); pg.wait_for_timeout(300)
        pg.screenshot(path=name + '.png', full_page=True); pg.close()
    b.close()
