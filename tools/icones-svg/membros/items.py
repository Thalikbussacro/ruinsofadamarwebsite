import sys

from lib import *


def tab(s, pal, o):
    """Aba de amarrar no cinto, no lado externo (o=-1 esquerda, +1 direita)."""
    a, b = (-48, -16) if o < 0 else (16, 48)
    s.add(f'<path d="M{a} -2 L{a+6} -36 Q{(a+b)/2} -44 {b-6} -36 L{b} -4 Z" fill="{pal[1]}"/>')
    s.add(f'<circle cx="{(a+b)/2}" cy="-26" r="5" fill="{K}" stroke="none"/>')


def leg_straps(s, pal, buck, ys=((70, 52), (262, 44)), o=1):
    for yy, hw in ys:
        dd = f'M{-hw} {yy} Q0 {yy+10} {hw} {yy}'
        s.add(f'<path d="{dd}" fill="none" stroke-width="18"/>')
        s.add(f'<path d="{dd}" fill="none" stroke="{pal[2]}" stroke-width="7"/>')
        buckle(s, o * (hw - 14), yy + 3, 18, 24, buck)


def leg(s, kind, front, x, y, o=-1):
    """Perneira (perna inteira). kind: couro, reforcado, malha, escamas, placas."""
    f = (lambda p: p) if front else back
    s.add(f'<g transform="translate({x} {y})">')
    base = {'couro': LEATHER, 'reforcado': LEATHER, 'malha': IRON, 'escamas': LEATHER, 'placas': IRON}[kind]
    tab(s, f(LEATHER), o)
    sid, c = s.tube(LEG, f(base), 22, 20)
    L, I, D = f(LEATHER), f(IRON), f(LDARK)
    if kind == 'couro':
        s.outline(sid)
        s.add(f'<path d="M-30 176 Q0 160 30 176 M-30 206 Q0 220 30 206" fill="none" stroke="{L[3]}" stroke-width="4"/>')
        leg_straps(s, L, I, o=-o)
    elif kind == 'reforcado':
        s.outline(sid)
        # placa da coxa
        s.add(f'<path d="M-36 22 Q0 14 36 22 L32 132 Q0 146 -32 132 Z" fill="{D[1]}" stroke-width="4.5"/>')
        s.add(f'<path d="M-28 30 L-26 128" fill="none" stroke="{D[0]}" stroke-width="5"/>')
        # joelheira
        s.add(f'<ellipse cx="0" cy="190" rx="32" ry="28" fill="{D[1]}" stroke-width="4.5"/>')
        s.add(f'<path d="M-22 176 Q-14 166 0 166" fill="none" stroke="{D[0]}" stroke-width="5"/>')
        # talas da canela
        for x0 in (-28, 6):
            s.add(f'<rect x="{x0}" y="228" width="22" height="108" rx="6" fill="{D[1]}" stroke-width="4.5"/>')
        s.add(f'<path d="M-22 236 V326" fill="none" stroke="{D[0]}" stroke-width="5"/>')
        s.add('<g>' + ''.join(rivet(px, py, I[0] if px < 0 else I[1], 4.5) for px, py in
              ((-22, 36), (22, 36), (-20, 120), (20, 120), (-17, 244), (17, 244), (-17, 320), (17, 320))) + '</g>')
        leg_straps(s, L, I, ((280, 42),), o=-o)
    elif kind == 'malha':
        s.add(f'<g clip-path="url(#{c})">' + rings(-70, 30, 70, 370, I[3]) + '</g>')
        s.outline(sid)
        s.add(f'<path d="M-50 4 Q0 -10 50 -6 L52 26 Q0 16 -52 30 Z" fill="{L[1]}"/>')
        s.add(f'<path d="M-44 10 Q-10 0 10 -2" fill="none" stroke="{L[0]}" stroke-width="5"/>')
    elif kind == 'escamas':
        s.add(f'<g clip-path="url(#{c})">' + scales(-70, 22, 70, 352, I, 26, 30, 20, 0.33, 0.66) + '</g>')
        s.outline(sid)
        s.add(f'<path d="M-50 4 Q0 -10 50 -6 L52 26 Q0 16 -52 30 Z" fill="{L[1]}"/>')
        s.add(f'<path d="M-44 10 Q-10 0 10 -2" fill="none" stroke="{L[0]}" stroke-width="5"/>')
    elif kind == 'placas':
        s.outline(sid)
        # lâminas da coxa e divisão da canela
        s.add(f'<g clip-path="url(#{c})"><path d="M-60 112 Q0 124 60 112 M-60 146 Q0 158 60 146 M-60 232 Q0 246 60 232" fill="none" stroke-width="5"/>'
              f'<path d="M-60 112 Q0 124 60 112 V146 Q0 158 -60 146 Z" fill="{I[1]}" stroke="none"/>'
              f'<path d="M-60 112 Q0 124 60 112 V146 Q0 158 -60 146 Z" fill="none" stroke-width="5"/>'
              f'<path d="M0 248 V340" fill="none" stroke="{I[0]}" stroke-width="6"/></g>')
        # joelheira com leque no lado externo
        s.add(f'<path d="M{o*22} 172 Q{o*62} 138 {o*74} 186 Q{o*66} 236 {o*22} 206 Z" fill="{I[2] if o > 0 else I[0]}"/>')
        s.add(f'<path d="M{o*30} 182 L{o*64} 166 M{o*32} 194 L{o*70} 196 M{o*30} 204 L{o*58} 222" fill="none" stroke-width="4"/>')
        s.add(f'<ellipse cx="0" cy="189" rx="38" ry="34" fill="{I[1]}"/>')
        s.add(f'<path d="M-26 176 Q-18 162 -2 160" fill="none" stroke="{I[0]}" stroke-width="6"/>')
        s.add(f'<path d="M24 210 Q14 220 0 222" fill="none" stroke="{I[2]}" stroke-width="5"/>')
        s.add('<g>' + ''.join(rivet(px, py, I[1], 4.5) for px, py in ((-40, 128), (40, 128))) + '</g>')
    s.add('</g>')


