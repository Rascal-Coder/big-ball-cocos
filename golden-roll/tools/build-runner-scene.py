"""Author editable Cocos Scene/Prefab assets. No UI hierarchy is generated at runtime.
Run once for initial authoring; subsequent layout changes may be made in Creator's Scene editor.
"""
import base64
import copy
import importlib.util
import json
import uuid
from pathlib import Path

HERE=Path(__file__).resolve().parent
ASSETS=HERE.parent/'assets'
spec=importlib.util.spec_from_file_location('home',HERE/'build-home-structure.py')
H=importlib.util.module_from_spec(spec); spec.loader.exec_module(H)
NS=uuid.UUID('bbe7c38a-77fd-4abc-861e-b63922d17825')
OUT=ASSETS/'resources/runner-ui'
CREAM=(255,236,186,255); GOLD=(255,199,70,255)
def uid(name): return str(uuid.uuid5(NS,name))
def ref(i): return {'__id__':i}
def asset(path,typ=None):
    u=json.loads(Path(str(path)+'.meta').read_text())['uuid']
    return {'__uuid__':u,**({'__expectedType__':typ} if typ else {})}
def compress(u):
    h=u.replace('-',''); alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
    return h[:5]+''.join(alphabet[int(h[i:i+3],16)>>6]+alphabet[int(h[i:i+3],16)&63] for i in range(5,32,3))
def script(name):
    p=ASSETS/'scripts/runner'/f'{name}.ts.meta'
    if not p.exists(): H.write_json(p,{'ver':'4.0.24','importer':'typescript','imported':True,'uuid':uid(name),'files':[],'subMetas':{},'userData':{}})
    return compress(json.loads(p.read_text())['uuid'])
def component(b,n,typ,**data):
    i=b.add({'__type__':typ,'_name':'','_objFlags':0,'__editorExtras__':{},'node':ref(n),'_enabled':True,'__prefab':None,**data})
    b.nodes[n]['_components'].append(ref(i)); return i
def findcomp(b,n,typ): return next(r['__id__'] for r in b.nodes[n]['_components'] if b.nodes[r['__id__']]['__type__']==typ)
def text(b,parent,name,value,x,y,w=170,h=48,size=24,color=CREAM):
    n=b.label_node(name,parent,value,size,color,w,h,x,y,outline=True,overflow=1,system_font=True,font_family='Microsoft YaHei')
    return findcomp(b,n,'cc.Label')
def image(b,parent,name,art,x,y,w,h,color=(255,255,255,255)):
    n=b.node(name,parent,w,h,x,y); sp=b.sprite(n,art,color); b.nodes[sp]['_isTrimmedMode']=True; return n
def button(b,parent,name,caption,x,y,w,h,round=False):
    if round:
        n=b.node(name,parent,w,h,x,y)
        component(b,n,'cc.Mask',_type=1,_segments=64,_inverted=False)
        image(b,n,'Disk','wood',0,0,w,h,(255,255,255,190))
    else: n=image(b,parent,name,'wood',x,y,w,h)
    bt=component(b,n,'cc.Button',_interactable=True,_transition=3,_duration=0.1,_zoomScale=0.94,_target=ref(n),clickEvents=[])
    label=text(b,n,'Caption',caption,0,0,w-8,h,35 if round else 25)
    return bt,label
def particles(b,parent,name,x,y,burst=False,aura=False):
    n=b.node(name,parent,100,100,x,y)
    return component(b,n,'cc.ParticleSystem2D',_custom=True,_spriteFrame=H.sf('particle'),_totalParticles=48 if burst else 90,
        duration=0.08 if burst else -1, emissionRate=350 if burst else 22, life=0.45 if burst else 0.65,lifeVar=0.2,
        _startColor=H.color(*(GOLD if aura else (222,172,112,135))),_startColorVar=H.color(15,12,10,0),_endColor=H.color(195,146,83,0),_endColorVar=H.color(0,0,0,0),
        startSize=9 if burst else 16,startSizeVar=6,endSize=3 if burst else 34,endSizeVar=6,angle=270,angleVar=180 if burst or aura else 20,
        startSpin=0,startSpinVar=90,endSpin=80,endSpinVar=60,sourcePos=H.vec2(),posVar=H.vec2(38 if aura else 20,55 if aura else 3),
        _positionType=0,emitterMode=0,gravity=H.vec2(0,-25),speed=110 if burst else 58,speedVar=25,radialAccel=0,radialAccelVar=0,tangentialAccel=0,tangentialAccelVar=0,
        playOnLoad=False,autoRemoveOnFinish=False,_srcBlendFactor=2,_dstBlendFactor=4)
