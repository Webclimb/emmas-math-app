"""Generate the Number Sky graphics kit (kit-*.svg) and a contact sheet.

Usage (from the design folder): python3 tools/gen_kit.py .
Colours are CSS custom properties named after tokens.json keys (var(--sky) etc.), each with the
light-theme value as fallback so the files also render standalone. Single-colour icons use currentColor.
No file contains text: numbers and labels are live HTML placed by the component.
"""
import json, math, os, sys

D = sys.argv[1]
T = json.load(open(os.path.join(D, 'tokens.json')))
LIGHT = {k: v['value'] for k, v in T['color']['light'].items()}
DARK = {k: v['value'] for k, v in T['color']['dark'].items()}
FILES = {}  # name -> (svg, group, note)

STAR = 'M24 4L29 17.1L43 17.8L32.1 26.6L35.8 40.2L24 32.5L12.2 40.2L15.9 26.6L5 17.8L19 17.1Z'


def V(tok):
    return f'var(--{tok},{LIGHT[tok]})'


def fill(tok):
    return f'fill:{V(tok)}'


def stroke(tok, w=2, extra=''):
    return f'fill:none;stroke:{V(tok)};stroke-width:{w}{extra}'


def svg(w, h, body):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" '
            f'fill="none" stroke-linecap="round" stroke-linejoin="round">{body}</svg>\n')


def add(name, w, h, body, group, note=''):
    FILES[f'kit-{name}.svg'] = (svg(w, h, body), group, note)


def f2(x):
    return f'{x:.2f}'.rstrip('0').rstrip('.')

# ---------- counters ----------

def disc(cx, cy, r=13):
    return f'<circle cx="{f2(cx)}" cy="{f2(cy)}" r="{r}" style="{fill("sky")}"/>'


def ring(cx, cy, r=13):
    ro = r - 2
    return (f'<circle cx="{f2(cx)}" cy="{f2(cy)}" r="{f2(ro)}" style="{stroke("counter-2", 4)}"/>'
            f'<circle cx="{f2(cx)}" cy="{f2(cy)}" r="{f2(r * 0.3)}" style="{fill("counter-2")}"/>')


def crossed(cx, cy, r=8.5):
    return (f'<circle cx="{f2(cx)}" cy="{f2(cy)}" r="{f2(r - 0.75)}" style="{stroke("line-strong", 1.5, ";stroke-dasharray:2.5 2.5")}"/>'
            f'<path d="M{f2(cx - r * 0.7)} {f2(cy + r * 0.7)}L{f2(cx + r * 0.7)} {f2(cy - r * 0.7)}" style="{stroke("ink-soft", 2)}"/>')

# ---------- ten-frame ----------

def tenframe(given=0, added=0):
    cell, gap, pad = 40, 5, 6
    w = pad * 2 + 5 * cell + 4 * gap
    h = pad * 2 + 2 * cell + gap
    b = f'<rect x="1" y="1" width="{w - 2}" height="{h - 2}" rx="10" style="fill:{V("surface")};stroke:{V("ink")};stroke-width:2"/>'
    k = 0
    for row in range(2):
        for col in range(5):
            x = pad + col * (cell + gap)
            y = pad + row * (cell + gap)
            b += f'<rect x="{x}" y="{y}" width="{cell}" height="{cell}" rx="6" style="fill:{V("surface-2")};stroke:{V("line-strong")};stroke-width:1.5"/>'
            cx, cy = x + cell / 2, y + cell / 2
            if k < given:
                b += disc(cx, cy)
            elif k < given + added:
                b += ring(cx, cy)
            k += 1
    return w, h, b

for nm, g, a in [('empty', 0, 0), ('7', 7, 0), ('given4-added3', 4, 3), ('full', 10, 0)]:
    w, h, b = tenframe(g, a)
    add(f'tenframe-{nm}', w, h, b, 'Ten-frame', 'given = filled disc (sky); added = ring with centre dot (counter-2)')
add('counter-given', 32, 32, disc(16, 16), 'Ten-frame', 'single given counter')
add('counter-added', 32, 32, ring(16, 16), 'Ten-frame', 'single added counter')

# ---------- base-ten blocks (one unit = 10) ----------

def block_rect(x, y, w, h):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" style="fill:{V("blk")};stroke:{V("blk-line")};stroke-width:1.5" vector-effect="non-scaling-stroke"/>'

def grid_lines(x, y, cols, rows, u=10):
    p = ''
    for c in range(1, cols):
        p += f'M{x + c * u} {y}V{y + rows * u}'
    for r in range(1, rows):
        p += f'M{x} {y + r * u}H{x + cols * u}'
    return f'<path d="{p}" style="{stroke("blk-line", 0.75)}" opacity=".7" vector-effect="non-scaling-stroke"/>' if p else ''