def perneiras_de_couro():
    s = SVG('Perneiras de couro', 512, 512)
    leg(s, 'couro', False, 300, 92, 1)
    leg(s, 'couro', True, 214, 108, -1)
    s.write('perneiras-de-couro')


def perneiras_de_couro_reforcado():
    s = SVG('Perneiras de couro reforçado', 341, 512)
    leg(s, 'reforcado', False, 212, 92, 1)
    leg(s, 'reforcado', True, 128, 108, -1)
    s.write('perneiras-de-couro-reforcado')


def perneiras_de_cota_de_malha():
    s = SVG('Perneiras de cota de malha', 512, 512)
    leg(s, 'malha', False, 300, 92, 1)
    leg(s, 'malha', True, 214, 108, -1)
    s.write('perneiras-de-cota-de-malha')


def perneiras_de_escamas():
    s = SVG('Perneiras de escamas', 384, 512)
    leg(s, 'escamas', False, 234, 92, 1)
    leg(s, 'escamas', True, 150, 108, -1)
    s.write('perneiras-de-escamas')


def perneiras_de_placas():
    s = SVG('Perneiras de placas', 384, 512)
    leg(s, 'placas', False, 238, 92, 1)
    leg(s, 'placas', True, 146, 108, -1)
    s.write('perneiras-de-placas')


PANTS = ("M-96 0 H96 L104 70 C110 160 102 280 90 390 Q60 402 30 394 C26 300 14 200 0 136 "
         "C-14 200 -26 300 -30 394 Q-60 402 -90 390 C-102 280 -110 160 -104 70 Z")