def save_prefab(name,b):
    p=OUT/(name+'.prefab'); H.write_json(p,H.finish_prefab(b)); H.write_json(Path(str(p)+'.meta'),H.prefab_meta(uid(name))); return p

def prepare_ui():
    for p in (ASSETS/'resources/runner-map').glob('*.png'):
        H.SF[p.stem]=asset(p)['__uuid__']+'@f9941'
    for p in OUT.glob('*.png'): H.SF[p.stem]=asset(p)['__uuid__']+'@f9941'
    # Reuse the existing wooden board as the round controls' disk via an ellipse Mask.
    H.SF['round']=H.SF['wood']
    for p in (ASSETS/'scripts/runner').glob('*.ts'): script(p.stem)
    source=Path('C:/ProgramData/cocos/editors/Creator/3.8.8/resources/resources/3d/engine/editor/assets/effects/for2d/builtin-sprite.effect').read_text()
    source=source.replace('alphaThreshold: { value: 0.5 }','alphaThreshold: { value: 0.5 }\n        flash: { value: 0.0 }')
    source=source.replace('  in vec4 color;','  uniform FlashParams { float flash; };\n  in vec4 color;')
    source=source.replace('    ALPHA_TEST(o);','    o.rgb = mix(o.rgb, vec3(1.0), flash);\n    ALPHA_TEST(o);')
    (OUT/'hit-flash.effect').write_text(source,encoding='utf-8')
    H.write_json(OUT/'hit-flash.effect.meta',{'ver':'1.7.1','importer':'effect','imported':True,'uuid':uid('hit-effect'),'files':['.json'],'subMetas':{},'userData':{}})
    H.write_json(OUT/'hit-flash.mtl',{'__type__':'cc.Material','_name':'hit-flash','_objFlags':0,'__editorExtras__':{},'_native':'','_effectAsset':{'__uuid__':uid('hit-effect'),'__expectedType__':'cc.EffectAsset'},'_techIdx':0,'_defines':[{'USE_TEXTURE':True}],'_states':[{}],'_props':[{'flash':0}]})
    H.write_json(OUT/'hit-flash.mtl.meta',{'ver':'1.0.21','importer':'material','imported':True,'uuid':uid('hit-material'),'files':['.json'],'subMetas':{},'userData':{}})

def build_item():
    b=H.begin_prefab('runner-item'); n=b.node('RunnerItem',None,100,100); sp=b.sprite(n,'coin')
    component(b,n,script('RunnerItemView'),image=ref(sp),bounds=ref(findcomp(b,n,'cc.UITransform')))
    return save_prefab('runner-item',b)

def build_actor():
    b=H.begin_prefab('runner-actor'); n=b.node('RunnerActor',None,150,250); op=b.opacity(n)
    push=b.node('PushRig',n,150,250)
    dust=particles(b,push,'DustTrail',0,-147)
    aura=particles(b,push,'PowerAura',0,-45,aura=True)
    shadow=image(b,n,'Shadow','particle',0,0,110,34,(57,31,11,120))
    b.nodes[n]['_children'].remove(ref(shadow)); b.nodes[n]['_children'].insert(0,ref(shadow))
    b.nodes[b.nodes[dust]['node']['__id__']]['_lpos']=H.vec3(0,0,0)
    ball=image(b,push,'Ball','coin',0,48,96,96)
    ballsp=findcomp(b,ball,'cc.Sprite'); b.nodes[ballsp]['_customMaterial']={'__uuid__':uid('hit-material'),'__expectedType__':'cc.Material'}
    beetle=image(b,push,'BeetleBody','coin',0,85,72,80)
    hat=image(b,push,'CowboyHat','coin',7,112,65,46)
    component(b,n,script('RunnerActorView'),body=ref(findcomp(b,beetle,'cc.Sprite')),hat=ref(findcomp(b,hat,'cc.Sprite')),shadow=ref(shadow),ball=ref(ballsp),opacity=ref(op),dust=ref(dust),aura=ref(aura),pushRoot=ref(push))
    return save_prefab('runner-actor',b)