add('block-one', 14, 14, block_rect(2, 2, 10, 10), 'Base-ten blocks', 'one unit; rod and flat use the same unit')
add('block-ten', 14, 104, block_rect(2, 2, 10, 100) + grid_lines(2, 2, 1, 10), 'Base-ten blocks', '10 units tall')
add('block-hundred', 104, 104, block_rect(2, 2, 100, 100) + grid_lines(2, 2, 10, 10), 'Base-ten blocks', '10 x 10 units')

# ---------- arrays ----------

def array(rows, cols, kinds, gaps_after=()):
    pitch, r, pad = 24, 8.5, 4
    extra = 6 * len(gaps_after)
    w = pad * 2 + cols * pitch
    h = pad * 2 + rows * pitch + extra
    b = ''
    yoff = 0
    for i in range(rows):
        if i in gaps_after:
            pass
        for j in range(cols):
            cx = pad + j * pitch + pitch / 2
            cy = pad + i * pitch + pitch / 2 + yoff
            k = kinds(i)
            b += disc(cx, cy, r) if k == 'g' else ring(cx, cy, r) if k == 'a' else crossed(cx, cy, r)
        if i in gaps_after:
            yoff += 6
    return w, h, b

for nm, rows, cols, kinds, gaps in [
    ('3x5', 3, 5, lambda i: 'g', ()),
    ('4x6-double-double', 4, 6, lambda i: 'g' if i < 2 else 'a', (1,)),
    ('7x6-five-plus-two', 7, 6, lambda i: 'g' if i < 5 else 'a', (4,)),
    ('10x6-ten-minus-one', 10, 6, lambda i: 'g' if i < 9 else 'x', (8,)),
]:
    w, h, b = array(rows, cols, kinds, gaps)
    add(f'array-{nm}', w, h, b, 'Dot arrays', 'rows are groups; strategy split = 6px gap + second group in rings; crossed row = taken away')

# ---------- number lines ----------
NL_W, NL_H, AX, L, R = 480, 112, 64, 24, 456

def axis(arrows=True):
    b = f'<path d="M{L - 12} {AX}H{R + 12}" style="{stroke("ink", 2.5)}"/>'
    if arrows:
        b += f'<path d="M{L - 4} {AX - 6}L{L - 12} {AX}L{L - 4} {AX + 6}M{R + 4} {AX - 6}L{R + 12} {AX}L{R + 4} {AX + 6}" style="{stroke("ink", 2.5)}"/>'
    return b

def ticks(n, major_every=None, minor_h=9, major_h=16, majors=None, skip=()):
    b = ''
    for i in range(n + 1):
        if i in skip:
            continue
        x = L + (R - L) * i / n
        is_major = (majors is not None and i in majors) or (major_every and i % major_every == 0) or i in (0, n)
        hh = major_h if is_major else minor_h
        wdt = 2.5 if is_major else 1.5
        b += f'<path d="M{f2(x)} {AX - hh / 2}V{AX + hh / 2}" style="{stroke("ink", wdt)}"/>'
    return b

def xpos(v, lo, hi):
    return L + (R - L) * (v - lo) / (hi - lo)

def marker(x, tok='accent'):
    return f'<circle cx="{f2(x)}" cy="{AX}" r="10" style="fill:{V(tok)};stroke:{V("surface")};stroke-width:3"/>'

def pointer(x):
    return f'<path d="M{f2(x)} {AX - 12}L{f2(x - 9)} {AX - 28}H{f2(x + 9)}Z" style="fill:{V("ink")}"/>'

add('numberline-0-20', NL_W, NL_H, axis() + ticks(20, 5), 'Number line', 'labels: live text centred 22px below major ticks')
add('numberline-0-20-marker', NL_W, NL_H, axis() + ticks(20, 5) + marker(xpos(12, 0, 20)), 'Number line', 'marker = her placement (accent)')
add('numberline-0-100-pointer', NL_W, NL_H, axis() + ticks(10, 5) + pointer(xpos(70, 0, 100)), 'Number line', 'pointer = the number to read')
add('numberline-bare', NL_W, NL_H, axis() + ticks(1), 'Number line', 'estimation: labelled only at the ends')

# jumps 34 -> 57 on 30..60: +10, +10, +1, +1, +1
lo, hi = 30, 60
b = axis() + ticks(30, 10, minor_h=8)
pts = [34, 44, 54, 55, 56, 57]
for a_, c_ in zip(pts, pts[1:]):
    x1, x2 = xpos(a_, lo, hi), xpos(c_, lo, hi)
    hgt = 30 if c_ - a_ >= 10 else 16
    mx = (x1 + x2) / 2
    b += f'<path d="M{f2(x1)} {AX - 4}Q{f2(mx)} {AX - 4 - hgt * 2} {f2(x2)} {AX - 4}" style="{stroke("accent-text", 2.2)}"/>'
    b += f'<path d="M{f2(x2 - 5)} {AX - 9}L{f2(x2)} {AX - 4}L{f2(x2 + 1)} {AX - 11}" style="{stroke("accent-text", 2.2)}"/>'