def calcas_de_couro():
    s = SVG('Calças de couro', 341, 512)
    L = LEATHER
    s.add('<g transform="translate(170 54)">')
    sid, c = s.defpath(PANTS)
    s.add(f'<use xlink:href="#{sid}" fill="{L[1]}"/>')
    s.add(f'<g clip-path="url(#{c})" stroke="none"><rect x="-120" y="0" width="46" height="420" fill="{L[0]}"/>'
          f'<rect x="72" y="0" width="50" height="420" fill="{L[2]}"/>'
          f'<path d="M0 136 C-14 200 -26 300 -30 394 L-52 394 C-44 300 -26 200 0 136 Z" fill="{L[2]}"/></g>')
    s.outline(sid)
    # costuras laterais e joelhos
    s.add(f'<path d="M-66 60 C-70 160 -64 280 -60 390 M66 60 C70 160 64 280 60 390" fill="none" stroke="{L[3]}" stroke-width="4"/>')
    s.add(f'<path d="M-82 210 Q-56 222 -24 212 M24 212 Q56 222 82 210" fill="none" stroke="{L[3]}" stroke-width="4"/>')
    # cós
    s.add(f'<path d="M-100 0 H100 L102 30 H-102 Z" fill="{LDARK[1]}"/>')
    s.add(f'<path d="M-92 9 H-30" fill="none" stroke="{LDARK[0]}" stroke-width="5"/>')
    # braguilha com cordão
    s.add(f'<path d="M0 30 V118" fill="none" stroke-width="5"/>')
    s.add(f'<path d="M-12 46 L12 62 M12 46 L-12 62 M-12 76 L12 92 M12 76 L-12 92" fill="none" stroke="{K}" stroke-width="9"/>')
    s.add(f'<path d="M-12 46 L12 62 M12 46 L-12 62 M-12 76 L12 92 M12 76 L-12 92" fill="none" stroke="{LINEN[1]}" stroke-width="4"/>')
    s.add('</g>')
    s.write('calcas-de-couro')


def saiote_de_couro_batido():
    s = SVG('Saiote de couro batido', 341, 512)
    s.add('<g transform="translate(170 66)">')
    n = 7
    w = 32
    # fileira de trás (escura), visível entre as tiras
    for i in range(n - 1):
        x = (i - (n - 2) / 2) * w
        a = -x * 0.045
        s.add(f'<g transform="rotate({a:.1f} 0 20)"><rect x="{x - w/2 + 2}" y="20" width="{w - 4}" height="350" rx="12" fill="{LEATHER[3]}"/></g>')
    # fileira da frente
    for i in range(n):
        x = (i - (n - 1) / 2) * w
        a = -x * 0.045
        f = i / (n - 1)
        pal = LEATHER
        fill = pal[0] if f < 0.3 else (pal[2] if f > 0.7 else pal[1])
        hi = pal[0] if fill != pal[0] else '#b88e62'
        s.add(f'<g transform="rotate({a:.1f} 0 20)">')
        s.add(f'<rect x="{x - w/2 + 1}" y="22" width="{w - 2}" height="332" rx="12" fill="{fill}"/>')
        s.add(f'<path d="M{x - w/2 + 9} 40 V338" fill="none" stroke="{hi}" stroke-width="5"/>')
        s.add(rivet(x, 120, IRON[1], 4.5) + rivet(x, 224, IRON[1], 4.5) + rivet(x, 326, IRON[1], 4.5))
        s.add('</g>')
    # cinto
    s.add(f'<rect x="-122" y="0" width="244" height="40" rx="10" fill="{LDARK[1]}"/>')
    s.add(f'<path d="M-112 12 H-40" fill="none" stroke="{LDARK[0]}" stroke-width="5"/>')
    s.add(f'<path d="M40 34 H112" fill="none" stroke="{LDARK[2]}" stroke-width="5"/>')
    buckle(s, 0, 20, 34, 40, IRON)
    s.add('</g>')
    s.write('saiote-de-couro-batido')


def _fore(tt, half=60):
    """Linha transversal ao antebraço no parâmetro tt (0 = cotovelo, 1 = punho)."""
    ax, ay = -2 + 76 * tt, 212 + 182 * tt
    px, py = 0.92, -0.39
    return (ax - px * half, ay - py * half, ax + px * half, ay + py * half)