def build_burst():
    b=H.begin_prefab('runner-burst'); n=b.node('RunnerBurst',None,100,100)
    p=particles(b,n,'Particles',0,0,burst=True)
    component(b,n,script('RunnerBurstView'),particles=ref(p))
    return save_prefab('runner-burst',b)

def build_modal():
    b=H.begin_prefab('runner-modal'); n=b.node('RunnerModal',None,750,1334)
    b.sprite(n,'white',(27,15,7,208)); component(b,n,'cc.BlockInputEvents')
    panel=image(b,n,'WoodPanel','wood',0,20,560,660)
    image(b,panel,'Star','star-badge',0,255,65,65)
    title=text(b,panel,'Title','西部冒险',0,181,510,62,32,GOLD)
    body=text(b,panel,'Body','准备好了就出发',0,37,480,198,25); b.nodes[body]['_lineHeight']=44
    buttons=[];captions=[]
    for i,name in enumerate(['继续冒险','重新出发','返回营地']):
        bt,tx=button(b,panel,'Action'+str(i),name,0,-103-i*76,345,60); buttons.append(ref(bt));captions.append(ref(tx))
    component(b,n,script('RunnerModalView'),title=ref(title),body=ref(body),panel=ref(panel),buttons=buttons,captions=captions)
    return save_prefab('runner-modal',b)