b += f'<circle cx="{f2(xpos(34, lo, hi))}" cy="{AX}" r="7" style="{fill("sky")}"/>' + marker(xpos(57, lo, hi))
add('numberline-jumps', NL_W, NL_H, b, 'Number line', 'start dot (sky), arcs (accent-text, taller for tens), end marker; label at most 6 jumps, group the rest')

# estimate feedback: her mark at 62, true value at 70, benchmarks 0/25/50/75/100
b = axis() + ticks(1)
for v in (25, 50, 75):
    x = xpos(v, 0, 100)
    b += f'<path d="M{f2(x)} {AX - 10}V{AX + 10}" style="{stroke("line-strong", 2, ";stroke-dasharray:3 3")}"/>'
hx, tx = xpos(62, 0, 100), xpos(70, 0, 100)
b += f'<rect x="{f2(hx)}" y="{AX - 5}" width="{f2(tx - hx)}" height="10" style="{fill("accent-soft")}"/>'
b += f'<path d="M{f2(tx)} {AX - 22}V{AX + 22}" style="{stroke("good", 3)}"/>'
b += f'<path d="M{f2(tx)} {AX - 34}L{f2(tx + 7)} {AX - 26}L{f2(tx)} {AX - 18}L{f2(tx - 7)} {AX - 26}Z" style="fill:{V("good")}"/>'
b += marker(hx)
add('numberline-estimate-feedback', NL_W, NL_H, b, 'Number line', 'NEW (F-12.AC-2): her mark (accent dot), true position (good line + diamond), benchmarks (dashed), gap band (accent-soft)')
add('numberline-fractions-0-1', NL_W, NL_H, axis() + ticks(8, majors={0, 4, 8}, minor_h=8), 'Number line', 'eighths; halves and wholes are major ticks')
add('numberline-decimals-0-1', NL_W, NL_H, axis() + ticks(10, 5), 'Number line', 'tenths; 0.5 major')
b = axis() + ticks(20, 5)
x0 = xpos(0, -10, 10)
b += f'<path d="M{f2(x0)} {AX - 14}V{AX + 14}" style="{stroke("ink", 4)}"/>'
add('numberline-negative', NL_W, NL_H, b, 'Number line', 'NEW: -10 to 10; zero is the heaviest tick; smaller always on the left')

# ---------- fractions ----------
b = ''
for i in range(4):
    b += f'<rect x="{8 + i * 76}" y="8" width="76" height="48" style="fill:{V("sky") if i < 3 else V("surface")};stroke:{V("ink")};stroke-width:2"/>'
add('fraction-bar-3of4', 320, 64, b, 'Fractions', 'shaded parts = sky fill; unshaded = surface; equal parts always')
b = ''
cx = cy = 60
for i in range(8):
    a1 = -math.pi / 2 + i * math.pi / 4
    a2 = a1 + math.pi / 4
    x1, y1 = cx + 54 * math.cos(a1), cy + 54 * math.sin(a1)
    x2, y2 = cx + 54 * math.cos(a2), cy + 54 * math.sin(a2)
    col = V('sky') if i < 3 else V('surface')
    b += f'<path d="M{cx} {cy}L{f2(x1)} {f2(y1)}A54 54 0 0 1 {f2(x2)} {f2(y2)}Z" style="fill:{col};stroke:{V("ink")};stroke-width:2"/>'
add('fraction-circle-3of8', 120, 120, b, 'Fractions', '')

# ---------- bar model ----------
def barmodel(unknown=False):
    b = f'<rect x="4" y="4" width="312" height="48" rx="6" style="fill:{V("accent-soft")};stroke:{V("ink")};stroke-width:2"/>'
    p1 = 312 * 17 / 52
    b += f'<rect x="4" y="64" width="{f2(p1)}" height="48" rx="6" style="fill:{V("surface-2")};stroke:{V("ink")};stroke-width:2"/>'
    if unknown:
        b += f'<rect x="{f2(4 + p1 + 4)}" y="64" width="{f2(312 - p1 - 4)}" height="48" rx="6" style="fill:{V("surface")};stroke:{V("accent-text")};stroke-width:2.5;stroke-dasharray:6 5"/>'
    else:
        b += f'<rect x="{f2(4 + p1 + 4)}" y="64" width="{f2(312 - p1 - 4)}" height="48" rx="6" style="fill:{V("surface-2")};stroke:{V("ink")};stroke-width:2"/>'
    return b
add('barmodel-whole-parts', 320, 116, barmodel(), 'Bar model', 'whole on top (accent-soft), parts below; widths proportional')
add('barmodel-unknown', 320, 116, barmodel(True), 'Bar model', 'unknown part: dashed accent-text outline on surface')

