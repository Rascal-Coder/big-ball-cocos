"""Technical atlas extraction: measured source rectangles, preserving original RGBA pixels.
New output directory avoids replacing the user's existing map work.
"""
import importlib.util,json,uuid
from pathlib import Path
from PIL import Image
HERE=Path(__file__).resolve().parent; ROOT=HERE.parents[1]
OUT=HERE.parent/'assets/resources/runner-map'; OUT.mkdir(exist_ok=True)
spec=importlib.util.spec_from_file_location('slicer',HERE/'slice-new-map.py'); S=importlib.util.module_from_spec(spec);spec.loader.exec_module(S)
NS=uuid.UUID('51bfb8e1-d681-4a6d-9295-1819eeac27ad')
def save(name,im,rect):
    # Atlas sheet coordinates are measured against the 1254px source.
    kx,ky=im.width/1254,im.height/1254
    crop=im.crop(tuple(round(v*(kx if i%2==0 else ky)) for i,v in enumerate(rect)))
    bounds=crop.getchannel('A').getbbox()
    if bounds: crop=crop.crop(bounds)
    crop.save(OUT/(name+'.png'))
    data=S.image_meta(str(uuid.uuid5(NS,name)),name,*crop.size)
    S.write_json(OUT/(name+'.png.meta'),data)
def main():
    icons=Image.open(ROOT/'docs/new-map/image.png').convert('RGBA')
    obstacles=Image.open(ROOT/'docs/new-map/image3.png').convert('RGBA')
    deco=Image.open(ROOT/'docs/new-map/image2.png').convert('RGBA')
    tiles=Image.open(ROOT/'docs/new-map/image1.png').convert('RGBA')
    xs=[(16,253),(266,500),(507,750),(765,991),(1002,1245)]
    icon_rows=[(90,347),(367,627),(644,899),(916,1203)]
    names={(0,0):'coin',(3,0):'heart',(4,0):'magnet',(0,1):'star-badge',(1,1):'shield',(0,2):'boot'}
    for (col,row),name in names.items(): save(name,icons,(xs[col][0],icon_rows[row][0],xs[col][1],icon_rows[row][1]))
    obs_rows=[(88,344),(365,630),(650,894),(923,1168)]
    for col,row,name in [(1,0,'stone-ball'),(2,0,'rock-pile'),(3,0,'spike-fence'),(3,1,'tnt'),(4,1,'crate'),(3,2,'cart')]:
        save(name,obstacles,(xs[col][0],obs_rows[row][0],xs[col][1],obs_rows[row][1]))
    for col,row,name in [(0,0,'cactus-saguaro'),(1,1,'agave'),(4,0,'bush'),(4,2,'skull-post'),(0,2,'fence-h')]:
        ys=[(65,323),(370,582),(636,858),(923,1168)]
        save(name,deco,(xs[col][0]+12,ys[row][0],xs[col][1]-10,ys[row][1]))
    for col,row,name in [(0,0,'sand-plain'),(3,0,'sand-cracks'),(4,1,'path-ns')]:
        x0,x1=S.TILE_XS[col];y0,y1=S.TILE_YS[row]
        save(name,tiles,(x0,y0,x1,y1))
    print('Extracted 21 clean map/UI sprites from docs/new-map; original artwork and old map assets preserved.')
if __name__=='__main__': main()