def sleeve(s, kind, front, x, y):
    f = (lambda p: p) if front else back
    s.add(f'<g transform="translate({x} {y})">')
    base = {'tecido': LINEN, 'reforcado': LEATHER, 'malha': IRON, 'escamas': LEATHER}[kind]
    B, L, I, D = f(base), f(LEATHER), f(IRON), f(LDARK)
    sid, c = s.tube(SLEEVE, B, 24, 22)
    if kind == 'tecido':
        ls = []
        for yy in (44, 82, 120, 158):
            ls.append(f'M-70 {yy} Q0 {yy+12} 70 {yy}')
        for tt in (0.2, 0.42, 0.64):
            a, b, cc, d = _fore(tt)
            ls.append(f'M{a:.0f} {b:.0f} L{cc:.0f} {d:.0f}')
        s.add(f'<g clip-path="url(#{c})"><path d="{" ".join(ls)}" fill="none" stroke="{B[2]}" stroke-width="4.5" stroke-dasharray="10 8"/>'
              f'<path d="M-62 194 Q-10 176 60 196" fill="none" stroke="{B[2]}" stroke-width="4.5"/></g>')
        a, b, cc, d = _fore(0.86)
        a2, b2, c2, d2 = _fore(1.2)
        s.add(f'<g clip-path="url(#{c})"><path d="M{a:.0f} {b:.0f} L{cc:.0f} {d:.0f} L{c2:.0f} {d2:.0f} L{a2:.0f} {b2:.0f} Z" fill="{B[2]}" stroke-width="4.5"/>'
              f'<path d="M-62 34 Q0 14 62 34" fill="none" stroke-width="4.5"/></g>')
        s.outline(sid)
    elif kind == 'reforcado':
        s.outline(sid)
        s.add(f'<path d="M-46 22 Q-40 -2 0 -4 Q40 -2 46 22 L44 84 Q0 96 -44 84 Z" fill="{D[1]}" stroke-width="4.5"/>')
        s.add(f'<path d="M-36 24 Q-30 8 -8 6" fill="none" stroke="{D[0]}" stroke-width="5"/>')
        s.add(f'<ellipse cx="-4" cy="206" rx="34" ry="28" fill="{D[1]}" stroke-width="4.5"/>')
        s.add(f'<path d="M-26 196 Q-20 182 -4 180" fill="none" stroke="{D[0]}" stroke-width="5"/>')
        # talas do antebraço
        s.add(f'<g transform="rotate(-17 40 300)"><rect x="18" y="246" width="20" height="104" rx="6" fill="{D[1]}" stroke-width="4.5"/>'
              f'<rect x="46" y="246" width="20" height="104" rx="6" fill="{D[2]}" stroke-width="4.5"/>'
              + rivet(28, 260, I[0], 4.5) + rivet(56, 260, I[1], 4.5) + rivet(28, 336, I[0], 4.5) + rivet(56, 336, I[1], 4.5) + '</g>')
        s.add('<g>' + rivet(-30, 74, I[0], 4.5) + rivet(30, 74, I[1], 4.5) + '</g>')
        a, b, cc, d = _fore(0.08, 50)
        s.add(f'<path d="M-50 132 Q0 144 50 132" fill="none" stroke-width="18"/><path d="M-50 132 Q0 144 50 132" fill="none" stroke="{L[2]}" stroke-width="7"/>')
        buckle(s, 30, 138, 18, 24, I)
    elif kind == 'malha':
        s.add(f'<g clip-path="url(#{c})">' + rings(-80, 30, 120, 410, I[3]) + '</g>')
        s.outline(sid)
        s.add(f'<path d="M-60 34 Q-56 -12 0 -14 Q56 -12 60 34 Q0 14 -60 34 Z" fill="{L[1]}"/>')
        s.add(f'<path d="M-48 18 Q-36 -2 -6 -6" fill="none" stroke="{L[0]}" stroke-width="5"/>')
    elif kind == 'escamas':
        s.add(f'<g clip-path="url(#{c})">' + scales(-80, 26, 120, 400, I, 26, 30, 20, 0.30, 0.62) + '</g>')
        s.outline(sid)
        s.add(f'<path d="M-60 34 Q-56 -12 0 -14 Q56 -12 60 34 Q0 14 -60 34 Z" fill="{L[1]}"/>')
        s.add(f'<path d="M-48 18 Q-36 -2 -6 -6" fill="none" stroke="{L[0]}" stroke-width="5"/>')
    s.add('</g>')


