# Generator for the two full-carousel packs in this folder. Inputs: the original cover-only packs (golden-hour-viral.zip, neon-grid-process.zip) unzipped as x-<name>/<name>/ next to this script.
import json, os, shutil, zipfile, math
from PIL import Image, ImageDraw, ImageFilter
SIZES={'portrait':(1080,1350),'square':(1080,1080),'landscape':(1920,1080),'tall':(1080,1920)}
TYPES=['cover','explain','rule','code','compare','stat','quote','image','cta']

def golden_bg(aspect, src):
    w,h=SIZES[aspect]
    s=max(w/src.width,h/src.height)
    im=src.resize((math.ceil(src.width*s),math.ceil(src.height*s)),Image.LANCZOS)
    left=(im.width-w)//2; top=im.height-h  # keep the glow band at the bottom
    return im.crop((left,top,left+w,top+h))

def neon_bg(aspect):
    w,h=SIZES[aspect]
    im=Image.new('RGB',(w,h),(5,3,12))
    glow=Image.new('RGB',(w,h),(0,0,0)); d=ImageDraw.Draw(glow)
    r=int(min(w,h)*0.55)
    for cx,cy in [(w,0),(0,h),(int(w*0.9),int(h*0.45))]:
        d.ellipse([cx-r,cy-r,cx+r,cy+r],fill=(110,60,200))
    glow=glow.filter(ImageFilter.GaussianBlur(r*0.55))
    im=Image.blend(im,Image.eval(glow,lambda v:v),0.0)
    px=im.load(); gp=glow.load()
    for y in range(h):
        for x in range(w):
            g=gp[x,y]; px[x,y]=(5+g[0]*60//255,3+g[1]*30//255,12+g[2]*120//255)
    d=ImageDraw.Draw(im); step=72; line=(58,31,107)
    for x in range(0,w,step): d.line([(x,0),(x,h)],fill=line,width=1)
    for y in range(0,h,step): d.line([(0,y),(w,y)],fill=line,width=1)
    return im

def build(name, newid, title_en, title_ar, bgfn):
    src=f'x-{name}/{name}'
    m=json.load(open(f'{src}/template.json'))
    out=f'out/{newid}'; shutil.rmtree(out,ignore_errors=True); os.makedirs(f'{out}/assets')
    keep={k:v for k,v in m['assets'].items()}
    for k,p in keep.items(): shutil.copy(f'{src}/{p}',f'{out}/{p}')
    bgkeys={}
    for a in SIZES:
        key=f'bg-{a}'; path=f'assets/bg-{a}.webp'
        bgfn(a).save(f'{out}/{path}','WEBP',quality=80,method=6)
        m['assets'][key]=path; bgkeys[a]=key
    # drop the old stretched fixed raster: it only suited 4:5
    for k in ('field','grid'):
        if k in m['assets']:
            os.remove(f"{out}/{m['assets'][k]}"); del m['assets'][k]
    m['decor'].pop('overlay',None)
    if not m['decor']: del m['decor']
    old=m['composition']['cover']['portrait']
    comp={}
    for t in TYPES:
        comp[t]={}
        for a in SIZES:
            el={'id':'backdrop','kind':'image','x':0,'y':0,'w':1,'h':1,'rotation':0,'z':0,'locked':True,'assetId':bgkeys[a],'media':{'assetId':bgkeys[a],'fit':'cover'}} if False else {'id':'backdrop','kind':'image','x':0,'y':0,'w':1,'h':1,'rotation':0,'z':0,'locked':True,'assetId':bgkeys[a]}
            comp[t][a]={'elements':[el]}
    # keep the hand-built 4:5 cover exactly, only retarget its backdrop to the 4:5 art
    cov=json.loads(json.dumps(old))
    for e in cov['elements']:
        if e['id'].endswith('backdrop'): e['assetId']=bgkeys['portrait']
    comp['cover']['portrait']=cov
    m['composition']=comp
    m['id']=newid; m['name']={'en':title_en,'ar':title_ar}
    m['description']={'en':f'{title_en}: full carousel (all 9 slide types, 4 aspect classes). Cover is the hand-built 4:5 layout.','ar':f'{title_ar}: كاروسيل كامل لكل أنواع الشرائح والمقاسات.'}
    m['tags']=sorted(set(m['tags']+['full-carousel']))
    m['theme']['fonts']['body']='ibm-plex-serif' if name=='golden-hour-viral' else m['theme']['fonts']['body']
    json.dump(m,open(f'{out}/template.json','w'),indent=2,ensure_ascii=False)
    zp=f'out/{newid}.zip'
    with zipfile.ZipFile(zp,'w',zipfile.ZIP_DEFLATED) as z:
        for root,_,fs in os.walk(out):
            for f in fs:
                p=os.path.join(root,f); z.write(p,os.path.relpath(p,'out'))
    tot=sum(os.path.getsize(os.path.join(r,f)) for r,_,fs in os.walk(out) for f in fs)
    print(newid,'uncompressed',tot,'assets',{f:os.path.getsize(f'{out}/assets/{f}') for f in os.listdir(f'{out}/assets')})

g=Image.open('x-golden-hour-viral/golden-hour-viral/assets/golden-field.webp').convert('RGB')
build('golden-hour-viral','golden-hour-viral-full','Golden Hour Viral (full carousel)','الساعة الذهبية (كاروسيل كامل)',lambda a:golden_bg(a,g))
build('neon-grid-process','neon-grid-process-full','Neon Grid Process (full carousel)','شبكة النيون (كاروسيل كامل)',neon_bg)