# ---------- fact triangle ----------
def facttri(missing=False):
    b = f'<path d="M120 40L44 156H196Z" style="fill:{V("surface-2")};stroke:{V("line-strong")};stroke-width:2"/>'
    b += f'<circle cx="120" cy="40" r="32" style="fill:{V("surface")};stroke:{V("ink")};stroke-width:3"/>'
    b += f'<circle cx="44" cy="156" r="32" style="fill:{V("surface")};stroke:{V("sky")};stroke-width:3"/>'
    if missing:
        b += f'<circle cx="196" cy="156" r="32" style="fill:{V("surface")};stroke:{V("accent-text")};stroke-width:3;stroke-dasharray:6 5"/>'
    else:
        b += f'<circle cx="196" cy="156" r="32" style="fill:{V("surface")};stroke:{V("sky")};stroke-width:3"/>'
    return b
add('facttriangle', 240, 196, facttri(), 'Fact triangle', 'top node = product (ink ring); bottom = factors (sky rings); numbers and operators are live text')
add('facttriangle-missing', 240, 196, facttri(True), 'Fact triangle', 'missing node: dashed accent-text')

# ---------- containers ----------
add('container-plate', 140, 140, f'<circle cx="70" cy="70" r="68" style="fill:{V("surface-2")};stroke:{V("ink")};stroke-width:2"/>', 'Containers', 'sharing, equal groups: round')
add('container-box', 140, 140, f'<rect x="2" y="2" width="136" height="136" rx="16" style="fill:{V("surface-2")};stroke:{V("ink")};stroke-width:2"/>', 'Containers', 'grouping: square')

# ---------- items (24 x 24, one hue) ----------
I, ID = V('item'), V('item-detail')
items = {
    'ticket': f'<path d="M3 5h18a1.5 1.5 0 0 1 1.5 1.5v3a2.5 2.5 0 0 0 0 5v3A1.5 1.5 0 0 1 21 19H3a1.5 1.5 0 0 1-1.5-1.5v-3a2.5 2.5 0 0 0 0-5v-3A1.5 1.5 0 0 1 3 5z" style="fill:{I}"/><path d="M16 7.5v9" style="stroke:{ID};stroke-width:1.5;stroke-dasharray:1.5 1.5"/>',
    'token': f'<path d="M12 1.5l9 5.2v10.6l-9 5.2-9-5.2V6.7z" style="fill:{I}"/><path d="M12 7l4.3 2.5v5L12 17l-4.3-2.5v-5z" style="stroke:{ID};stroke-width:1.5"/>',
    'card': f'<rect x="5" y="2" width="14" height="20" rx="2.5" style="fill:{I}"/><path d="M12 8l3 4-3 4-3-4z" style="fill:{ID}"/>',
    'coin': f'<circle cx="12" cy="12" r="10.5" style="fill:{I}"/><circle cx="12" cy="12" r="6.5" style="stroke:{ID};stroke-width:1.5"/>',
    'bill': f'<rect x="1.5" y="6" width="21" height="12" rx="2" style="fill:{I}"/><circle cx="12" cy="12" r="3" style="stroke:{ID};stroke-width:1.5"/><path d="M5 9.5v5M19 9.5v5" style="stroke:{ID};stroke-width:1.5"/>',
    'puck': f'<ellipse cx="12" cy="15" rx="10" ry="4.5" style="fill:{I}"/><rect x="2" y="9" width="20" height="6" style="fill:{I}"/><ellipse cx="12" cy="9" rx="10" ry="4.5" style="fill:{I};stroke:{ID};stroke-width:1.5"/>',
    'ball': f'<circle cx="12" cy="12" r="10.5" style="fill:{I}"/><path d="M4.5 5.5c4 2.5 4 10.5 0 13M19.5 5.5c-4 2.5-4 10.5 0 13" style="stroke:{ID};stroke-width:1.5"/>',
    'cone': f'<path d="M12 2.5l7 16.5H5z" style="fill:{I}"/><path d="M8.6 11h6.8" style="stroke:{ID};stroke-width:2"/><rect x="2.5" y="19" width="19" height="3" rx="1" style="fill:{I}"/>',
    'bead': f'<circle cx="12" cy="12" r="10" style="fill:{I}"/><circle cx="12" cy="12" r="3.2" style="fill:{ID}"/>',
    'tile': f'<rect x="2.5" y="2.5" width="19" height="19" rx="4" style="fill:{I}"/><rect x="7.5" y="7.5" width="9" height="9" rx="1.5" style="stroke:{ID};stroke-width:1.5"/>',
}
themes = {'ticket': 'Games', 'token': 'Games', 'card': 'Games', 'coin': 'Money', 'bill': 'Money',
          'puck': 'Sport', 'ball': 'Sport', 'cone': 'Sport', 'bead': 'Neutral (default)', 'tile': 'Neutral (default)'}
for k, body in items.items():
    add(f'item-{k}', 24, 24, body, 'Items', f'theme: {themes[k]}')

# ---------- operation meaning ----------
def dots(coords, tok='sky', r=5):
    return ''.join(f'<circle cx="{x}" cy="{y}" r="{r}" style="fill:{V(tok)}"/>' for x, y in coords)
