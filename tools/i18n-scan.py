#!/usr/bin/env python3
# 繁簡防火牆(掃全倉 CJK 字串:凡字經 s2t  dönüşüm 後改變者=簡體混入,回報檔:行:字;--fix 自動轉繁+常用異體字回掃)
import sys,os,re,glob
from opencc import OpenCC
cc=OpenCC('s2t')
ALLOW=set('核台台台')|{'台'}  # 繁正字/慣用白名單:核銷・台灣
EXT=['.jsx','.js','.md','.txt','.json']
def scan(fix=False):
    bad={}
    for ext in EXT:
        for p in glob.glob(os.path.join(BASE,'**','*'+ext),recursive=True):
            if 'node_modules' in p or '/.next' in p or 'tools/i18n' in p or p.endswith('core.js') and False: pass
            if 'node_modules' in p or '/.next' in p or 'tools/i18n' in p: continue
            try: s=open(p,encoding='utf-8').read()
            except: continue
            t=cc.convert(s)
            if t!=s:
                for i,(a,b) in enumerate(zip(s,t)):
                    if a!=b and '\u4e00'<=a<='\u9fff' and a not in ALLOW:
                        bad.setdefault(p,[]).append((a,b))
    if not bad: print('繁簡防火牆:全綠(無簡體混入)'); return 0
    for p,cs in bad.items():
        uniq=sorted(set(cs))
        rel=os.path.relpath(p,BASE)
        print('SIMPLIFIED@',rel,':',' '.join(a+'→'+b for a,b in uniq[:14]))
    if fix:
        for p,cs in bad.items():
            s=open(p,encoding='utf-8').read()
            for a,b in cs: s=s.replace(a,b)
            s=s.replace('爲','為').replace('羣','群').replace('廻','迴')
            open(p,'w',encoding='utf-8').write(s)
        print('== FIXED, recheck below =='); return scan(False)
    return 1
BASE=os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))) if False else sys.argv[2] if len(sys.argv)>2 else os.getcwdb().decode()
if __name__=='__main__':
    fix='--fix' in sys.argv
    sys.exit(scan(fix))
