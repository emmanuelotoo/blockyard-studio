import * as T from 'three';
import { bcam, focusEnt, frameCourse, pcam, setCamAnim } from './camera.js';
import { catalogEnt, ghost, mode, paintTex, pick, placeId, placementFor, ray, selId, select, setRay, setTool, tool } from './editor.js';
import { CAT_BY_ID, SIZED, entName } from './entities.js';
import { beginEdit, commitEdit, redo, save, snapshot, undo } from './history.js';
import { respawn, stopPlay } from './play.js';
import { addEnt, canvas, ents, getEnt, refreshEnt, removeEnt } from './scene.js';
import { closeStore } from './store.js';
import { delSel, dupSel, nudgeSel, renderToolCard, rotateSel } from './toolcard.js';
import { log, toast } from './ui.js';
import { $, clamp, snap } from './util.js';
import { world } from './world.js';

/* ---------------- Pointer input ---------------- */
export let ptr = null; export const pointers = new Map();
export const plane = new T.Plane(new T.Vector3(0, 1, 0), 0), tmpV = new T.Vector3();
canvas.addEventListener('contextmenu', e => e.preventDefault());
canvas.addEventListener('pointerdown', ev => {
  canvas.focus({preventScroll:true});
  canvas.setPointerCapture(ev.pointerId); pointers.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
  if (pointers.size === 2){ const [a, b] = [...pointers.values()]; ptr = {mode:'pinch', d:Math.hypot(a.x - b.x, a.y - b.y), mx:(a.x + b.x)/2, my:(a.y + b.y)/2, moved:true}; return; }
  const base = {x:ev.clientX, y:ev.clientY, sx:ev.clientX, sy:ev.clientY, moved:false};
  if (mode === 'play'){ ptr = Object.assign(base, {mode:'look'}); return; }
  if (ev.button === 2 || ev.button === 1 || ev.shiftKey){ ptr = Object.assign(base, {mode:'pan'}); return; }
  if (tool === 'select'){
    const p = pick(ev);
    if (p && p.eid != null){ select(p.eid); const e = getEnt(p.eid); ptr = Object.assign(base, {mode:'drag', eid:p.eid, y0:e.y, off:null, hist:false}); return; }
  }
  ptr = Object.assign(base, {mode:'orbit'});
});
canvas.addEventListener('pointermove', ev => {
  if (pointers.has(ev.pointerId)) pointers.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
  if (!ptr){ if (mode === 'build') hover(ev); return; }
  if (ptr.mode === 'pinch'){
    if (pointers.size < 2) return; const [a, b] = [...pointers.values()];
    const d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x)/2, my = (a.y + b.y)/2;
    const c = mode === 'play' ? pcam : bcam; c.dist = clamp(c.dist * ptr.d / d, mode === 'play' ? 4 : 4, mode === 'play' ? 18 : 90);
    if (mode === 'build') panBy(mx - ptr.mx, my - ptr.my);
    ptr.d = d; ptr.mx = mx; ptr.my = my; return;
  }
  const dx = ev.clientX - ptr.x, dy = ev.clientY - ptr.y; ptr.x = ev.clientX; ptr.y = ev.clientY;
  if (Math.hypot(ev.clientX - ptr.sx, ev.clientY - ptr.sy) > 4) ptr.moved = true;
  if (ptr.mode === 'orbit'){ bcam.yaw -= dx * .006; bcam.pitch = clamp(bcam.pitch + dy * .005, .08, 1.48); setCamAnim(null); }
  else if (ptr.mode === 'look'){ pcam.yaw -= dx * .006; pcam.pitch = clamp(pcam.pitch + dy * .005, -.1, 1.3); }
  else if (ptr.mode === 'pan') panBy(dx, dy);
  else if (ptr.mode === 'drag' && ptr.moved){
    const r = ents.get(ptr.eid); if (!r) return;
    setRay(ev); plane.constant = -ptr.y0; if (!ray.ray.intersectPlane(plane, tmpV)) return;
    if (!ptr.hist){ beginEdit(); ptr.hist = true; ptr.off = {x:r.e.x - tmpV.x, z:r.e.z - tmpV.z}; }
    r.e.x = snap(tmpV.x + ptr.off.x, .5); r.e.z = snap(tmpV.z + ptr.off.z, .5); r.obj.position.set(r.e.x, r.e.y, r.e.z);
    canvas.style.cursor = 'grabbing';
  }
});
export function endPtr(ev){
  pointers.delete(ev.pointerId);
  if (!ptr) return;
  const p = ptr; if (p.mode === 'pinch'){ if (pointers.size === 0) ptr = null; return; }
  ptr = null;
  if (mode !== 'build') return;
  if (p.mode === 'drag'){ canvas.style.cursor = 'default'; if (p.hist){ commitEdit(); renderToolCard(); } return; }
  if (p.moved || ev.type === 'pointercancel') return;
  if (p.mode === 'orbit' && ev.button === 0) clickAction(ev);
}
canvas.addEventListener('pointerup', endPtr); canvas.addEventListener('pointercancel', endPtr);
canvas.addEventListener('pointerleave', () => { if (ghost) ghost.visible = false; $('#tip3d').style.display = 'none'; });
canvas.addEventListener('wheel', e => { e.preventDefault(); const c = mode === 'play' ? pcam : bcam; c.dist = clamp(c.dist * Math.exp(e.deltaY * .0012), 4, mode === 'play' ? 18 : 90); setCamAnim(null); }, {passive:false});
export function panBy(dx, dy){
  const k = bcam.dist * .0016, sy = Math.sin(bcam.yaw), cy = Math.cos(bcam.yaw);
  bcam.target.x -= (cy * dx + sy * dy) * k; bcam.target.z -= (-sy * dx + cy * dy) * k; setCamAnim(null);
}
export function hover(ev){
  const tip = $('#tip3d');
  if (tool === 'place' && ghost){
    const pl = placementFor(ev, ghost.userData.ghostEnt);
    if (pl){ ghost.visible = true; ghost.position.set(pl.x, pl.y, pl.z); } else ghost.visible = false;
    tip.style.display = 'none'; return;
  }
  const p = pick(ev);
  if (p && p.eid != null){ const e = getEnt(p.eid); const r = canvas.getBoundingClientRect(); tip.textContent = entName(e); tip.style.left = (ev.clientX - r.left) + 'px'; tip.style.top = (ev.clientY - r.top) + 'px'; tip.style.display = 'block'; }
  else tip.style.display = 'none';
}
export function clickAction(ev){
  if (tool === 'select'){ select(null); return; }
  if (tool === 'place'){
    const c = CAT_BY_ID[placeId]; const pl = placementFor(ev, ghost.userData.ghostEnt); if (!pl) return;
    snapshot();
    if (c.kind === 'spawn'){ const sp = world.entities.find(e => e.kind === 'spawn'); Object.assign(sp, pl); refreshEnt(sp.id); log('Moved the player start'); }
    else { const e = catalogEnt(placeId, pl); world.entities.push(e); addEnt(e); log(`Placed ${entName(e)} at ${pl.x}, ${pl.y}, ${pl.z}`); toast('Placed ' + c.name.toLowerCase()); }
    save(); return;
  }
  const p = pick(ev); if (!p || p.eid == null) return;
  const e = getEnt(p.eid);
  if (tool === 'paint'){ if (!SIZED.has(e.kind)) return toast('Paint works on blocks, movers and crumbles'); snapshot(); e.tex = paintTex; delete e.color; refreshEnt(e.id); save(); }
  if (tool === 'erase'){ if (e.kind === 'spawn') return toast('The player start can’t be erased'); snapshot(); world.entities = world.entities.filter(x => x !== e); removeEnt(e.id); log('Erased ' + entName(e)); save(); }
}