arrow = lambda x1, x2, y=32: f'<path d="M{x1} {y}H{x2}M{x2 - 6} {y - 6}L{x2} {y}L{x2 - 6} {y + 6}" style="{stroke("ink", 2.2)}"/>'
b = dots([(12, 22), (26, 22)]) + dots([(12, 42), (26, 42), (40, 42)], 'counter-2') + arrow(52, 84)
b += f'<rect x="94" y="12" width="60" height="40" rx="10" style="{stroke("ink", 2)}"/>' + dots([(108, 26), (124, 26)]) + dots([(108, 40), (124, 40), (140, 40)], 'counter-2')
add('op-put-together', 160, 64, b, 'Operation meaning', 'joining two amounts')
b = dots([(14, 32), (32, 32), (50, 32)])
b += f'<circle cx="86" cy="32" r="5" style="{stroke("line-strong", 2, ";stroke-dasharray:2.5 2.5")}"/><circle cx="104" cy="32" r="5" style="{stroke("line-strong", 2, ";stroke-dasharray:2.5 2.5")}"/>'
b += f'<path d="M86 22C96 8 122 6 136 14M130 8l6 6-8 3" style="{stroke("ink", 2.2)}"/>' + dots([(140, 32), (150, 44)], 'counter-2')
add('op-take-away', 160, 64, b, 'Operation meaning', 'some leave the group')
b = ''
for i in range(3):
    x = 6 + i * 52
    b += f'<rect x="{x}" y="14" width="44" height="36" rx="10" style="{stroke("ink", 2)}"/>' + dots([(x + 14, 32), (x + 30, 32)])
add('op-equal-groups', 160, 64, b, 'Operation meaning', 'groups of the same size')
b = dots([(8, 22), (20, 22), (32, 22), (8, 42), (20, 42), (32, 42)]) + arrow(44, 68)
for i in range(3):
    cx = 92 + i * 28
    b += f'<circle cx="{cx}" cy="32" r="13" style="{stroke("ink", 2)}"/>' + dots([(cx - 4, 32), (cx + 5, 32)], r=3.5)
add('op-share', 160, 64, b, 'Operation meaning', 'dealt out equally')

# ---------- word-problem diagrams (slots hold live numbers) ----------
def slot(x, y, unknown=False, w=56, h=44):
    if unknown:
        return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" style="fill:{V("surface")};stroke:{V("accent-text")};stroke-width:2.5;stroke-dasharray:6 5"/>'
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="10" style="fill:{V("surface")};stroke:{V("ink")};stroke-width:2"/>'

def wp_total(u=None):
    b = f'<rect x="4" y="4" width="312" height="52" rx="8" style="fill:{V("accent-soft")};stroke:{V("ink")};stroke-width:2"/>' + slot(132, 8, u == 'whole')
    b += f'<rect x="4" y="68" width="124" height="52" rx="8" style="fill:{V("surface-2")};stroke:{V("ink")};stroke-width:2"/>' + slot(38, 72, u == 'part1')
    b += f'<rect x="136" y="68" width="180" height="52" rx="8" style="fill:{V("surface-2")};stroke:{V("ink")};stroke-width:2"/>' + slot(198, 72, u == 'part2')
    return b
add('wp-total', 320, 124, wp_total(), 'Word-problem diagrams', 'NEW (F-11) Total: whole over two parts; three slots')
add('wp-total-unknown-whole', 320, 124, wp_total('whole'), 'Word-problem diagrams', 'unknown can sit in any slot')

def wp_change(u=None):
    b = slot(4, 40, u == 'start', 72, 52)
    b += f'<path d="M84 66H232M224 58l8 8-8 8" style="{stroke("ink", 2.5)}"/>' + slot(130, 10, u == 'change', 56, 44)
    b += slot(244, 40, u == 'end', 72, 52)
    return b
add('wp-change', 320, 100, wp_change(), 'Word-problem diagrams', 'NEW Change: start, change on the arrow, end')
add('wp-change-unknown-start', 320, 100, wp_change('start'), 'Word-problem diagrams', '')

def wp_diff(u=None):
    b = f'<rect x="4" y="8" width="230" height="40" rx="8" style="fill:{V("surface-2")};stroke:{V("ink")};stroke-width:2"/>'
    b += slot(250, 6, u == 'big')
    b += f'<rect x="4" y="60" width="140" height="40" rx="8" style="fill:{V("surface-2")};stroke:{V("ink")};stroke-width:2"/>'
    b += slot(250, 58, u == 'small')
    b += f'<path d="M150 80H234M150 72v16M234 72v16" style="{stroke("accent-text", 2.2)}"/>'
    b += slot(164, 108, u == 'diff')
    b += f'<path d="M192 100v8" style="{stroke("accent-text", 2.2)}"/>'
    return b
