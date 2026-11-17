import * as T from 'three';
import { pcam, placeCam } from './camera.js';
import { animChar, buildCharacter } from './characters.js';
import { ghost, makeGhost, mode, select, setMode } from './editor.js';
import { SOLID, entSize } from './entities.js';
import { commitEdit, preEdit } from './history.js';
import { dashPressed, jumpPressed, keys, setDash, setJump, tmpV } from './input.js';
import { HALF, canvas, disposeObj, ents, grid, nightLights, playerLight, scene, setGlow, swapMats } from './scene.js';
import { closeStore } from './store.js';
import { renderToolCard } from './toolcard.js';
import { log, renderHud, toast } from './ui.js';
import { $, PI, clamp } from './util.js';
import { world } from './world.js';

/* ---------------- Play mode ---------------- */
export const PH = 1.8, PR = .3;
export const P = {obj:null, pos:new T.Vector3(), vel:new T.Vector3(), coins:0, time:0};
export const joy = {x:0, y:0};
export function startPlay(){
  if (mode === 'play') return;
  closeStore(); if (preEdit) commitEdit();
  setMode('play'); document.body.classList.add('playing'); document.body.classList.remove('finished');
  $('#playBtn').setAttribute('aria-pressed', 'true'); $('#playBtn').classList.add('play-on'); $('#buildBtn').setAttribute('aria-pressed', 'false');
  select(null); if (ghost) ghost.visible = false; grid.visible = false; $('#tip3d').style.display = 'none';
  const sp = world.entities.find(e => e.kind === 'spawn');
  P.obj = buildCharacter(world.character); swapMats(P.obj); setGlow(P.obj); scene.add(P.obj);
  const face = (sp.ry || 0) * PI / 180;
  Object.assign(P, {grounded:false, ground:null, wasGrounded:false, coyote:0, jumpBuf:0, cut:false, pad:false, dashT:0, dashCd:0, airDash:true, dashDir:new T.Vector3(),
    facing:face, coins:0, time:0, done:false, check:null, deaths:0, t:0});
  P.pos.set(sp.x, sp.y + .02, sp.z); P.vel.set(0, 0, 0); P.respawn = P.pos.clone(); P.respawnFace = face;
  for (const r of ents.values()){ r.st = {}; r.obj.visible = r.e.kind !== 'spawn'; r.obj.position.set(r.e.x, r.e.y, r.e.z); if (r.obj.userData.cap) setCap(r, false); }
  pcam.yaw = face + PI; pcam.pitch = .36; pcam.dist = 9; pcam.target.set(P.pos.x, P.pos.y + 1.4, P.pos.z);
  renderHud(); log('Play started'); canvas.focus({preventScroll:true});
}
export function stopPlay(){
  if (mode !== 'play') return;
  setMode('build'); document.body.classList.remove('playing', 'finished');
  $('#playBtn').setAttribute('aria-pressed', 'false'); $('#playBtn').classList.remove('play-on'); $('#buildBtn').setAttribute('aria-pressed', 'true');
  if (P.obj){ scene.remove(P.obj); disposeObj(P.obj); P.obj = null; }
  for (const r of ents.values()){ r.st = {}; r.obj.visible = true; r.obj.position.set(r.e.x, r.e.y, r.e.z); r.obj.rotation.set(0, (r.e.ry || 0) * PI / 180, 0); if (r.obj.userData.cap) setCap(r, false); }
  grid.visible = true; playerLight.intensity = 0; for (const k in keys) keys[k] = false;
  makeGhost(); renderToolCard(); renderHud();
}
export function setCap(r, on){ const cap = r.obj.userData.cap; for (const m of [cap.userData.base || cap.material, cap.material]){ m.userData.boost = on ? 22 : 1; if (m.color) m.color.set(on ? '#ffd27a' : '#ffe2a8'); } setGlow(r.obj); }
export function respawn(msg){
  P.pos.copy(P.respawn); P.vel.set(0, 0, 0); P.facing = P.respawnFace; P.dashT = 0; P.grounded = false;
  pcam.yaw = P.facing + PI;
  const f = $('#flash'); f.style.transition = 'none'; f.style.opacity = .55; requestAnimationFrame(() => { f.style.transition = 'opacity .5s'; f.style.opacity = 0; });
  if (msg) toast(msg);
}
export function colliders(){
  const out = [{minx:-HALF, maxx:HALF, miny:-3, maxy:0, minz:-HALF, maxz:HALF, r:null}];
  for (const r of ents.values()){
    const e = r.e; if (!SOLID[e.kind]) continue;
    if (e.kind === 'crumble' && r.st.phase === 'fall') continue;
    const s = entSize(e), p = r.obj.position;
    out.push({minx:p.x - s[0]/2, maxx:p.x + s[0]/2, miny:p.y, maxy:p.y + s[1], minz:p.z - s[2]/2, maxz:p.z + s[2]/2, r});
  }
  return out;
}
export const EPS = 1e-4;
export function pbox(){ return {minx:P.pos.x - PR, maxx:P.pos.x + PR, miny:P.pos.y, maxy:P.pos.y + PH, minz:P.pos.z - PR, maxz:P.pos.z + PR}; }
export const ov = (a, c) => a.minx < c.maxx - EPS && a.maxx > c.minx + EPS && a.miny < c.maxy - EPS && a.maxy > c.miny + EPS && a.minz < c.maxz - EPS && a.maxz > c.minz + EPS;
export function moveAxis(cols, ax, d){
  if (!d) return; P.pos[ax] += d;
  for (const c of cols){
    const b = pbox(); if (!ov(b, c)) continue;
    if (ax === 'y'){
      if (d < 0){ P.pos.y = c.maxy; P.vel.y = 0; P.grounded = true; P.ground = c; }
      else { P.pos.y = c.miny - PH; P.vel.y = 0; }
    } else {
      const up = c.maxy - P.pos.y;
      if (P.wasGrounded && up > 0 && up <= .36){ P.pos.y = c.maxy; continue; }
      P.pos[ax] = d > 0 ? c['min' + ax] - PR - EPS : c['max' + ax] + PR + EPS; P.vel[ax] = 0;
    }
  }
}
export const fwd = new T.Vector3(), right = new T.Vector3(), wish = new T.Vector3();
export function updatePlay(dt){
  const tu = world.tune, H = tu.jump, Ta = tu.apex, g = 2*H/(Ta*Ta), v0 = 2*H/Ta, run = tu.run;
  if (!P.done) P.time += dt; P.t += dt;
  // dynamic entities
  for (const r of ents.values()){
    const e = r.e, o = r.obj;
    if (e.kind === 'mover'){
      const prev = o.position.clone(); const off = Math.sin(P.t * e.speed * 1.4) * e.dist;
      o.position.set(e.x + (e.axis === 'z' ? 0 : off), e.y, e.z + (e.axis === 'z' ? off : 0)); r.delta = o.position.clone().sub(prev);
    } else if (e.kind === 'crumble'){
      const st = r.st;
      if (st.phase === 'shake'){ st.t += dt; o.position.set(e.x + (Math.random() - .5) * .08, e.y, e.z + (Math.random() - .5) * .08); if (st.t > .6){ st.phase = 'fall'; st.vy = 0; st.t = 0; } }
      else if (st.phase === 'fall'){ st.t += dt; st.vy -= 22 * dt; o.position.y += st.vy * dt; if (st.t > 2.8){ st.phase = null; o.position.set(e.x, e.y, e.z); o.scale.setScalar(.01); st.grow = 0; } }
      if (st.grow !== undefined && st.phase == null){ st.grow = Math.min(1, st.grow + dt * 4); o.scale.setScalar(st.grow); if (st.grow >= 1) delete st.grow; }
    } else if (e.kind === 'jumppad' && r.st.squish){ r.st.squish = Math.max(0, r.st.squish - dt * 4); o.userData.top.scale.y = 1 - r.st.squish * .7; }
  }
  // input
  fwd.set(-Math.sin(pcam.yaw), 0, -Math.cos(pcam.yaw)); right.set(Math.cos(pcam.yaw), 0, -Math.sin(pcam.yaw));
  let ix = (keys.d || keys.arrowright ? 1 : 0) - (keys.a || keys.arrowleft ? 1 : 0) + joy.x;
  let iy = (keys.w || keys.arrowup ? 1 : 0) - (keys.s || keys.arrowdown ? 1 : 0) - joy.y;
  wish.copy(right).multiplyScalar(ix).addScaledVector(fwd, iy); if (wish.lengthSq() > 1) wish.normalize();
  if (P.done) wish.set(0, 0, 0);
  // ride movers
  if (P.ground && P.ground.r && P.ground.r.delta && P.grounded) P.pos.add(P.ground.r.delta);
  P.coyote = P.grounded ? .12 : P.coyote - dt; P.jumpBuf -= dt; P.dashCd -= dt;
  if (jumpPressed){ P.jumpBuf = .13; setJump(false); }
  if (P.jumpBuf > 0 && P.coyote > 0 && !P.done){ P.vel.y = v0; P.coyote = 0; P.jumpBuf = 0; P.grounded = false; P.cut = false; P.pad = false; }
  if (!(keys[' '] || touchJump) && P.vel.y > 0 && !P.cut && !P.pad){ P.vel.y *= .5; P.cut = true; }
  if (dashPressed){ setDash(false); if (P.dashCd <= 0 && (P.grounded || P.airDash) && !P.done){ P.dashT = .17; P.dashCd = .55; if (!P.grounded) P.airDash = false;
    if (wish.lengthSq() > .01) P.dashDir.copy(wish).normalize(); else P.dashDir.set(Math.sin(P.facing), 0, Math.cos(P.facing)); } }
  if (P.dashT > 0){ P.dashT -= dt; P.vel.x = P.dashDir.x * run * 2.7; P.vel.z = P.dashDir.z * run * 2.7; P.vel.y = Math.max(P.vel.y, 0) * .2; }
  else {
    const acc = (P.grounded ? 70 : 28) * dt;
    const tx = wish.x * run, tz = wish.z * run;
    P.vel.x += clamp(tx - P.vel.x, -acc, acc); P.vel.z += clamp(tz - P.vel.z, -acc, acc);
    P.vel.y -= g * (P.vel.y < 0 ? 1.25 : 1) * dt; P.vel.y = Math.max(P.vel.y, -45);
  }
  if (P.vel.y <= 0) P.pad = false;
  // collide
  const cols = colliders();
  P.wasGrounded = P.grounded;
  moveAxis(cols, 'x', P.vel.x * dt); moveAxis(cols, 'z', P.vel.z * dt);
  P.grounded = false; P.ground = null; moveAxis(cols, 'y', P.vel.y * dt);
  if (P.grounded){
    P.airDash = true; const gr = P.ground.r;
    if (gr && gr.e.kind === 'jumppad'){ P.vel.y = Math.sqrt(2 * g * 7.5); P.grounded = false; P.pad = true; P.coyote = 0; gr.st.squish = 1; }
    if (gr && gr.e.kind === 'crumble' && !gr.st.phase){ gr.st.phase = 'shake'; gr.st.t = 0; }
  }
  // triggers
  const cx = P.pos.x, cy = P.pos.y + PH/2, cz = P.pos.z;
  for (const r of ents.values()){
    const e = r.e, s = e.s || 1;
    if (e.kind === 'coin' && !r.st.got){ if (Math.hypot(cx - e.x, cy - (e.y + .55*s), cz - e.z) < .95 * s + .1){ r.st.got = true; r.st.pop = 0; P.coins++; bumpHud(); } }
    else if (e.kind === 'checkpoint' && P.check !== e.id){ if (Math.hypot(cx - e.x, cz - e.z) < 1.1 * s && P.pos.y >= e.y - .2 && P.pos.y < e.y + 2.2){ P.check = e.id; P.respawn.set(e.x + .9*s, e.y + .3*s + .02, e.z); P.respawnFace = P.facing;
        for (const q of ents.values()) if (q.obj.userData.cap) setCap(q, q === r); toast('Checkpoint saved'); log('Reached checkpoint #' + e.id); } }
    else if (e.kind === 'spikes'){ const b = pbox(); const hw = 1 * s, p = r.obj.position; if (ov(b, {minx:p.x - hw, maxx:p.x + hw, miny:p.y, maxy:p.y + .62*s, minz:p.z - hw, maxz:p.z + hw})){ P.deaths++; respawn('Ouch. Back to the checkpoint'); } }
    else if (e.kind === 'goal' && !P.done){ if (Math.hypot(cx - e.x, cz - e.z) < 1.2 * s && P.pos.y >= e.y - .3 && P.pos.y < e.y + 3){ finish(); } }
  }
  if (P.pos.y < -20){ P.deaths++; respawn('Fell off. Back to the checkpoint'); }
  // facing + anim
  const hs = Math.hypot(P.vel.x, P.vel.z);
  if (hs > .5){ const tf = Math.atan2(P.vel.x, P.vel.z); let d = tf - P.facing; d = Math.atan2(Math.sin(d), Math.cos(d)); P.facing += d * Math.min(1, dt * 14); }
  P.obj.position.copy(P.pos); P.obj.rotation.y = P.facing;
  P.phase = (P.phase || 0) + dt * (hs / Math.max(run, 1)) * 1.1;
  animChar(P.obj, !P.grounded ? 'air' : hs > run * .6 ? 'run' : hs > .6 ? 'walk' : 'idle', P.grounded && hs > .6 ? P.phase * 6 : P.t, dt);
  // camera
  let cyaw = 0; if (keys.q) cyaw += 1; if (keys.e) cyaw -= 1; pcam.yaw += cyaw * dt * 2.2;
  const tgt = tmpV.set(P.pos.x, P.pos.y + 1.4, P.pos.z); pcam.target.lerp(tgt, 1 - Math.pow(.0005, dt));
  placeCam(pcam);
  if (nightLights){ playerLight.position.set(P.pos.x, P.pos.y + 2.2, P.pos.z); playerLight.intensity = 5; }
  const tn = $('#timeN'); if (tn) tn.textContent = P.time.toFixed(1);
}
export function bumpHud(){ renderHud(); const c = $('#coinN'); if (c){ c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } }
export function finish(){
  P.done = true; const total = world.entities.filter(e => e.kind === 'coin').length;
  $('#finishText').textContent = `${P.time.toFixed(1)} seconds, ${P.coins} of ${total} coins, ${P.deaths} ${P.deaths === 1 ? 'fall' : 'falls'}.`;
  setTimeout(() => { if (mode === 'play') document.body.classList.add('finished'); }, 500);
  log(`Finished in ${P.time.toFixed(1)}s with ${P.coins}/${total} coins`);
}
$('#againBtn').onclick = () => { stopPlay(); startPlay(); };
$('#backBtn').onclick = () => stopPlay();

