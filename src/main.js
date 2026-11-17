import './style.css';
import './util.js';
import './textures.js';
import './materials.js';
import './characters.js';
import './entities.js';
import './looks.js';
import './world.js';
import './scene.js';
import './history.js';
import './camera.js';
import './thumbs.js';
import './editor.js';
import './ui.js';
import './toolcard.js';
import './panel.js';
import './store.js';
import './input.js';
import './play.js';
import './menu.js';
import * as T from 'three';
import { bcam, camAnim, frameCourse, placeCam, setCamAnim } from './camera.js';
import { animChar } from './characters.js';
import { mode, selId, setTool } from './editor.js';
import { LOOKS } from './looks.js';
import { drawCharPreview, renderAll } from './panel.js';
import { P, updatePlay } from './play.js';
import { applyLook, camera, ents, lightPool, nightLights, rebuildAll, renderer, scene, selBox, stage, sun } from './scene.js';
import { log } from './ui.js';
import { defaultWorld, loadWorld, setWorld, world } from './world.js';

/* ---------------- Loop ---------------- */
function resize(){ const w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(stage);
const timer = new T.Timer(); timer.connect(document); let tAll = 0, lightT = 0;
function loop(){
  requestAnimationFrame(loop);
  timer.update(); const dt = Math.min(timer.getDelta(), 1/20); tAll += dt;
  if (mode === 'play' && P.obj){ const steps = 2; for (let i = 0; i < steps; i++) updatePlay(dt / steps); }
  else {
    if (camAnim){ bcam.target.lerp(camAnim.target, 1 - Math.pow(.002, dt)); bcam.dist += (camAnim.dist - bcam.dist) * (1 - Math.pow(.002, dt)); if (bcam.target.distanceTo(camAnim.target) < .02 && Math.abs(bcam.dist - camAnim.dist) < .05) setCamAnim(null); }
    placeCam(bcam);
    if (selId != null && ents.has(selId)){ selBox.box.setFromObject(ents.get(selId).obj).expandByScalar(.05); selBox.visible = true; } else selBox.visible = false;
  }
  for (const r of ents.values()){
    const u = r.obj.userData;
    if (u.spin){ if (r.st.got){ r.st.pop = (r.st.pop || 0) + dt * 5; const s = Math.max(0, 1 - r.st.pop); u.spin.scale.setScalar(s + .001); u.spin.position.y = .55 + r.st.pop * .6; if (s <= 0) r.obj.visible = false; }
      else { u.spin.rotation.z = tAll * 2.6 + r.e.id; u.spin.position.y = .55 + Math.sin(tAll * 2.4 + r.e.id) * .08; u.spin.scale.setScalar(1); } }
    if (u.flag) u.flag.rotation.y = Math.sin(tAll * 2.2) * .25;
    if (u.char && mode === 'build') animChar(u.char, 'idle', tAll, dt);
  }
  if (nightLights){ lightT -= dt; if (lightT <= 0){ lightT = .4; const c = mode === 'play' ? P.pos : bcam.target;
      const glowers = world.entities.filter(e => ['lamp','crystal','checkpoint','goal'].includes(e.kind)).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z));
      lightPool.forEach((l, i) => { const e = glowers[i]; if (!e){ l.intensity = 0; return; } const s = e.s || 1;
        l.position.set(e.x, e.y + ({lamp:2.6, crystal:.9, checkpoint:1.8, goal:3}[e.kind]) * s, e.z); l.color.set(e.kind === 'crystal' ? (e.color || '#8b5cf6') : e.kind === 'goal' ? '#ff7a45' : '#ffc070'); l.intensity = 9; }); } }
  sun.position.set(...(LOOKS[world.look] || LOOKS.soft).sp);
  renderer.render(scene, camera);
  drawCharPreview(tAll, dt);
}

/* ---------------- Init ---------------- */
setWorld(loadWorld() || defaultWorld());
rebuildAll(); applyLook(world.look); setTool('select'); renderAll(); resize(); frameCourse();
if (camAnim){ bcam.target.copy(camAnim.target); bcam.dist = camAnim.dist; setCamAnim(null); }
log('Loaded “' + world.title + '” with ' + world.entities.length + ' things');
loop();