add('wp-difference', 310, 156, wp_diff(), 'Word-problem diagrams', 'NEW Difference: two bars, gap bracketed; slots for each bar and the difference')
add('wp-difference-unknown-diff', 310, 156, wp_diff('diff'), 'Word-problem diagrams', '')

def wp_groups(u=None):
    b = ''
    for i in range(3):
        cx = 52 + i * 92
        b += f'<circle cx="{cx}" cy="44" r="40" style="fill:{V("surface-2")};stroke:{V("ink")};stroke-width:2"/>' + slot(cx - 28, 22, u == 'size')
    b += f'<path d="M12 96c0 10 8 12 18 12h110l10 10 10-10h110c10 0 18-2 18-12" style="{stroke("ink", 2.2)}"/>'
    b += slot(132, 124, u == 'total')
    return b
add('wp-equal-groups', 300, 172, wp_groups(), 'Word-problem diagrams', 'NEW Equal groups: group circles with size slots, braced to a total slot; group count is the number of circles (up to 10, then a count slot)')
add('wp-equal-groups-unknown-size', 300, 172, wp_groups('size'), 'Word-problem diagrams', '')

def wp_times(u=None):
    b = f'<rect x="4" y="8" width="80" height="40" rx="6" style="fill:{V("surface-2")};stroke:{V("ink")};stroke-width:2"/>' + slot(256, 6, u == 'one')
    for i in range(3):
        b += f'<rect x="{4 + i * 80}" y="64" width="80" height="40" rx="6" style="fill:{V("accent-soft")};stroke:{V("ink")};stroke-width:2"/>'
    b += slot(256, 62, u == 'many')
    b += f'<path d="M4 116H244M4 110v12M244 110v12" style="{stroke("accent-text", 2.2)}"/>' + slot(96, 124, u == 'times', 56, 40)
    return b
add('wp-times-as-many', 316, 168, wp_times(), 'Word-problem diagrams', 'NEW Times as many: one unit bar, a bar of N equal units, multiplier slot under the brace')
add('wp-times-as-many-unknown-many', 316, 168, wp_times('many'), 'Word-problem diagrams', '')

# ---------- decimal grid and percent bar (F-21, later) ----------
b = f'<rect x="2" y="2" width="200" height="200" style="fill:{V("surface")};stroke:{V("ink")};stroke-width:2"/>'
for n in range(37):
    r_, c_ = divmod(n, 10)
    b += f'<rect x="{2 + c_ * 20}" y="{2 + r_ * 20}" width="20" height="20" style="{fill("sky")}"/>'
p = ''.join(f'M{2 + i * 20} 2V202M2 {2 + i * 20}H202' for i in range(1, 10))
b += f'<path d="{p}" style="{stroke("ink-soft", 1)}"/>'
add('decimal-grid-0-37', 204, 204, b, 'Decimals and percent', 'F-21 (later): 10 x 10 grid, 37 hundredths shaded')
b = f'<rect x="4" y="8" width="312" height="40" rx="6" style="fill:{V("surface")};stroke:{V("ink")};stroke-width:2"/><rect x="4" y="8" width="{312 * 0.6}" height="40" rx="6" style="{fill("sky")}"/>'
b += ''.join(f'<path d="M{4 + 31.2 * i:.1f} 8V{48 if i % 5 == 0 else 20}" style="{stroke("ink", 1.5)}"/>' for i in range(1, 10))
add('percent-bar-60', 320, 56, b, 'Decimals and percent', 'F-21 (later): tens of percent marked; 50% tick full height')

# ---------- stations (star map) ----------
STAT = {
    'lit': (f'fill:{V("ink")};stroke:{V("ink")};stroke-width:3', f'fill:{V("star")};stroke:{V("star-ink")};stroke-width:2.5'),
    'pending': (f'fill:{V("surface")};stroke:{V("ink")};stroke-width:3;stroke-dasharray:5 4', f'fill:{V("star")};stroke:{V("star-ink")};stroke-width:2.5'),
    'now': (f'fill:{V("accent")};stroke:{V("accent")};stroke-width:3', f'fill:none;stroke:{V("accent-ink")};stroke-width:4'),
    'open': (f'fill:{V("surface")};stroke:{V("ink")};stroke-width:3', f'fill:none;stroke:{V("ink")};stroke-width:3.5'),
    'locked': (f'fill:{V("surface-2")};stroke:{V("line-strong")};stroke-width:2;stroke-dasharray:4 4', f'fill:none;stroke:{V("line-strong")};stroke-width:3'),
}
for k, (rs, ss) in STAT.items():
    add(f'station-{k}', 48, 48, f'<circle cx="24" cy="24" r="22" style="{rs}"/><g transform="translate(10 10) scale(.5833)"><path d="{STAR}" style="{ss}"/></g>', 'Star map', {'lit': 'skill mastered', 'pending': 'almost lit: earned, confirmed on a later day (F-7.AC-6)', 'now': "current focus; always paired with the word 'Now'", 'open': 'available', 'locked': 'not yet open'}[k])