def build_scene(item,actor,burst,modal):
    old=json.loads((ASSETS/'scenes/main.scene').read_text(encoding='utf-8'))
    b=H.Builder('scene',uid('runner-scene'))
    # Copy only the engine-authored Scene/Canvas/Camera/global settings, preserving native serialization.
    indices=[0,1,2,3,4]
    indices += [r['__id__'] for r in old[2]['_components'] if old[r['__id__']]['__type__'].startswith('cc.')]
    globals_idx=old[1]['_globals']['__id__']; indices+=list(range(globals_idx,len(old)))
    indices=list(dict.fromkeys(indices)); mapping={i:j for j,i in enumerate(indices)}
    def remap(v):
        if isinstance(v,dict):
            if '__id__' in v: return {'__id__':mapping[v['__id__']]} if v['__id__'] in mapping else None
            return {k:remap(x) for k,x in v.items()}
        if isinstance(v,list): return [remap(x) for x in v if not isinstance(x,dict) or '__id__' not in x or x['__id__'] in mapping]
        return v
    b.nodes=[remap(copy.deepcopy(old[i])) for i in indices]
    b.nodes[0]['_name']='runner'; b.nodes[1]['_name']='runner'; b.nodes[1]['_id']=uid('runner-scene')
    canvas=mapping[2]; b.root_id=canvas; b.nodes[canvas]['_children']=[ref(mapping[3])]
    bg=image(b,canvas,'SandBackdrop','white',0,0,750,1334,(207,141,75,255)); b.widget(bg,H.TOP|H.BOTTOM|H.LEFT|H.RIGHT)
    world=b.node('World',canvas,750,1334)
    terrain=b.node('TerrainPool',world,750,1334); items=b.node('ItemPool',world,750,1334)
    worldview=component(b,world,script('RunnerWorldView'),terrainRoot=ref(terrain),itemRoot=ref(items),itemPrefab=asset(item,'cc.Prefab'))
    actorroot=b.node('ActorRoot',world,750,1334)
    fxroot=b.node('Effects',world,750,1334); fx=component(b,fxroot,script('RunnerEffects'),cameraRig=ref(world),burstPrefab=asset(burst,'cc.Prefab'))
    for side in [-1,1]: image(b,canvas,'CanyonEdge','white',side*368,0,14,1334,(88,44,24,175))
    hud=b.node('HUD',canvas,750,1334); b.widget(hud,H.TOP|H.BOTTOM|H.LEFT|H.RIGHT)
    pause,_=button(b,hud,'Pause','Ⅱ',-319,595,75,75,True)
    gold=image(b,hud,'GoldBoard','wood',-179,595,175,70); image(b,gold,'Icon','coin',-53,0,38,42)
    coins=text(b,gold,'Coins','0',18,0,108,50,28)
    distanceboard=image(b,hud,'DistanceBoard','wood',20,595,202,70); text(b,distanceboard,'Flag','⚑',-65,0,40,50,31,GOLD)
    distance=text(b,distanceboard,'Distance','0m',20,0,135,50,29)
    health=image(b,hud,'HealthBoard','wood',247,595,220,70)
    hearts=[]
    for i in range(3):
        h=image(b,health,'Heart'+str(i),'heart',(i-1)*61,0,48,46); hearts.append(ref(findcomp(b,h,'cc.Sprite')))
    mission=image(b,hud,'MissionBoard','wood',-292,458,137,144)
    text(b,mission,'Title','每日任务',0,41,130,42,21,GOLD); text(b,mission,'Goal','收集金币',0,6,130,35,19)
    missionlabel=text(b,mission,'Progress','0 / 50',0,-31,130,45,23)
    bestboard=image(b,hud,'BestBoard','wood',286,478,154,108)
    text(b,bestboard,'Title','★ 最高分',0,24,145,40,19,GOLD); best=text(b,bestboard,'Best','0',0,-18,145,42,25)
    powerbuttons=[];counts=[]
    for i,art in enumerate(['magnet','shield','boot']):
        bt,caption=button(b,hud,'Power-'+art,'',-313,298-i*102,82,88)
        n=b.nodes[bt]['node']['__id__']; image(b,n,'Icon',art,0,8,46,51)
        count=text(b,n,'Count','1',22,-27,45,30,17); powerbuttons.append(ref(bt)); counts.append(ref(count))
    left,_=button(b,hud,'Left','◀',-262,-488,136,136,True)
    right,_=button(b,hud,'Right','▶',262,-488,136,136,True)
    jump,_=button(b,hud,'Jump','跳跃',0,-488,120,110,True)
    weight=text(b,hud,'Weight','泥球 12%',0,-347,240,42,24,GOLD)
    track=image(b,hud,'MissionTrack','wood',0,-602,430,58)
    image(b,track,'Inset','white',21,0,332,20,(40,22,11,255))
    fill=image(b,track,'Fill','white',21,0,328,16,GOLD); fsp=findcomp(b,fill,'cc.Sprite'); b.nodes[fsp].update(_type=3,_fillType=0,_fillStart=0,_fillRange=0)
    image(b,track,'Star','star-badge',-184,0,47,47)
    text(b,hud,'Caption','收集 50 枚金币 · 完成西部挑战',0,-647,480,30,17)
    hint=text(b,hud,'Hint','正在准备西部冒险…',0,-413,710,45,21); hintop=b.opacity(b.nodes[hint]['node']['__id__'])
    hudview=component(b,hud,script('RunnerHudView'),coins=ref(coins),distance=ref(distance),best=ref(best),mission=ref(missionlabel),hint=ref(hint),hintOpacity=ref(hintop),progress=ref(fsp),hearts=hearts,powerCounts=counts,powerButtons=powerbuttons,left=ref(left),right=ref(right),pause=ref(pause),jump=ref(jump),weight=ref(weight))
    modalroot=b.node('ModalRoot',canvas,750,1334)
    component(b,canvas,script('RunnerGame'),world=ref(worldview),hud=ref(hudview),effects=ref(fx),actorRoot=ref(actorroot),modalRoot=ref(modalroot),actorPrefab=asset(actor,'cc.Prefab'),modalPrefab=asset(modal,'cc.Prefab'))
    scene=ASSETS/'scenes/runner.scene'; H.write_json(scene,b.nodes)
    H.write_json(Path(str(scene)+'.meta'),{'ver':'1.1.50','importer':'scene','imported':True,'uuid':uid('runner-scene'),'files':['.json'],'subMetas':{},'userData':{}})
    print('Created runner.scene with editor-injected references and 4 reusable prefabs.')

if __name__=='__main__':
    prepare_ui(); build_scene(build_item(),build_actor(),build_burst(),build_modal())
