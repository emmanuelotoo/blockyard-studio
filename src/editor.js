import * as T from 'three';
import { buildCharacter } from './characters.js';
import { BUILD, CAT_BY_ID, entSize } from './entities.js';
import { camera, canvas, disposeObj, entRoot, scene, selBox, slab } from './scene.js';
import { renderToolCard } from './toolcard.js';
import { $$, r2, snap } from './util.js';
import { mkEnt, world } from './world.js';

/* ---------------- Editing state ---------------- */
export let mode = 'build', tool = 'select', selId = null, placeId = 'stone', paintTex = 'cobble';
export let ghost = null;
export function setMode(m){ mode = m; }
export function setPlaceId(v){ placeId = v; }
export function setPaintTex(v){ paintTex = v; }
export function select(id){ selId = id; selBox.visible = false; renderToolCard(); }
export function setTool(t, opts = {}){
  tool = t; if (opts.place) placeId = opts.place; if (opts.tex) paintTex = opts.tex;
  $$('.rail [data-tool]').forEach(b => b.setAttribute('aria-pressed', b.dataset.tool === t));
  if (t !== 'select') select(null);
  makeGhost(); renderToolCard();
  canvas.style.cursor = t === 'select' ? 'default' : 'crosshair';
}
export function makeGhost(){
  if (ghost){ scene.remove(ghost); disposeObj(ghost); ghost = null; }
  if (tool !== 'place' || mode !== 'build') return;
  const c = CAT_BY_ID[placeId]; const e = mkEnt(c.kind, c.w ? {w:c.w, h:c.h, d:c.d, tex:c.tex} : {});
  ghost = c.kind === 'spawn' ? buildCharacter(world.character) : BUILD[c.kind](e);
  ghost.traverse(o => { if (o.isMesh){ o.castShadow = false; o.receiveShadow = false; const ms = Array.isArray(o.material) ? o.material : [o.material]; const cl = ms.map(m => { const n = m.clone(); n.transparent = true; n.opacity = .5; n.depthWrite = false; return n; }); o.material = Array.isArray(o.material) ? cl : cl[0]; o.userData.keepMat = true; } });
  ghost.visible = false; ghost.userData.ghostEnt = e; scene.add(ghost);
}
export function catalogEnt(id, pos){
  const c = CAT_BY_ID[id]; const e = mkEnt(c.kind, Object.assign(c.w ? {w:c.w, h:c.h, d:c.d, tex:c.tex} : {}, pos));
  e.id = world.nextId++; return e;
}

/* ---------------- Picking ---------------- */
export const ray = new T.Raycaster(), ndc = new T.Vector2();
export function setRay(ev){ const r = canvas.getBoundingClientRect(); ndc.set(((ev.clientX - r.left)/r.width)*2 - 1, -((ev.clientY - r.top)/r.height)*2 + 1); ray.setFromCamera(ndc, camera); }
export function pick(ev){
  setRay(ev);
  const hits = ray.intersectObjects([...entRoot.children, slab], true);
  for (const h of hits){
    if (!h.object.visible) continue;
    let o = h.object; while (o && o.userData.eid === undefined && o !== slab) o = o.parent;
    return {hit:h, eid:o && o.userData.eid !== undefined ? o.userData.eid : null};
  }
  return null;
}
export function placementFor(ev, e){
  const p = pick(ev); if (!p) return null;
  const h = p.hit, n = h.face ? h.face.normal.clone().transformDirection(h.object.matrixWorld) : new T.Vector3(0, 1, 0);
  const sz = entSize(e); let {x, y, z} = h.point;
  if (n.y > .5){ /* on top */ }
  else if (n.y < -.5) y -= sz[1];
  else { x += n.x * sz[0]/2; z += n.z * sz[2]/2; y = snap(y - sz[1]/2, .5); }
  return {x:snap(x, .5), y:Math.max(-.0, r2(y)), z:snap(z, .5)};
}
