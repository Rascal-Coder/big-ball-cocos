"""One-time migration of the existing GameApp from its placeholder game to runner.scene."""
import re
from pathlib import Path
p=Path(__file__).resolve().parents[1]/'assets/scripts/app/GameApp.ts'
s=p.read_text(encoding='utf-8')
if "import { RunSessionService }" not in s:
    s=s.replace("import { MapStreamer } from '../map/MapStreamer';", "import { RunSessionService } from '../runner/RunSessionService';")
remove={'onEnable','onDisable','update','_show','_enterGame','_enterGamePlay','_startRun','_ensureActors','_bootMap','_tickGame','_collideMap','_openResult','_refreshHud','_onKeyDown','_onKeyUp','_setKey','_buildGame','_buildResult','_hudText','_dot','_clamp','_page','_must','_ui','_fill','_label','_pin','_leaveHomeToGame'}
matches=list(re.finditer(r'^    (?:(?:private|public|protected) )?(?:async )?(\w+)\(',s,re.M))
for i in range(len(matches)-1,-1,-1):
    m=matches[i]
    if m.group(1) in remove:
        end=matches[i+1].start() if i+1<len(matches) else s.rfind('\n}')
        s=s[:m.start()]+s[end:]
s=s.replace("            this.game = this._page('Game');\n            this.result = this._page('Result');\n            this.overlay = this._page('Overlay');", "            this.overlay = this.node.getChildByName('Overlay')!;")
s=s.replace('            this._buildGame();\n            this._buildResult();\n','')
for name in ['keyDir','move','world','ball','beetle','joystick','hudGold','hudDistance','hudWeight','hudLives','resultBody','map','ballPos','facing']:
    s=re.sub(r'^    private (?:readonly )?'+name+r'\b[^\n]*\n','',s,flags=re.M)
s=s.replace("import { Joystick } from '../ui/Joystick';\n",'')
launch='''    private _leaveHomeToGame(): void {
        if (this.phase !== 'home') return;
        this.phase = 'game';
        RunSessionService.skin = this.model.skinId;
        director.loadScene('runner', (error) => {
            if (error) {
                console.error('[GameApp] runner scene', error);
                this._enterHome();
            }
        });
    }

'''
s=s.replace('    private _loadFonts(): void {',launch+'    private _loadFonts(): void {')
# Keep the remaining imports explicit and small.
start=s.index('import {'); end=s.index("} from 'cc';")+len("} from 'cc';")
s=s[:start]+"import { _decorator, Asset, Component, Constructor, director, Font, Label, Node, Prefab, SpriteFrame, UIOpacity, view, ResolutionPolicy, Color } from 'cc';"+s[end:]
p.write_text(s,encoding='utf-8')
print('Home start now loads the authored runner.scene; old runtime UI/placeholder loop removed.')
