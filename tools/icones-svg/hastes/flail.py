import math,sys
def spikes(cx,cy,r,n,L,w,rot=0):
    out=[]
    for i in range(n):
        a=math.radians(rot+360*i/n)
        bx,by=cx+math.cos(a)*(r-4),cy+math.sin(a)*(r-4)
        tx,ty=cx+math.cos(a)*(r+L),cy+math.sin(a)*(r+L)
        px,py=-math.sin(a)*w,math.cos(a)*w
        # light if facing up-left
        d=math.cos(a)*-0.7+math.sin(a)*-0.7
        col='#b5ae9c' if d>0.35 else ('#5f5b52' if d<-0.35 else '#8a8579')
        out.append(f'<path d="M{bx+px:.0f} {by+py:.0f} L{tx:.0f} {ty:.0f} L{bx-px:.0f} {by-py:.0f} Z" fill="{col}"/>')
    return '\n    '.join(out)
def chain(p0,p1,p2,n,lw=26,lh=14):
    out=[]
    for i in range(n):
        t=(i+0.5)/n
        x=(1-t)**2*p0[0]+2*(1-t)*t*p1[0]+t*t*p2[0]
        y=(1-t)**2*p0[1]+2*(1-t)*t*p1[1]+t*t*p2[1]
        dx=2*(1-t)*(p1[0]-p0[0])+2*t*(p2[0]-p1[0]); dy=2*(1-t)*(p1[1]-p0[1])+2*t*(p2[1]-p1[1])
        ang=math.degrees(math.atan2(dy,dx))
        if i%2==0:
            out.append(f'<g transform="translate({x:.0f} {y:.0f}) rotate({ang:.0f})"><ellipse rx="{lw/2+3}" ry="{lh/2+3}" fill="none" stroke="#0a0806" stroke-width="13"/><ellipse rx="{lw/2+3}" ry="{lh/2+3}" fill="none" stroke="#8a8579" stroke-width="5"/></g>')
        else:
            out.append(f'<g transform="translate({x:.0f} {y:.0f}) rotate({ang:.0f})"><rect x="{-lw/2-4}" y="-6" width="{lw+8}" height="12" rx="6" fill="#b5ae9c"/></g>')
    # draw edge-on first then rings? keep order
    return '\n    '.join(out)