add('star', 48, 48, f'<path d="{STAR}" fill="currentColor"/>', 'Star map', 'plain star, currentColor')
add('gem', 24, 24, f'<path d="M6 4h12l4 5-10 11L2 9z" style="fill:{V("star")};stroke:{V("star-ink")};stroke-width:1.6"/><path d="M2 9h20M9 4l3 16 3-16" style="stroke:{V("star-ink")};stroke-width:1" opacity=".45"/>', 'Interface', 'currency; always with the number beside it')
add('badge-level-up', 64, 64, f'<circle cx="32" cy="32" r="30" style="fill:{V("accent-soft")};stroke:{V("accent")};stroke-width:2.5"/><path d="M32 46V20M22 30l10-10 10 10" style="{stroke("accent-text", 4)}"/>', 'Interface', '')
add('badge-switch-level', 64, 64, f'<circle cx="32" cy="32" r="30" style="fill:{V("surface-2")};stroke:{V("ink")};stroke-width:2.5"/><path d="M18 26h26M38 20l6 6-6 6M46 40H20M26 34l-6 6 6 6" style="{stroke("ink", 3.5)}"/>', 'Interface', 'step down a level: neutral, never warm or red')
add('badge-star-lit', 96, 96, f'<circle cx="48" cy="48" r="44" style="fill:{V("ink")}"/><g transform="translate(18 18) scale(1.25)"><path d="{STAR}" style="fill:{V("star")};stroke:{V("star-ink")};stroke-width:2"/></g>', 'Interface', 'the star-lighting moment (replaces confetti)')

# ---------- icons (24, currentColor) ----------
icons = {
    'close': 'M6 6l12 12M18 6L6 18',
    'read-aloud': 'M4 9h4l5-4v14l-5-4H4zM16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12',
    'hint': 'M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z',
    'backspace': 'M21 5H9l-6 7 6 7h12zM12.5 9.5l5 5M17.5 9.5l-5 5',
    'left': 'M15 5l-7 7 7 7',
    'right': 'M9 5l7 7-7 7',
    'arrow-right': 'M5 12h14M13 6l6 6-6 6',
    'check': 'M5 12.5l4.5 4.5L19 7',
    'not-yet': 'M4 12a8 8 0 1 0 2.5-5.8M4 4v5h5',
    'undo': 'M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3',
    'not-sure': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .8-1 1.5v.5M12 17h.01',
    'show-me-how': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM10 8.5l5 3.5-5 3.5z',
    'replay': 'M20 12a8 8 0 1 1-2.5-5.8M20 4v5h-5',
    'skip': 'M5 5l8 7-8 7zM17 5v14',
    'report': 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
    'settings': 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z',
    'home': 'M3 11l9-7 9 7M5 9.5V20h5v-6h4v6h5V9.5',
    'print': 'M7 9V3h10v6M7 17H4v-7h16v7h-3M7 14h10v7H7z',
    'copy': 'M9 9h11v11H9zM5 15H4V4h11v1',
    'info': 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 11v6M12 7.5h.01',
    'plus': 'M12 5v14M5 12h14',
    'minus': 'M5 12h14',
}
for k, d in icons.items():
    add(f'icon-{k}', 24, 24, f'<path d="{d}" stroke="currentColor" stroke-width="2.2"/>', 'Icons', '')

# ---------- avatars ----------
add('avatar-frame-square', 56, 56, f'<rect x="0" y="0" width="56" height="56" rx="14" style="{fill("accent")}"/>', 'Avatars', 'monogram frame (B default): her initial as live text in accent-ink, display face 700, 50% of the frame size')
add('avatar-frame-circle', 56, 56, f'<circle cx="28" cy="28" r="28" style="{fill("accent")}"/>', 'Avatars', 'monogram frame')
add('avatar-frame-roundel', 56, 56, f'<circle cx="28" cy="28" r="24" style="fill:{V("surface")};stroke:{V("accent")};stroke-width:7"/><rect x="0" y="21" width="56" height="14" rx="3" style="{fill("ink")}"/>', 'Avatars', 'transit-roundel frame: initial or nickname sits on the bar in surface text')
add('avatar-frame-ticket', 56, 56, f'<path d="M6 8h44a4 4 0 0 1 4 4v8a8 8 0 0 0 0 16v8a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4v-8a8 8 0 0 0 0-16v-8a4 4 0 0 1 4-4z" style="{fill("accent")}"/>', 'Avatars', 'monogram frame')

def emblem(inner):
    return f'<rect x="0" y="0" width="56" height="56" rx="14" style="{fill("ink")}"/>' + inner
