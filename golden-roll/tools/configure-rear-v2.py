"""Create Cocos metadata for independently generated sprites and the ground material."""
import importlib.util
import json
import uuid
from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
ASSETS = HERE.parent / 'assets'
NS = uuid.UUID('475f5769-3f71-4f3a-955c-bd604b33d140')
spec = importlib.util.spec_from_file_location('metadata', HERE / 'slice-new-map.py')
metadata = importlib.util.module_from_spec(spec)
spec.loader.exec_module(metadata)

def uid(name): return str(uuid.uuid5(NS, name))
def write(path, value): path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
def basic(name, importer, ver):
    return dict(ver=ver, importer=importer, imported=True, uuid=uid(name), files=[], subMetas={}, userData={})

folder = ASSETS / 'runner-art/rear-v2'
write(Path(str(folder) + '.meta'), basic('rear-v2', 'directory', '1.2.0'))
for path in folder.glob('*.png'):
    im = Image.open(path)
    assert im.size == (1024, 1024), path
    data = metadata.image_meta(uid(path.stem), path.stem, *im.size)
    if path.stem not in ('sand-plain', 'path-ns'):
        assert im.mode == 'RGBA' and im.getchannel('A').getextrema() == (0, 255), path
        x, y, r, b = im.getchannel('A').point(lambda a: 255 if a > 12 else 0).getbbox()
        data['subMetas']['f9941']['userData'].update(trimType='custom', trimX=x, trimY=y, width=r-x, height=b-y, rawWidth=r-x, rawHeight=b-y, offsetX=0, offsetY=0)
    write(Path(str(path) + '.meta'), data)

out = ASSETS / 'resources/runner-ui'
effect = basic('ground-warp-effect', 'effect', '1.7.1'); effect['files'] = ['.json']
write(out / 'ground-warp.effect.meta', effect)
write(out / 'ground-warp.mtl', {'__type__':'cc.Material', '_name':'ground-warp', '_objFlags':0, '__editorExtras__':{}, '_native':'', '_effectAsset':{'__uuid__':uid('ground-warp-effect'), '__expectedType__':'cc.EffectAsset'}, '_techIdx':0, '_defines':[{'USE_TEXTURE':True}], '_states':[{}], '_props':[{}]})
material = basic('ground-warp-material', 'material', '1.0.21'); material['files'] = ['.json']
write(out / 'ground-warp.mtl.meta', material)
print('11 sprites verified; independent body/hat and ground material metadata authored.')