/* touch controls */
export let touchJump = false;
if (matchMedia('(pointer: coarse)').matches) document.body.classList.add('coarse');
{ const jb = $('#joy'), knob = jb.querySelector('i'); let id = null;
  const upd = e => { const r = jb.getBoundingClientRect(); let x = (e.clientX - r.left - r.width/2) / (r.width/2), y = (e.clientY - r.top - r.height/2) / (r.height/2); const l = Math.hypot(x, y); if (l > 1){ x /= l; y /= l; } joy.x = x; joy.y = y; knob.style.transform = `translate(${x*35}px,${y*35}px)`; };
  jb.addEventListener('pointerdown', e => { id = e.pointerId; jb.setPointerCapture(id); upd(e); });
  jb.addEventListener('pointermove', e => { if (e.pointerId === id) upd(e); });
  const end = () => { id = null; joy.x = joy.y = 0; knob.style.transform = ''; };
  jb.addEventListener('pointerup', end); jb.addEventListener('pointercancel', end);
  const tj = $('#tJump'); tj.addEventListener('pointerdown', e => { e.preventDefault(); touchJump = true; setJump(true); }); tj.addEventListener('pointerup', () => touchJump = false); tj.addEventListener('pointercancel', () => touchJump = false);
  $('#tDash').addEventListener('pointerdown', e => { e.preventDefault(); setDash(true); });
}
