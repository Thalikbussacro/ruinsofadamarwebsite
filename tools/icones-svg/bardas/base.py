import cairosvg
HEAD = "M92 474 C96 330 146 196 230 122 L224 64 Q240 72 262 106 C304 138 364 198 420 262 Q446 292 440 324 Q432 350 400 348 L372 340 Q326 330 298 304 Q276 284 274 264 C276 340 300 410 320 474 Z"
TAIL = "M112 136 Q74 150 62 204 Q56 236 48 256 Q60 264 74 240 Q92 204 104 180 Z"
FAR = "M340 236 L344 292 L344 340 L348 372 L322 372 L322 340 L320 292 L316 240 Z M228 246 L218 292 L214 340 L216 372 L192 372 L192 340 L194 292 L200 248 Z"
BODY = ("M114 130 Q160 118 220 128 Q290 134 326 112 C346 84 372 56 398 44 L398 22 Q414 28 422 46 "
        "Q440 58 458 86 L476 116 Q480 134 464 140 Q448 144 436 134 L418 118 Q404 118 400 130 "
        "C398 152 404 176 408 198 Q410 222 394 236 L390 292 L392 340 L396 372 L368 372 L368 340 L366 292 L364 246 "
        "Q344 252 316 252 Q250 260 196 248 L186 290 L180 316 L180 340 L182 372 L156 372 L156 340 L148 312 "
        "Q120 270 108 226 Q98 176 114 130 Z")
def wrap(vb, inner): return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}"><g stroke="#0a0806" stroke-width="6" stroke-linejoin="round" stroke-linecap="round">{inner}</g></svg>'
h=wrap("0 0 512 512",f'<path d="{HEAD}" fill="#4a4038"/>')
b=wrap("0 0 512 400",f'<path d="{TAIL}" fill="#372f29"/><path d="{FAR}" fill="#372f29"/><path d="{BODY}" fill="#4a4038"/>')
for n,s in (("head",h),("body",b)):
    open(n+".svg","w").write(s); cairosvg.svg2png(url=n+".svg",write_to=n+".png",background_color="#14110e")
