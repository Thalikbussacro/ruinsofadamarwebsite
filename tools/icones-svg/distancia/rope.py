def rope(d,w=12,dark=20,col=('#d8cdb0','#b5a98a','#8f8468'),twist=False):
    l,m,dk=col
    s=f'    <path d="{d}" fill="none" stroke-width="{dark}"/>\n'
    s+=f'    <path d="{d}" fill="none" stroke="{m}" stroke-width="{w}"/>\n'
    if twist: s+=f'    <path d="{d}" fill="none" stroke="{dk}" stroke-width="{w}" stroke-dasharray="{max(3,w*0.25):.0f} {max(6,w*0.7):.0f}" stroke-linecap="butt"/>\n'
    s+=f'    <path d="{d}" fill="none" stroke="{l}" stroke-width="{max(2.5,w*0.25):.1f}" transform="translate(-{w*0.2:.1f} -{w*0.2:.1f})"/>\n'
    return s