/* ---------------- Keyboard ---------------- */
export const keys = {}; export let jumpPressed = false, dashPressed = false;
export function setJump(v){ jumpPressed = v; }
export function setDash(v){ dashPressed = v; }
export const typing = () => { const a = document.activeElement; return a && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA' || a.isContentEditable); };
addEventListener('keydown', ev => {
  if (typing()){ if (ev.key === 'Escape') document.activeElement.blur(); return; }
  const k = ev.key.toLowerCase(), mod = ev.ctrlKey || ev.metaKey;
  if ($('#store').classList.contains('open')){ if (k === 'escape') closeStore(); return; }
  if (mode === 'play'){
    if (k === 'escape'){ stopPlay(); return; }
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) ev.preventDefault();
    if (k === ' ' && !keys[' ']) setJump(true);
    if (k === 'shift' && !keys.shift) setDash(true);
    if (k === 'r' && !mod) respawn('Restarted from checkpoint');
    keys[k] = true; return;
  }
  if (mod && k === 'z'){ ev.preventDefault(); ev.shiftKey ? redo() : undo(); return; }
  if (mod && k === 'y'){ ev.preventDefault(); redo(); return; }
  if (mod && k === 'd'){ ev.preventDefault(); dupSel(); return; }
  if (mod) return;
  switch (k){
    case 'escape': if (tool !== 'select') setTool('select'); else select(null); break;
    case 'v': setTool('select'); break; case 'b': setTool('place'); break; case 'p': setTool('paint'); break; case 'x': setTool('erase'); break;
    case 'delete': case 'backspace': delSel(); break;
    case 'r': rotateSel(); break;
    case 'q': nudgeSel(-.5); break; case 'e': nudgeSel(.5); break;
    case 'f': selId != null ? focusEnt(selId) : frameCourse(); break;
  }
});
addEventListener('keyup', ev => { keys[ev.key.toLowerCase()] = false; });
addEventListener('blur', () => { for (const k in keys) keys[k] = false; });
