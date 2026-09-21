"""Import generated transparent PNGs without altering their pixels; author Spine 3.8 mesh rigs.
The original imagegen outputs are copied, not overwritten. Sheriff is intentionally excluded.
"""
import importlib.util
import json
import math
import shutil
import uuid
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'golden-roll/assets'
OUT = ASSETS / 'runner-art'
NS = uuid.UUID('3787421b-549a-460a-bf0f-18aee3bc7e46')
spec = importlib.util.spec_from_file_location('slicer', Path(__file__).with_name('slice-new-map.py'))
slicer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(slicer)

def uid(name): return str(uuid.uuid5(NS, name))
def write(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
def meta(path, importer, extra=None):
    out = {'ver': '1.0.0', 'importer': importer, 'imported': True, 'uuid': uid(str(path.relative_to(ASSETS))), 'files': [], 'subMetas': {}, 'userData': extra or {}}
    if importer == 'directory': out['ver'] = '1.2.0'
    if importer == 'spine-data': out['ver'] = '1.2.7'; out['files'] = ['.json']
    write(Path(str(path) + '.meta'), out)
    return out['uuid']
def image_meta(path, rect=None):
    im = Image.open(path)
    u = uid(str(path.relative_to(ASSETS)))
    data = slicer.image_meta(u, path.stem, *im.size)
    if rect:
        x,y,w,h = rect
        sf = data['subMetas']['f9941']['userData']
        sf.update(trimType='custom', trimX=x, trimY=y, width=w, height=h, rawWidth=w, rawHeight=h)
    write(Path(str(path) + '.meta'), data)
    return u

def rig(skin, image):
    w,h = Image.open(image).size
    height = 156.0; width = height*w/h
    bones = [{'name':'root'}, {'name':'body','parent':'root'}, {'name':'head','parent':'body','y':height*0.2}]
    for side in [-1,1]:
        for leg,y in enumerate([0.09,-0.17,-0.34]):
            bones.append({'name':f'leg{side}_{leg}', 'parent':'body', 'x':side*width*0.25, 'y':height*y})
    uvs=[]; vertices=[]; triangles=[]
    nx,ny=20,24
    for row in range(ny+1):
        for col in range(nx+1):
            u,v=col/nx,row/ny
            x,y=(u-0.5)*width,(0.5-v)*height
            uvs.extend([u,v])
            # Smooth mesh weights: extremities follow leg bones, central shell stays rigid.
            if abs(x)>width*0.25 and y<height*0.2:
                side=0 if x<0 else 1
                leg=min(range(3), key=lambda i: abs(y-height*[0.09,-0.17,-0.34][i]))
                idx=3+side*3+leg
                weight=min(0.95,max(0,(abs(x)/width-0.25)/0.12))
            elif y>height*0.1:
                idx=2; weight=min(1,(y/height-0.1)/0.16)
            else: idx=1; weight=1
            if idx==1: vertices.extend([1,1,x,y,1])
            else:
                b=bones[idx]
                vertices.extend([2,1,x,y,1-weight,idx,x-b.get('x',0),y-b.get('y',0),weight])
            if row<ny and col<nx:
                p=row*(nx+1)+col; triangles.extend([p,p+nx+1,p+1,p+1,p+nx+1,p+nx+2])
    push={'body': {'translate':[{'time':0,'y':0},{'time':0.16,'y':1.3},{'time':0.32,'y':0},{'time':0.48,'y':1.3},{'time':0.64,'y':0}]}, 'head': {'rotate':[{'time':0,'angle':-1},{'time':0.32,'angle':1},{'time':0.64,'angle':-1}]}}
    for i,b in enumerate(bones[3:]):
        amplitude=5 if i%3==0 else 9
        sign=1 if i%2==0 else -1
        push[b['name']]={'rotate':[{'time':0,'angle':sign*amplitude},{'time':0.32,'angle':-sign*amplitude},{'time':0.64,'angle':sign*amplitude}]}
    data={'skeleton':{'spine':'3.8.99','x':-width/2,'y':-height/2,'width':width,'height':height,'images':'./'},'bones':bones,'slots':[{'name':'body','bone':'root','attachment':'body'}], 'skins':[{'name':'default','attachments':{'body':{'body':{'type':'mesh','path':'body','uvs':uvs,'triangles':triangles,'vertices':vertices,'width':width,'height':height}}}}], 'animations':{'push':{'bones':push},'hit':{'bones':{'body':{'rotate':[{'time':0,'angle':0},{'time':0.07,'angle':-7},{'time':0.17,'angle':5},{'time':0.3,'angle':0}], 'translate':[{'time':0,'y':0},{'time':0.08,'y':-8},{'time':0.3,'y':0}]}}},'idle':{'bones':{'body':{'scale':[{'time':0,'x':1,'y':1},{'time':0.7,'x':1.015,'y':0.99},{'time':1.4,'x':1,'y':1}]}}}}}
    out=image.with_suffix('.json'); write(out,data)
    atlas=image.with_suffix('.atlas')
    atlas.write_text(f'{image.name}\nsize: {w},{h}\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\nbody\n  rotate: false\n  xy: 0, 0\n  size: {w}, {h}\n  orig: {w}, {h}\n  offset: 0, 0\n  index: -1\n',encoding='utf-8')
    atlas_id=meta(atlas,'*')
    meta(out,'spine-data',{'atlasUuid':atlas_id})

def main():
    OUT.mkdir(parents=True,exist_ok=True)
    meta(OUT,'directory',{'isBundle':True,'bundleName':'runner-art','priority':1,'compressionType':{},'isRemoteBundle':False})
    specs=json.loads((ROOT/'docs/runner-art-manifest.json').read_text(encoding='utf-8'))
    for item in specs:
        if item['id']=='sheriff': continue
        skin=item['id']; dest=OUT/'characters'/skin/(skin+'.png'); dest.parent.mkdir(parents=True,exist_ok=True)
        source=Path(item['file'])
        if source.exists(): shutil.copyfile(source,dest)
        assert dest.exists(),dest
        image_meta(dest); rig(skin,dest)
    for item in json.loads((ROOT/'docs/runner-ball-manifest.json').read_text(encoding='utf-8')):
        dest=OUT/'balls'/('ball-'+item['id']+'.png'); dest.parent.mkdir(parents=True,exist_ok=True)
        if Path(item['file']).exists(): shutil.copyfile(item['file'],dest)
        im=Image.open(dest)
        assert im.mode=='RGBA' and im.getchannel('A').getextrema()[0]==0, 'Transparent alpha required'
        x,y,r,b=im.getchannel('A').getbbox(); image_meta(dest,(x,y,r-x,b-y))
    ui=ASSETS/'resources/runner-ui'; ui.mkdir(exist_ok=True)
    wood=ui/'wood.png'; shutil.copyfile(ASSETS/'resources/ui/home-plaque.png',wood)
    w,h=Image.open(wood).size; image_meta(wood,(0,int(h*0.42),w,h-int(h*0.42)))
    # Utility textures are mathematical primitives, not replacement artwork.
    Image.new('RGBA',(4,4),(255,255,255,255)).save(ui/'white.png'); image_meta(ui/'white.png')
    import struct,zlib
    im=Image.new('RGBA',(64,64)); pix=im.load()
    for y in range(64):
        for x in range(64):
            radius=math.hypot(x-31.5,y-31.5)/31.5
            pix[x,y]=(255,255,255,int(255*max(0,1-radius)**1.7))
    im.save(ui/'particle.png'); image_meta(ui/'particle.png')
    for folder in OUT.rglob('*'):
        if folder.is_dir() and not Path(str(folder)+'.meta').exists(): meta(folder,'directory')
    print('Imported 11 back-view PNG skins, 4 ball PNGs, 11 weighted Spine rigs; sheriff excluded.')

if __name__=='__main__': main()
