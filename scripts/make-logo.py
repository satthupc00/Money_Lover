# Vẽ logo Mon Money Lover ra các file SVG trong build/ (chạy: python3 scripts/make-logo.py build), sau đó chạy node scripts/make-icons.cjs
O='#EE6418'; O2='#F07326'
def bg(full=True):
    clip = '<clipPath id="sq"><rect x="64" y="64" width="896" height="896" rx="224"/></clipPath>' if not full else ''
    g0 = '<g clip-path="url(#sq)">' if not full else '<g>'
    x0,y0,x1,y1 = (0,0,1024,1024) if full else (64,64,960,960)
    return f'''<defs><linearGradient id="bgc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF6E6"/><stop offset="1" stop-color="#FFEBCF"/></linearGradient>
<linearGradient id="wav" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFAA55"/><stop offset="1" stop-color="#FF8F3A"/></linearGradient>{clip}</defs>
{g0}<rect x="{x0}" y="{y0}" width="{x1-x0}" height="{y1-y0}" fill="url(#bgc)"/>
<path d="M{x0} 640 C 250 575 420 600 560 660 C 700 720 840 640 {x1} 590 L{x1} {y1} L{x0} {y1} Z" fill="url(#wav)"/></g>'''
def fg():
    rows = [374, 527, 672]; bars = [223, 170, 128]
    cart = '<g fill="'+O2+'"><path d="M-36 -30 L56 -26 L42 18 L-26 18 Z"/><path d="M-60 -42 H-40 L-26 26 H46" fill="none" stroke="'+O2+'" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/><circle cx="-16" cy="44" r="11"/><circle cx="36" cy="44" r="11"/></g>'
    fork = ('<g stroke="'+O2+'" stroke-width="12" stroke-linecap="round" fill="none"><path d="M-44 -52 V-22 M-30 -52 V-22 M-16 -52 V-22"/><path d="M-44 -22 Q-44 2 -30 2 Q-16 2 -16 -22"/><path d="M-30 2 V54"/><path d="M26 0 V54"/></g>'
            '<ellipse cx="26" cy="-26" rx="19" ry="28" fill="'+O2+'"/>')
    house = '<g fill="'+O2+'"><path d="M-60 -2 L0 -58 L60 -2 Z" stroke="'+O2+'" stroke-width="10" stroke-linejoin="round"/><rect x="-42" y="-14" width="84" height="66" rx="6"/><rect x="-12" y="16" width="24" height="36" rx="4" fill="#FFFBF4"/></g>'
    icons = [cart, fork, house]
    pad = f'''<g transform="rotate(4.5 444 502)">
<rect x="210" y="226" width="545" height="607" rx="62" fill="#FDB877" transform="translate(34 6)"/>
<rect x="172" y="198" width="545" height="607" rx="62" fill="#FFFBF4" stroke="{O}" stroke-width="30"/>
''' + ''.join(f'<g transform="translate(300 {y})">{ic}</g><rect x="400" y="{y-22}" width="{w}" height="44" rx="22" fill="#FDD3A6"/>' for y, w, ic in zip(rows, bars, icons)) + ''.join(
        f'<rect x="{cx-40}" y="140" width="80" height="140" rx="40" fill="{O}"/><rect x="{cx-17}" y="166" width="34" height="88" rx="17" fill="#FF9B48"/>' for cx in (330, 560)) + '</g>'
    shadow = '<ellipse cx="500" cy="840" rx="350" ry="38" fill="#E8661C" opacity=".28"/>'
    coin = f'''<defs><radialGradient id="cg" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#FFE68A"/><stop offset=".6" stop-color="#FFD24D"/><stop offset="1" stop-color="#FFBE2E"/></radialGradient></defs>
<ellipse cx="712" cy="826" rx="160" ry="26" fill="#E8661C" opacity=".35"/>
<circle cx="704" cy="660" r="156" fill="url(#cg)" stroke="{O}" stroke-width="30"/>
<path d="M600 610 A 118 118 0 0 1 690 548" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="16" stroke-linecap="round"/>
<g transform="translate(706 668) scale(1.02)" fill="none" stroke="{O}" stroke-linecap="round" stroke-linejoin="round">
<path d="M40 -46 C 32 -64 14 -70 -4 -70 C -32 -70 -48 -54 -48 -35 C -48 -12 -26 -5 2 3 C 31 11 50 20 50 43 C 50 64 30 76 2 76 C -22 76 -42 66 -50 48" stroke-width="30"/>
<path d="M0 -102 V-70 M0 76 V106" stroke-width="28"/></g>'''
    spark = '<g stroke="#FFA51C" stroke-width="32" stroke-linecap="round"><path d="M858 404 L818 474"/><path d="M906 470 L856 506"/></g>'
    return shadow + pad + coin + spark
def svg(inner, vb='0 0 1024 1024'):
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{inner}</svg>'
import sys
out = sys.argv[1]
open(out+'/icon.svg','w').write(svg(bg(False) + fg()))
open(out+'/icon-bg.svg','w').write(svg(bg(True)))
open(out+'/icon-fg.svg','w').write(svg(fg()))
# bản tròn (icon tròn Android) và bản 1 màu (themed icon / thông báo)
open(out+'/icon-round.svg','w').write(svg('<defs><clipPath id="rc"><circle cx="512" cy="512" r="512"/></clipPath></defs><g clip-path="url(#rc)">' + bg(True) + '<g transform="translate(512 512) scale(.8) translate(-512 -512)">' + fg() + '</g></g>'))
mono = '''<defs><mask id="mk"><rect width="1024" height="1024" fill="#fff"/><circle cx="704" cy="660" r="190" fill="#000"/></mask>
<mask id="mc"><rect width="1024" height="1024" fill="#fff"/><g transform="translate(706 668)" fill="none" stroke="#000" stroke-linecap="round"><path d="M40 -46 C 32 -64 14 -70 -4 -70 C -32 -70 -48 -54 -48 -35 C -48 -12 -26 -5 2 3 C 31 11 50 20 50 43 C 50 64 30 76 2 76 C -22 76 -42 66 -50 48" stroke-width="30"/><path d="M0 -102 V-70 M0 76 V106" stroke-width="28"/></g></mask></defs>
<g fill="#fff"><g mask="url(#mk)"><g transform="rotate(4.5 444 502)"><rect x="172" y="198" width="545" height="607" rx="62"/><rect x="290" y="140" width="80" height="140" rx="40"/><rect x="520" y="140" width="80" height="140" rx="40"/></g></g>
<circle cx="704" cy="660" r="170" mask="url(#mc)"/></g>'''
open(out+'/icon-mono.svg','w').write(svg(mono))