def _mangas(kind, title, slug):
    s = SVG(title, 512, 512)
    sleeve(s, kind, False, 276, 54)
    sleeve(s, kind, True, 194, 72)
    s.write(slug)


def mangas_de_tecido():
    _mangas('tecido', 'Mangas de tecido', 'mangas-de-tecido')


def mangas_de_couro_reforcado():
    _mangas('reforcado', 'Mangas de couro reforçado', 'mangas-de-couro-reforcado')


def mangas_de_cota_de_malha():
    _mangas('malha', 'Mangas de cota de malha', 'mangas-de-cota-de-malha')


def mangas_de_escamas():
    _mangas('escamas', 'Mangas de escamas', 'mangas-de-escamas')


VAMB = ("M-60 12 Q-58 -24 -18 -28 Q40 -26 62 4 C66 70 58 150 42 250 L48 290 Q0 306 -48 290 "
        "L-40 250 C-56 150 -66 70 -60 12 Z")
VAMB_OPEN = "M-52 10 Q-50 -16 -16 -20 Q36 -18 54 6 Q10 -4 -52 10 Z"


def vambrace(s, kind, front, x, y, rot):
    f = (lambda p: p) if front else back
    B = f(BRONZE if kind == 'bronze' else IRON)
    L, I = f(LEATHER), f(IRON)
    s.add(f'<g transform="translate({x} {y}) rotate({rot})">')
    sid, c = s.tube(VAMB, B, 28, 24)
    inner = darken(B[3], 0.6)
    if kind == 'bronze':
        s.add(f'<g clip-path="url(#{c})"><path d="M-18 40 C-22 110 -18 180 -10 250" fill="none" stroke="{B[0]}" stroke-width="9"/>'
              f'<path d="M-50 256 Q0 270 50 252" fill="none" stroke="{B[2]}" stroke-width="4.5"/></g>')
        s.outline(sid)
        s.add(f'<path d="{VAMB_OPEN}" fill="{inner}" stroke-width="4.5"/>')
    else:
        s.add(f'<g clip-path="url(#{c})"><path d="M-66 40 Q0 34 66 22 M-50 256 Q0 270 50 252" fill="none" stroke-width="4.5"/>'
              f'<path d="M-6 52 V250" fill="none" stroke="{B[0]}" stroke-width="7"/><path d="M2 52 V250" fill="none" stroke-width="4"/></g>')
        s.outline(sid)
        dd = 'M-50 190 Q0 204 50 188'
        s.add(f'<path d="{dd}" fill="none" stroke-width="18"/><path d="{dd}" fill="none" stroke="{L[1]}" stroke-width="7"/>')
        buckle(s, -28, 195, 18, 24, I)
        s.add('<g>' + rivet(-40, 66, B[1], 5) + rivet(40, 58, B[2], 5) + rivet(-34, 238, B[1], 5) + rivet(34, 236, B[2], 5) + '</g>')
        # lâminas articuladas na ponta do cotovelo
        s.add(f'<path d="M-64 14 Q-62 -14 -22 -18 Q40 -16 66 8 L68 -12 Q42 -40 -20 -42 Q-64 -38 -66 -6 Z" fill="{B[1]}"/>')
        s.add(f'<path d="M-58 -10 Q-52 -30 -22 -34" fill="none" stroke="{B[0]}" stroke-width="6"/>')
        s.add(f'<path d="M-66 -6 Q-64 -38 -20 -42 Q42 -40 68 -12 L66 -30 Q40 -62 -18 -64 Q-60 -60 -64 -24 Z" fill="{B[1]}"/>')
        s.add(f'<path d="M-56 -28 Q-50 -50 -20 -56" fill="none" stroke="{B[0]}" stroke-width="6"/>')
        s.add(f'<path d="M-64 -24 Q-60 -60 -18 -64 Q40 -62 66 -30 Q20 -44 -64 -24 Z" fill="{darken(B[3], 0.6)}" stroke-width="4.5"/>')
        s.add('<g>' + rivet(-52, -14, B[1], 4.5) + rivet(54, -12, B[2], 4.5) + '</g>')
    s.add('</g>')


