"""Build reference pages: tokens.css from tokens.json, and expand <!--kit:NAME--> placeholders.
Usage (from the design folder): python3 tools/build_ref.py . tools/src
"""
import json, os, re, sys

D, SRC = sys.argv[1], sys.argv[2]
REF = os.path.join(D, 'reference')
T = json.load(open(os.path.join(D, 'tokens.json')))


def block(theme):
    return '\n'.join(f'  --{k}: {v["value"]};' for k, v in T['color'][theme].items())

fonts = T['font']
css = ['/* GENERATED from ../tokens.json by the design build. Reference only: the app generates its own. */',
       ':root, [data-theme="light"] {',
       block('light'),
       f'  --font-display: "{fonts["display"]["family"]}", {fonts["display"]["fallback"]};',
       f'  --font-body: "{fonts["body"]["family"]}", {fonts["body"]["fallback"]};',
       '}',
       '[data-theme="dark"] {', block('dark'), '}']
for tid, th in T['accentThemes'].items():
    if tid == 'cobalt':
        continue
    for theme in ('light', 'dark'):
        sel = f'[data-theme="{theme}"][data-accent="{tid}"]' if theme == 'dark' else f'[data-accent="{tid}"]'
        css.append(sel + ' { ' + ' '.join(f'--{k}: {v};' for k, v in th[theme].items()) + ' }')
os.makedirs(REF, exist_ok=True)
open(os.path.join(REF, 'tokens.css'), 'w').write('\n'.join(css) + '\n')

KIT = {}
for f in os.listdir(D):
    if f.startswith('kit-') and f.endswith('.svg'):
        s = open(os.path.join(D, f)).read().strip()
        s = s.replace('<svg ', '<svg aria-hidden="true" focusable="false" ', 1)
        KIT[f[4:-4]] = s


def expand(html):
    def rep(m):
        name = m.group(1)
        if name not in KIT:
            raise SystemExit(f'missing kit file: {name}')
        return KIT[name]
    return re.sub(r'<!--kit:([a-z0-9-]+)-->', rep, html)

for root, _, files in os.walk(SRC):
    for f in files:
        if not f.endswith('.html'):
            continue
        rel = os.path.relpath(os.path.join(root, f), SRC)
        out = os.path.join(REF, rel)
        os.makedirs(os.path.dirname(out), exist_ok=True)
        open(out, 'w').write(expand(open(os.path.join(root, f)).read()))
        print('built', out)