add('avatar-emblem-orbit', 56, 56, emblem(f'<ellipse cx="28" cy="28" rx="19" ry="9" transform="rotate(-25 28 28)" style="{stroke("surface", 2.5)}"/><circle cx="28" cy="28" r="7" style="{fill("star")}"/><circle cx="44" cy="20" r="3" style="{fill("surface")}"/>'), 'Avatars', 'emblem option')
add('avatar-emblem-comet', 56, 56, emblem(f'<path d="M12 44L34 22" style="{stroke("surface", 3)}" opacity=".6"/><path d="M16 46L36 26" style="{stroke("surface", 2)}" opacity=".35"/><circle cx="38" cy="18" r="7" style="{fill("star")}"/>'), 'Avatars', 'emblem option')
add('avatar-emblem-mountain', 56, 56, emblem(f'<path d="M8 42l14-20 8 11 6-7 12 16z" style="{fill("surface")}"/><circle cx="40" cy="15" r="5" style="{fill("star")}"/>'), 'Avatars', 'emblem option')
add('avatar-emblem-wave', 56, 56, emblem(f'<path d="M8 30c5-6 10-6 15 0s10 6 15 0 7-5 10-2M8 40c5-6 10-6 15 0s10 6 15 0 7-5 10-2" style="{stroke("surface", 3)}"/><circle cx="40" cy="16" r="4" style="{fill("star")}"/>'), 'Avatars', 'emblem option')
add('avatar-emblem-compass', 56, 56, emblem(f'<circle cx="28" cy="28" r="17" style="{stroke("surface", 2.5)}"/><path d="M28 14l5 14-5 14-5-14z" style="{fill("star")}"/><path d="M28 28l5 0-5 14-5-14z" style="{fill("surface")}" opacity=".85"/>'), 'Avatars', 'emblem option')
add('avatar-emblem-constellation', 56, 56, emblem(f'<path d="M12 38L22 18l12 8 10-12" style="{stroke("surface", 2)}" opacity=".7"/><circle cx="12" cy="38" r="3.5" style="{fill("star")}"/><circle cx="22" cy="18" r="3" style="{fill("star")}"/><circle cx="34" cy="26" r="4" style="{fill("star")}"/><circle cx="44" cy="14" r="2.5" style="{fill("star")}"/>'), 'Avatars', 'emblem option')

# ---------- write files ----------
for name, (s, _, _) in FILES.items():
    with open(os.path.join(D, name), 'w') as fh:
        fh.write(s)

# ---------- contact sheet ----------
def css_vars(theme):
    src = T['color'][theme]
    return ';'.join(f'--{k}:{v["value"]}' for k, v in src.items())

groups = {}
for name, (s, g, note) in FILES.items():
    groups.setdefault(g, []).append((name, s, note))
html = ['<!doctype html><html lang="en-CA"><head><meta charset="utf-8"><title>Number Sky graphics kit</title>',
        '<link href="https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet">',
        '<style>',
        f':root{{{css_vars("light")}}}',
        f'[data-theme="dark"]{{{css_vars("dark")}}}',
        'body{margin:0;background:var(--bg);color:var(--ink);font-family:"Atkinson Hyperlegible",Verdana,sans-serif;font-size:15px}',
        'main{max-width:1240px;margin:0 auto;padding:32px}',
        'h1,h2{font-family:"Space Grotesk",sans-serif}h1{margin:0 0 4px;font-size:30px}h2{font-size:20px;margin:32px 0 12px}',
        '.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}',
        '.cell{background:var(--surface);border:1.5px solid var(--ink);border-radius:12px;padding:14px;display:flex;flex-direction:column;gap:10px}',
        '.art{min-height:110px;display:flex;align-items:center;justify-content:center;color:var(--ink)}',
        '.art svg{max-width:100%;height:auto;max-height:180px}.art svg[width="24"],.art svg[width="32"]{width:64px;height:64px}.art svg[width="14"]{width:28px;height:28px}',
        '.name{font-weight:700;font-size:13px;word-break:break-all}.note{font-size:13px;color:var(--ink-soft)}',
        'button{font:inherit;font-weight:700;height:44px;padding:0 16px;border-radius:10px;border:1.5px solid var(--ink);background:var(--surface);color:var(--ink);cursor:pointer}',
        '</style></head><body data-theme="light"><main>',
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap"><div><h1>Number Sky graphics kit</h1>',
        f'<p style="margin:0;color:var(--ink-soft)">{len(FILES)} SVGs, direction B (Star Lines). Colours come from tokens.json through CSS variables.</p></div>',
        '<button onclick="document.body.dataset.theme=document.body.dataset.theme===\'dark\'?\'light\':\'dark\'">Light / dark</button></div>']
for g, lst in groups.items():
    html.append(f'<h2>{g}</h2><div class="grid">')
    for name, s, note in lst:
        html.append(f'<div class="cell"><div class="art">{s}</div><div class="name">{name}</div>' + (f'<div class="note">{note}</div>' if note else '') + '</div>')
    html.append('</div>')
html.append('</main></body></html>')
with open(os.path.join(D, 'kit-index.html'), 'w') as fh:
    fh.write('\n'.join(html))
print(len(FILES), 'svg files written')
