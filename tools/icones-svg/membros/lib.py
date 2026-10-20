"""Biblioteca para o lote F2-membros: formas-base e padrões de material."""
OUT = 'data/svgicons'
K = '#0a0806'

# (claro, médio, escuro, profundo)
IRON = ('#b5ae9c', '#8a8579', '#5f5b52', '#4a463f')
BRONZE = ('#c4a066', '#9a7a46', '#6e5530', '#54401f')
LEATHER = ('#a07850', '#7c5a3a', '#573d26', '#3f2b1a')
LDARK = ('#7c5a3a', '#573d26', '#3f2b1a', '#2e1f13')   # couro escuro (placas de reforço)
LINEN = ('#d8cdb0', '#b5a98a', '#8f8468', '#6f6650')
WOOL = ('#7a7264', '#5e574b', '#433e35', '#332f28')
WINE = ('#8a3a32', '#6b2a24', '#4a1b17', '#361310')


def back(p):
    """Paleta da peça de trás: um tom abaixo."""
    return (p[1], p[2], p[3], darken(p[3]))


def lighten(c, k=0.35):
    return '#' + ''.join(f'{int(int(c[i:i+2], 16) + (255 - int(c[i:i+2], 16)) * k):02x}' for i in (1, 3, 5))


def darken(c, k=0.72):
    return '#' + ''.join(f'{int(int(c[i:i+2], 16) * k):02x}' for i in (1, 3, 5))


# ---------- formas-base (coordenadas locais, topo ~0) ----------
# perna inteira, vista de frente: coxa larga, joelho, panturrilha, tornozelo
LEG = ("M-52 4 Q0 -10 52 -6 C56 60 48 120 38 162 C48 180 48 200 40 214 "
       "C50 250 46 292 30 336 L28 350 Q0 358 -28 350 L-30 336 C-46 292 -50 250 -40 214 "
       "C-48 200 -48 180 -38 162 C-48 120 -56 60 -52 4 Z")
# manga: cabeça do ombro em cúpula, cotovelo levemente dobrado, punho à direita-baixo
SLEEVE = ("M-60 34 Q-56 -12 0 -14 Q56 -12 60 34 C58 110 50 160 46 198 "
          "C66 260 86 320 102 372 L104 384 Q78 404 46 400 L42 390 "
          "C24 330 -12 280 -46 226 C-56 160 -62 100 -60 34 Z")


class SVG:
    def __init__(self, title, w, h):
        self.title, self.w, self.h = title, w, h
        self.defs, self.body = [], []
        self.n = 0

    def uid(self, p='s'):
        self.n += 1
        return f'{p}{self.n}'

    def defpath(self, d):
        i = self.uid('f')
        self.defs.append(f'<path id="{i}" d="{d}"/>')
        c = self.uid('c')
        self.defs.append(f'<clipPath id="{c}"><use xlink:href="#{i}"/></clipPath>')
        return i, c

    def defclip_shift(self, sid, dx, dy=0):
        c = self.uid('c')
        self.defs.append(f'<clipPath id="{c}"><use xlink:href="#{sid}" transform="translate({dx} {dy})"/></clipPath>')
        return c

    def add(self, s):
        self.body.append(s)

    def tube(self, d, pal, wl=30, wd=28, dy=0):
        """Forma com faixas clara (esquerda) e escura (direita) que seguem o contorno.
        Devolve (id, clip) para detalhes; NÃO desenha o contorno final (chamar outline)."""
        sid, c = self.defpath(d)
        cl = self.defclip_shift(sid, wl, dy)
        self.add(f'<use xlink:href="#{sid}" fill="{pal[0]}"/>')
        self.add(f'<g clip-path="url(#{c})" stroke="none"><g clip-path="url(#{cl})">'
                 f'<use xlink:href="#{sid}" fill="{pal[2]}"/>'
                 f'<use xlink:href="#{sid}" transform="translate({-wd} 0)" fill="{pal[1]}"/></g></g>')
        return sid, c

    def tube2(self, d, pal, lv=(12, 22), dv=(10, 18)):
        """Faixas por deslocamento vetorial: claro nas bordas de cima/esquerda, escuro nas de baixo/direita."""
        sid, c = self.defpath(d)
        cl = self.defclip_shift(sid, lv[0], lv[1])
        self.add(f'<use xlink:href="#{sid}" fill="{pal[0]}"/>')
        self.add(f'<g clip-path="url(#{c})" stroke="none"><g clip-path="url(#{cl})">'
                 f'<use xlink:href="#{sid}" fill="{pal[2]}"/>'
                 f'<use xlink:href="#{sid}" transform="translate({-dv[0]} {-dv[1]})" fill="{pal[1]}"/></g></g>')
        return sid, c

    def outline(self, sid, sw=6):
        self.add(f'<use xlink:href="#{sid}" fill="none" stroke-width="{sw}"/>')

    def write(self, slug):
        s = (f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
             f'viewBox="0 0 {self.w} {self.h}" role="img">\n  <title>{self.title}</title>\n  <defs>\n    '
             + '\n    '.join(self.defs) + '\n  </defs>\n'
             f'  <g stroke="{K}" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">\n    '
             + '\n    '.join(self.body) + '\n  </g>\n</svg>\n')
        open(f'{OUT}/{slug}.svg', 'w').write(s)


