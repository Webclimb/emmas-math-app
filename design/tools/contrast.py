"""Check WCAG contrast for the token pairs the design relies on. Usage (from the design folder): python3 tools/contrast.py tokens.json"""
import json, sys

def lum(hexv):
    h = hexv.lstrip('#')
    r, g, b = (int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))
    f = lambda c: c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)

def ratio(a, b):
    la, lb = sorted([lum(a), lum(b)], reverse=True)
    return (la + 0.05) / (lb + 0.05)

TEXT = 4.5
GFX = 3.0
PAIRS = [
    ('ink', 'bg', TEXT), ('ink', 'surface', TEXT), ('ink', 'surface-2', TEXT), ('ink', 'accent-soft', TEXT),
    ('ink', 'good-soft', TEXT), ('ink', 'warm-soft', TEXT),
    ('ink-soft', 'bg', TEXT), ('ink-soft', 'surface', TEXT), ('ink-soft', 'surface-2', TEXT),
    ('accent-text', 'surface', TEXT), ('accent-text', 'bg', TEXT), ('accent-text', 'accent-soft', TEXT),
    ('accent-ink', 'accent', TEXT),
    ('good', 'good-soft', TEXT), ('good', 'surface', TEXT),
    ('warm', 'warm-soft', TEXT), ('warm', 'surface', TEXT),
    ('line-strong', 'surface', GFX), ('line-strong', 'bg', GFX), ('line-strong', 'surface-2', GFX),
    ('sky', 'surface', GFX), ('sky', 'surface-2', GFX),
    ('counter-2', 'surface', GFX), ('counter-2', 'surface-2', GFX),
    ('item', 'surface', GFX), ('item', 'surface-2', GFX),
    ('blk-line', 'surface', GFX), ('blk-line', 'blk', GFX),
    ('star-ink', 'star', GFX), ('focus', 'surface', GFX), ('focus', 'bg', GFX),
    ('accent', 'surface', GFX), ('ink', 'surface-2', GFX),
]

def main(path):
    t = json.load(open(path))
    fails = 0
    for theme in ('light', 'dark'):
        c = {k: v['value'] for k, v in t['color'][theme].items() if v['value'].startswith('#')}
        print(f'## {theme}')
        for fg, bg, need in PAIRS:
            r = ratio(c[fg], c[bg])
            ok = r >= need
            fails += not ok
            print(f"{'ok  ' if ok else 'FAIL'} {fg:12} on {bg:12} {r:5.2f} (needs {need})")
    for tid, th in t['accentThemes'].items():
        for theme in ('light', 'dark'):
            base = {k: v['value'] for k, v in t['color'][theme].items() if v['value'].startswith('#')}
            a = th[theme]
            checks = [(a['accent-ink'], a['accent'], TEXT, 'accent-ink on accent'),
                      (a['accent-text'], base['surface'], TEXT, 'accent-text on surface'),
                      (a['accent-text'], base['bg'], TEXT, 'accent-text on bg'),
                      (base['ink'], a['accent-soft'], TEXT, 'ink on accent-soft'),
                      (a['accent-text'], a['accent-soft'], TEXT, 'accent-text on accent-soft')]
            for fg, bg, need, label in checks:
                r = ratio(fg, bg)
                ok = r >= need
                fails += not ok
                print(f"{'ok  ' if ok else 'FAIL'} {tid}/{theme}: {label} {r:5.2f}")
    print('FAILURES:', fails)

if __name__ == '__main__':
    main(sys.argv[1])
