from lib import *

SOLE = "M6 -14 H{L} Q{L2} -14 {L1} 2 Q{Lm} {T} {Lm2} {T} H20 Q4 {T} 6 2 Z"


def _f(front):
    return (lambda p: p) if front else back


def sole(s, length, pal, th=16):
    L = length
    d = SOLE.format(L=L, L2=L + 18, L1=L + 14, Lm=L + 6, Lm2=L - 18, T=th)
    sid, c = s.tube2(d, pal, (0, 8), (0, 7))
    s.outline(sid)


def shoe(s, front, x, y):
    f = _f(front)
    B, D, I = f(LEATHER), f(LDARK), f(IRON)
    s.add(f'<g transform="translate({x} {y})">')
    sole(s, 290, D)
    up = "M14 -10 C0 -60 4 -130 22 -168 L92 -172 Q118 -130 160 -114 C226 -100 276 -92 296 -62 Q310 -34 294 -10 Z"
    sid, c = s.tube2(up, B)
    s.add(f'<g clip-path="url(#{c})"><path d="M142 -122 Q158 -70 142 -10" fill="none" stroke="{B[3]}" stroke-width="4.5"/></g>')
    s.outline(sid)
    s.add(f'<path d="M24 -164 Q58 -184 94 -170 Q58 -158 24 -164 Z" fill="{darken(B[3], 0.6)}" stroke-width="4.5"/>')
    dd = 'M16 -118 Q76 -124 126 -134'
    s.add(f'<path d="{dd}" fill="none" stroke-width="20"/><path d="{dd}" fill="none" stroke="{D[1]}" stroke-width="9"/>')
    buckle(s, 108, -128, 20, 26, I)
    s.add('</g>')


def sapatos():
    s = SVG('Sapatos', 512, 512)
    shoe(s, False, 124, 296)
    shoe(s, True, 80, 376)
    s.write('sapatos')


def sandal(s, front, x, y):
    f = _f(front)
    B, D = f(LEATHER), f(LDARK)
    s.add(f'<g transform="translate({x} {y})">')
    straps = ['M30 -12 C20 -60 26 -110 46 -140',
              'M36 -142 Q74 -162 112 -140 Q76 -126 36 -142',
              'M110 -138 C150 -110 190 -82 236 -56',
              'M196 -12 Q210 -76 258 -66 Q284 -52 286 -12']
    for dd in straps:
        s.add(f'<path d="{dd}" fill="none" stroke-width="26"/>')
    for dd in straps:
        s.add(f'<path d="{dd}" fill="none" stroke="{D[1]}" stroke-width="13"/>')
    s.add(f'<path d="M206 -30 Q216 -66 254 -62" fill="none" stroke="{D[0]}" stroke-width="5"/>')
    s.add(f'<path d="M50 -150 Q74 -158 98 -150" fill="none" stroke="{D[0]}" stroke-width="5"/>')
    sole(s, 290, B, 24)
    s.add(f'<path d="M16 -6 H296" fill="none" stroke="{B[2]}" stroke-width="4.5"/>')
    s.add('</g>')


def sandalias():
    s = SVG('Sandálias', 512, 512)
    sandal(s, False, 124, 290)
    sandal(s, True, 80, 366)
    s.write('sandalias')


def boot(s, front, x, y):
    f = _f(front)
    B, D, I = f(LEATHER), f(LDARK), f(IRON)
    s.add(f'<g transform="translate({x} {y})">')
    sole(s, 224, D)
    up = ("M12 -10 C4 -60 8 -120 14 -170 L18 -350 Q20 -368 40 -368 H110 Q124 -366 122 -350 "
          "L118 -200 Q120 -150 140 -122 C180 -96 214 -80 228 -50 Q238 -24 226 -10 Z")
    sid, c = s.tube2(up, B, (16, 6), (14, 6))
    s.add(f'<g clip-path="url(#{c})"><path d="M130 -150 Q150 -80 136 -10" fill="none" stroke="{B[3]}" stroke-width="4.5"/></g>')
    s.outline(sid)
    # cano dobrado
    cuff = "M10 -374 Q66 -382 128 -374 L126 -314 Q68 -306 14 -314 Z"
    sid, c = s.tube2(cuff, D, (14, 6), (12, 6))
    s.outline(sid)
    s.add(f'<path d="M14 -374 Q68 -390 128 -374 Q68 -364 14 -374 Z" fill="{darken(D[3], 0.6)}" stroke-width="4.5"/>')
    for yy in (-262, -198):
        dd = f'M12 {yy} Q70 {yy+8} 124 {yy}'
        s.add(f'<path d="{dd}" fill="none" stroke-width="20"/><path d="{dd}" fill="none" stroke="{D[1]}" stroke-width="9"/>')
        buckle(s, 100, yy + 4, 20, 26, I)
    s.add('</g>')


def botas():
    s = SVG('Botas', 341, 512)
    boot(s, False, 66, 424)
    boot(s, True, 30, 450)
    s.write('botas')


def solleret(s, front, x, y):
    f = _f(front)
    I, D = f(IRON), f(LDARK)
    s.add(f'<g transform="translate({x} {y})">')
    sole(s, 318, D)
    base = "M14 -10 C6 -60 12 -120 26 -166 L102 -172 Q110 -114 166 -98 C226 -84 276 -64 310 -40 Q330 -22 350 -12 L340 -10 Z"
    sid, c = s.tube2(base, I)
    lames = [(112, -150), (156, -104), (204, -90), (252, -70)]
    g = []
    for lx, ly in lames:
        g.append(f'<path d="M{lx-10} {ly-10} Q{lx+26} {(ly-10)/2} {lx+8} -2" fill="none" stroke-width="5"/>')
        g.append(f'<path d="M{lx+2} {ly-4} Q{lx+36} {(ly-10)/2} {lx+20} -14" fill="none" stroke="{I[0]}" stroke-width="6"/>')
    s.add(f'<g clip-path="url(#{c})">' + ''.join(g) +
          f'<path d="M-10 -112 Q50 -124 112 -112" fill="none" stroke-width="5"/>'
          f'<path d="M-10 -106 Q50 -118 112 -106" fill="none" stroke="{I[0]}" stroke-width="5"/></g>')
    s.outline(sid)
    s.add(f'<path d="M28 -162 Q64 -184 104 -168 Q64 -156 28 -162 Z" fill="{darken(I[3], 0.6)}" stroke-width="4.5"/>')
    s.add('<g>' + ''.join(rivet(lx + 18, -30, I[1], 4.5) for lx, ly in lames) + rivet(44, -70, I[1], 5) + '</g>')
    s.add('</g>')


def sollerets():
    s = SVG('Sollerets', 512, 512)
    solleret(s, False, 102, 296)
    solleret(s, True, 56, 376)
    s.write('sollerets')