# ---------- padrões ----------
def rings(x0, y0, x1, y1, col, step=16, row=13, sw=3.5):
    ps = []
    r = 0
    y = y0
    while y < y1:
        off = (step / 2) if r % 2 else 0
        x = x0 - off
        seg = []
        while x < x1:
            seg.append(f'M{x:.0f} {y:.0f} q{step/2:.0f} {row*0.75:.0f} {step:.0f} 0')
            x += step
        ps.append(' '.join(seg))
        y += row
        r += 1
    return f'<path d="{" ".join(ps)}" fill="none" stroke="{col}" stroke-width="{sw}"/>'


def scales(x0, y0, x1, y1, pal, w=30, h=34, row=22, lightfrac=0.35, dark_right=0.65):
    """Escamas em U; fileiras de baixo para cima (a de cima cobre a de baixo).
    Cor da escama depende da posição x (faixa clara à esquerda)."""
    out = []
    rows = []
    y = y0
    r = 0
    while y < y1:
        rows.append((y, r))
        y += row
        r += 1
    span = x1 - x0
    for y, r in reversed(rows):
        off = w / 2 if r % 2 else 0
        x = x0 - off
        while x < x1:
            f = (x + w / 2 - x0) / span
            fill = pal[0] if f < lightfrac else (pal[2] if f > dark_right else pal[1])
            hi = pal[0] if fill != pal[0] else '#d0c9b6'
            d = f'M{x:.0f} {y:.0f} v{h-w/2:.0f} a{w/2:.0f} {w/2:.0f} 0 0 0 {w:.0f} 0 v{-(h-w/2):.0f} Z'
            out.append(f'<path d="{d}" fill="{fill}" stroke="{pal[3]}" stroke-width="3.5"/>')
            x += w
    return '\n    '.join(out)


def strap(svg, d, pal, w=18):
    """Correia por traço duplo."""
    svg.add(f'<path d="{d}" fill="none" stroke-width="{w+12}"/>')
    svg.add(f'<path d="{d}" fill="none" stroke="{pal[1]}" stroke-width="{w}"/>')


def buckle(svg, x, y, w=26, h=30, pal=IRON):
    svg.add(f'<rect x="{x-w/2}" y="{y-h/2}" width="{w}" height="{h}" rx="4" fill="none" stroke-width="12"/>')
    svg.add(f'<rect x="{x-w/2}" y="{y-h/2}" width="{w}" height="{h}" rx="4" fill="none" stroke="{pal[1]}" stroke-width="5"/>')
    svg.add(f'<path d="M{x-w/2} {y-h/2+4} V{y+h/2-4}" fill="none" stroke="{pal[0]}" stroke-width="5"/>')


def rivet(x, y, fill, r=6):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke-width="3.5"/>'