def bracadeiras_de_bronze():
    s = SVG('Braçadeiras de bronze', 512, 512)
    vambrace(s, 'bronze', False, 274, 112, -14)
    vambrace(s, 'bronze', True, 180, 132, -14)
    s.write('bracadeiras-de-bronze')


def bracadeira_de_placas():
    s = SVG('Braçadeira de placas', 512, 512)
    vambrace(s, 'placas', False, 284, 140, -14)
    vambrace(s, 'placas', True, 180, 160, -14)
    s.write('bracadeira-de-placas')


GREAVE = ("M-46 40 Q-46 -4 0 -6 Q46 -4 48 40 C52 80 68 120 64 176 C60 240 38 290 32 336 "
          "L42 380 Q0 394 -42 380 L-32 336 C-38 290 -62 240 -62 176 C-66 120 -48 80 -46 40 Z")


def greave(s, front, x, y):
    f = (lambda p: p) if front else back
    B = f(BRONZE)
    s.add(f'<g transform="translate({x} {y})">')
    sid, c = s.tube(GREAVE, B, 26, 24)
    s.add(f'<g clip-path="url(#{c})">'
          f'<path d="M-30 96 Q0 116 32 96 M-30 40 Q0 20 30 40" fill="none" stroke="{B[2]}" stroke-width="4.5"/>'
          f'<path d="M-52 130 Q-36 190 -10 230 M52 130 Q36 190 10 230" fill="none" stroke="{B[2]}" stroke-width="4.5"/>'
          f'<path d="M-3 120 V360" fill="none" stroke="{B[0]}" stroke-width="7"/>'
          f'<path d="M4 120 V360" fill="none" stroke="{B[2]}" stroke-width="4.5"/></g>')
    s.outline(sid)
    s.add(f'<path d="M44 28 C50 80 68 120 64 176 C60 240 38 290 32 336 L42 380 L30 376 L20 336 '
          f'C26 290 48 240 52 176 C56 120 40 80 32 24 Z" fill="{darken(B[3], 0.6)}" stroke-width="4.5"/>')
    s.add('</g>')


def grevas_de_bronze():
    s = SVG('Grevas de bronze', 384, 512)
    greave(s, False, 236, 64)
    greave(s, True, 148, 82)
    s.write('grevas-de-bronze')


def _rr(x, y, w, h, r):
    return (f"M{x+r} {y} H{x+w-r} A{r} {r} 0 0 1 {x+w} {y+r} V{y+h-r} A{r} {r} 0 0 1 {x+w-r} {y+h} "
            f"H{x+r} A{r} {r} 0 0 1 {x} {y+h-r} V{y+r} A{r} {r} 0 0 1 {x+r} {y} Z")


FINGERS = ((-50, 40, 104), (-23, 18, 124), (4, 28, 114), (31, 58, 88))  # (x esq, topo, comprimento)
PALM = "M-56 140 Q-58 112 -48 106 H58 Q66 118 64 150 C64 200 56 240 46 276 H-42 C-50 236 -58 190 -56 140 Z"


def glove(s, kind, front, x, y):
    f = (lambda p: p) if front else back
    B = f({'tecido': LINEN, 'couro': LEATHER, 'manopla': IRON}[kind])
    L, I = f(LEATHER), f(IRON)
    s.add(f'<g transform="translate({x} {y})">')
    fw = 28
    for fx, fy, fl in FINGERS:
        sid, c = s.tube(_rr(fx, fy, fw, fl, fw / 2 - 1), B, 9, 8)
        if kind == 'manopla':
            s.add(f'<g clip-path="url(#{c})"><path d="M{fx-4} {fy+30} H{fx+fw+4} M{fx-4} {fy+56} H{fx+fw+4} M{fx-4} {fy+82} H{fx+fw+4}" fill="none" stroke-width="4.5"/></g>')
        s.outline(sid)
    # polegar
    s.add('<g transform="rotate(-24 -42 236)">')
    sid, c = s.tube(_rr(-58, 150, 32, 96, 15), B, 10, 9)
    if kind == 'manopla':
        s.add(f'<g clip-path="url(#{c})"><path d="M-62 180 H-22 M-62 206 H-22" fill="none" stroke-width="4.5"/></g>')
    s.outline(sid)
    s.add('</g>')
    # dorso da mão
    sid, c = s.tube(PALM, B, 26, 22)
    if kind == 'manopla':
        s.add(f'<g clip-path="url(#{c})"><path d="M-60 136 Q6 124 72 136 M-60 176 Q6 164 72 176 M-60 214 Q6 204 72 214 M-60 248 Q6 240 72 248" fill="none" stroke-width="4.5"/></g>')
    elif kind == 'couro':
        s.add(f'<g clip-path="url(#{c})"><path d="M-22 150 Q-24 200 -16 250 M4 146 Q4 200 6 250 M28 148 Q32 200 28 250" fill="none" stroke="{B[3]}" stroke-width="4"/></g>')
    else:
        s.add(f'<g clip-path="url(#{c})"><path d="M-26 140 V160 M0 136 V160 M26 140 V160" fill="none" stroke="{B[3]}" stroke-width="4"/></g>')
    s.outline(sid)
    if kind == 'manopla':
        # placa dos nós dos dedos
        s.add(f'<path d="M-50 122 Q6 108 66 122 L66 146 Q6 134 -50 148 Z" fill="{B[1]}"/>')
        s.add(f'<path d="M-42 126 Q-20 120 2 118" fill="none" stroke="{B[0]}" stroke-width="5"/>')
        s.add('<g>' + rivet(-36, 136, B[1], 4.5) + rivet(46, 132, B[2], 4.5) + '</g>')
    # punho/cano
    if kind == 'tecido':
        cuff = "M-46 262 H48 L52 330 Q2 342 -50 330 Z"
    else:
        cuff = "M-46 262 H48 L74 392 Q2 410 -70 392 Z"
    sid, c = s.tube(cuff, B, 26, 24)
    if kind == 'tecido':
        s.add(f'<g clip-path="url(#{c})"><path d="M-30 268 V336 M-12 268 V340 M6 268 V340 M24 268 V340 M40 268 V336" fill="none" stroke="{B[3]}" stroke-width="4"/></g>')
    elif kind == 'manopla':
        s.add(f'<g clip-path="url(#{c})"><path d="M-80 380 Q2 398 84 380" fill="none" stroke-width="4.5"/>'
              f'<path d="M-80 386 Q2 404 84 386 V420 H-80 Z" fill="{B[0]}" stroke="none"/></g>')
    s.outline(sid)
    if kind == 'couro':
        dd = 'M-48 288 Q2 300 52 288'
        s.add(f'<path d="{dd}" fill="none" stroke-width="18"/><path d="{dd}" fill="none" stroke="{f(LDARK)[1]}" stroke-width="7"/>')
        buckle(s, 24, 294, 18, 24, I)
    if kind == 'manopla':
        s.add('<g>' + rivet(-38, 290, B[1], 4.5) + rivet(42, 290, B[2], 4.5) + '</g>')
    s.add('</g>')


def _luvas(kind, title, slug):
    s = SVG(title, 256, 512)
    dy = 30 if kind == 'tecido' else 0
    glove(s, kind, False, 150, 36 + dy)
    glove(s, kind, True, 112, 66 + dy)
    s.write(slug)


def luvas_de_tecido():
    _luvas('tecido', 'Luvas de tecido', 'luvas-de-tecido')


def luvas_de_couro():
    _luvas('couro', 'Luvas de couro', 'luvas-de-couro')


def manoplas():
    _luvas('manopla', 'Manoplas', 'manoplas')


import feet
ITEMS_FEET = {k: getattr(feet, k) for k in ('sapatos', 'sandalias', 'botas', 'sollerets')}

ITEMS = {k.replace('_', '-'): v for k, v in list(globals().items())
         if callable(v) and k[0].islower() and k not in ('sleeve', 'vambrace', 'greave', 'darken', 'lighten', 'glove') and k not in ('leg', 'tab', 'leg_straps', 'back', 'rings', 'scales', 'strap', 'buckle', 'rivet')}

ITEMS.update(ITEMS_FEET)

if __name__ == '__main__':
    for a in sys.argv[1:]:
        ITEMS[a]()
