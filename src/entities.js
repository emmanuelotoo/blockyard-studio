import * as T from 'three';
import { buildCharacter } from './characters.js';
import { B, M, blockMat, boxGeo, colMat, glowMat, stdMat } from './materials.js';
import { TEXDEF } from './textures.js';
import { PI, mulberry } from './util.js';
import { world } from './world.js';

/* ---------------- Entity kinds ---------------- */
export const DEF = {
  block:{w:2, h:1, d:2, tex:'cobble'}, mover:{w:2, h:.6, d:2, tex:'cobble', axis:'x', dist:3, speed:1}, crumble:{w:2, h:.8, d:2, tex:'sand'},
  crystal:{s:1, color:'#8b5cf6'}, car:{s:1, color:'#e53935'},
};
export const KIND = {
  block:{name:'Block'}, mover:{name:'Mover'}, crumble:{name:'Crumble'}, jumppad:{name:'Jump pad'}, spikes:{name:'Spikes'},
  checkpoint:{name:'Checkpoint'}, goal:{name:'Goal flag'}, coin:{name:'Coin'}, spawn:{name:'Player start'},
  oak:{name:'Oak'}, pine:{name:'Pine'}, deadtree:{name:'Dead tree'}, bush:{name:'Bush'}, rock:{name:'Rock'}, crystal:{name:'Crystal'},
  flowers:{name:'Wildflowers'}, chest:{name:'Chest'}, crate:{name:'Crate'}, car:{name:'Car'}, cloud:{name:'Cloud'}, lamp:{name:'Lantern post'},
};
export const SIZED = new Set(['block', 'mover', 'crumble']);
export const CATALOG = [
  {id:'stone', name:'Stone platform', kind:'block', tex:'cobble', w:2, h:1, d:2, cat:'Level bricks', desc:'A cobbled 2 by 2 step'},
  {id:'clayblock', name:'Clay block', kind:'block', tex:'clay', w:2, h:1, d:2, cat:'Level bricks', desc:'Bright orange landing block'},
  {id:'iceslab', name:'Ice slab', kind:'block', tex:'ice', w:3, h:.4, d:1.2, cat:'Level bricks', desc:'A thin, glassy ledge'},
  {id:'deck', name:'Wide deck', kind:'block', tex:'wood', w:4, h:.6, d:4, cat:'Level bricks', desc:'A roomy wooden deck'},
  {id:'brickwall', name:'Brick wall', kind:'block', tex:'brick', w:4, h:2, d:1, cat:'Level bricks', desc:'Something to jump over'},
  {id:'pillar', name:'Pillar', kind:'block', tex:'concrete', w:1, h:4, d:1, cat:'Level bricks', desc:'Tall and narrow'},
  {id:'mover', name:'Mover', kind:'mover', cat:'Level logic', desc:'Slides back and forth along one axis'},
  {id:'crumble', name:'Crumble', kind:'crumble', cat:'Level logic', desc:'Gives way a moment after you land'},
  {id:'jumppad', name:'Jump pad', kind:'jumppad', cat:'Level logic', desc:'Launches you about 7 m up'},
  {id:'checkpoint', name:'Checkpoint', kind:'checkpoint', cat:'Level logic', desc:'Saves your progress when touched'},
  {id:'goal', name:'Goal flag', kind:'goal', cat:'Level logic', desc:'Touch it to finish the course'},
  {id:'spawn', name:'Player start', kind:'spawn', cat:'Level logic', desc:'Where the player appears. There is only one.'},
  {id:'coin', name:'Coin', kind:'coin', cat:'Hazards and collectibles', desc:'Spins, bobs, adds to your count'},
  {id:'spikes', name:'Spikes', kind:'spikes', cat:'Hazards and collectibles', desc:'Sends you back to the last checkpoint'},
  {id:'oak', name:'Oak', kind:'oak', cat:'Nature', desc:'Round, lumpy, leafy canopy'},
  {id:'pine', name:'Pine', kind:'pine', cat:'Nature', desc:'Three tiers of dark needles'},
  {id:'deadtree', name:'Dead tree', kind:'deadtree', cat:'Nature', desc:'Bare and twisted'},
  {id:'bush', name:'Bush', kind:'bush', cat:'Nature', desc:'A low cluster of leaves'},
  {id:'rock', name:'Rock', kind:'rock', cat:'Nature', desc:'A chunky grey boulder'},
  {id:'crystal', name:'Crystal', kind:'crystal', cat:'Nature', desc:'Cluster of violet crystals'},
  {id:'flowers', name:'Wildflowers', kind:'flowers', cat:'Nature', desc:'A scatter of bright blooms'},
  {id:'chest', name:'Treasure chest', kind:'chest', cat:'Props', desc:'Brass-banded and locked'},
  {id:'crate', name:'Crate', kind:'crate', cat:'Props', desc:'A wooden box, good for stacking'},
  {id:'car', name:'Car', kind:'car', cat:'Props', desc:'A little red runabout'},
  {id:'cloud', name:'Cloud', kind:'cloud', cat:'Props', desc:'Soft, and solid enough to stand on'},
  {id:'lamp', name:'Lantern post', kind:'lamp', cat:'Props', desc:'Glows warmly at night'},
];
export const CAT_BY_ID = Object.fromEntries(CATALOG.map(c => [c.id, c]));

export const BUILD = {
  block(e){ const g = new T.Group(); g.add(M(boxGeo(e.w, e.h, e.d), blockMat(e.tex, e.color), 0, e.h/2, 0)); return g; },
  mover(e){ const g = BUILD.block(e);
    const ax = e.axis === 'z'; const strip = M(B(ax ? .14 : e.w*.6, .03, ax ? e.d*.6 : .14), colMat('#ffcf5a'), 0, e.h + .015, 0); strip.receiveShadow = true; strip.castShadow = false; g.add(strip); return g; },
  crumble(e){ const g = BUILD.block(e); for (let i = -1; i <= 1; i++){ const c = M(B(.04, .02, e.d*.7), colMat('#7a6542'), i*e.w*.25, e.h + .01, 0); c.rotation.y = i*.5; g.add(c); } return g; },
  jumppad(){ const g = new T.Group();
    g.add(M(new T.CylinderGeometry(.72, .78, .22, 22), colMat('#3b3f46', {metalness:.3}), 0, .11, 0));
    const top = M(new T.CylinderGeometry(.56, .56, .1, 22), glowMat('#ffb020', .35), 0, .25, 0); g.add(top); g.userData.top = top;
    for (let i = 0; i < 3; i++){ const a = M(B(.36, .02, .06), colMat('#1f2125'), 0, .305, -.18 + i*.18); g.add(a); }
    return g; },
  spikes(){ const g = new T.Group(); g.add(M(B(2, .16, 2), colMat('#4a4e55'), 0, .08, 0));
    const sm = colMat('#cfd4dc', {metalness:.65, roughness:.3}); const cg = new T.ConeGeometry(.2, .55, 6);
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) g.add(M(cg, sm, i*.6, .16 + .275, j*.6)); return g; },
  checkpoint(){ const g = new T.Group();
    g.add(M(boxGeo(1.6, .3, 1.6), blockMat('clay'), 0, .15, 0));
    g.add(M(boxGeo(.5, 1.25, .5), blockMat('clay'), 0, .3 + .625, 0));
    const cap = M(B(.62, .2, .62), glowMat('#ffe2a8', .05), 0, 1.65, 0); g.add(cap); g.userData.cap = cap; return g; },
  goal(){ const g = new T.Group(); g.add(M(boxGeo(2, .3, 2, 1), blockMat('checker'), 0, .15, 0));
    g.add(M(new T.CylinderGeometry(.06, .06, 3.2, 8), colMat('#e9e9e9', {metalness:.4}), -.6, 1.9, 0));
    const fg = new T.Group(); fg.position.set(-.6, 3.1, 0); const flag = M(B(.95, .6, .04), glowMat('#ff5a2e', .25), .48, 0, 0); fg.add(flag); g.add(fg); g.userData.flag = fg;
    g.add(M(new T.SphereGeometry(.1, 10, 8), colMat('#ffd166', {metalness:.6, roughness:.3}), -.6, 3.55, 0)); return g; },
  coin(){ const g = new T.Group(); const c = M(new T.CylinderGeometry(.32, .32, .08, 26), stdMat({color:'#ffc93d', metalness:.75, roughness:.28, emissive:'#ffaa00', emissiveIntensity:.25}), 0, .55, 0);
    c.material.userData.glow = .25; c.rotation.x = PI/2; c.add(M(new T.CylinderGeometry(.2, .2, .1, 20), colMat('#f2a81d', {metalness:.8, roughness:.3}), 0, 0, 0)); g.add(c); g.userData.spin = c; return g; },
  spawn(e){ const g = new T.Group(); const ch = buildCharacter(world.character); g.add(ch); g.userData.char = ch;
    const ring = new T.Mesh(new T.RingGeometry(.55, .68, 32), new T.MeshBasicMaterial({color:'#ff6a3d', transparent:true, opacity:.8, side:T.DoubleSide}));
    ring.rotation.x = -PI/2; ring.position.y = .02; ring.userData.keepMat = true; g.add(ring); return g; },
  oak(){ const g = new T.Group(); g.add(M(boxGeo(.45, 1.6, .45, 1), blockMat('bark'), 0, .8, 0));
    const lm = colMat('#4f9a2c', {flatShading:true}); const lm2 = colMat('#5cab33', {flatShading:true});
    [[0,2.3,0,1.25,lm],[.75,2.0,.3,.9,lm2],[-.65,2.1,-.3,.88,lm],[.1,2.95,-.2,.82,lm2],[-.2,1.9,.6,.75,lm2]].forEach(([x,y,z,r,m]) => g.add(M(new T.IcosahedronGeometry(r, 0), m, x, y, z)));
    return g; },
  pine(){ const g = new T.Group(); g.add(M(boxGeo(.3, .9, .3, 1), blockMat('bark'), 0, .45, 0));
    const lm = colMat('#2d6a2b', {flatShading:true}); [[1.15,1.5,1.35],[.88,1.25,2.05],[.6,1.05,2.65]].forEach(([r,h,y]) => g.add(M(new T.ConeGeometry(r, h, 7), lm, 0, y, 0))); return g; },
  deadtree(){ const g = new T.Group(); const m = colMat('#7a6a5a', {flatShading:true});
    g.add(M(new T.CylinderGeometry(.12, .2, 2.2, 6), m, 0, 1.1, 0));
    [[.35,1.5,.6],[-.3,1.85,-.7],[.15,2.2,.4]].forEach(([x,y,r]) => { const b = M(new T.CylinderGeometry(.04, .08, .9, 5), m, x, y, 0); b.rotation.z = -r; b.rotation.y = x*4; g.add(b); }); return g; },
  bush(){ const g = new T.Group(); const m = colMat('#4f9a2f', {flatShading:true});
    [[0,.42,0,.58],[.45,.32,.2,.42],[-.42,.32,-.1,.45],[.05,.3,-.4,.38]].forEach(([x,y,z,r]) => g.add(M(new T.IcosahedronGeometry(r, 0), m, x, y, z))); return g; },
  rock(){ const g = new T.Group(); const m = colMat('#9a968f', {flatShading:true});
    const a = M(new T.DodecahedronGeometry(.55, 0), m, 0, .3, 0); a.scale.set(1.1, .65, .9); g.add(a);
    const b = M(new T.DodecahedronGeometry(.26, 0), m, .55, .12, .3); b.scale.set(1, .7, 1); g.add(b); return g; },
  crystal(e){ const g = new T.Group(); const m = glowMat(e.color || '#8b5cf6', .35, {roughness:.2, metalness:.1, transparent:true, opacity:.9, flatShading:true});
    [[0,0,0,1.2],[.25,-.25,.1,.85],[-.25,.3,-.05,.9],[.12,.4,.25,.7],[-.2,-.35,.2,.65]].forEach(([tz,tx,ox,h]) => { const c = M(new T.OctahedronGeometry(.28, 0), m, ox, h*.5, tx*.4); c.scale.set(.75, h*1.8, .75); c.rotation.z = tz; c.rotation.x = tx; g.add(c); });
    return g; },
  flowers(){ const g = new T.Group(); const r = mulberry(5); const stem = colMat('#3d7f2a'); const cols = ['#ff6b8b','#ffd23f','#ffffff','#9b7bff','#ff8a3d'];
    for (let i = 0; i < 7; i++){ const x = (r()-.5)*1.1, z = (r()-.5)*1.1, h = .25 + r()*.2; g.add(M(B(.035, h, .035), stem, x, h/2, z)); g.add(M(new T.IcosahedronGeometry(.08, 0), colMat(cols[i % 5], {flatShading:true}), x, h + .04, z)); }
    return g; },
  chest(){ const g = new T.Group(); g.add(M(boxGeo(.9, .5, .6, 1), blockMat('wood'), 0, .25, 0)); g.add(M(boxGeo(.92, .22, .62, 1), blockMat('wood', '#c49a72'), 0, .61, 0));
    const gold = colMat('#d6a63c', {metalness:.7, roughness:.3}); g.add(M(B(.94, .06, .64), gold, 0, .5, 0)); g.add(M(B(.14, .16, .04), gold, 0, .5, .32)); return g; },
  crate(){ const g = new T.Group(); g.add(M(boxGeo(1, 1, 1, 1), blockMat('wood'), 0, .5, 0)); const dk = colMat('#6b4626');
    for (const z of [.505, -.505]){ g.add(M(B(1, .1, .02), dk, 0, .95, z)); g.add(M(B(1, .1, .02), dk, 0, .05, z)); const x = M(B(1.25, .1, .02), dk, 0, .5, z); x.rotation.z = PI/4; g.add(x); } return g; },
  car(e){ const g = new T.Group(); const body = colMat(e.color || '#e53935', {metalness:.35, roughness:.45});
    g.add(M(B(2, .55, 1.05), body, 0, .52, 0)); g.add(M(B(1.05, .45, .96), body, -.12, 1.0, 0)); g.add(M(B(1.07, .32, .98), colMat('#26313d', {metalness:.4, roughness:.15}), -.12, 1.02, 0));
    const wm = colMat('#1e1f22'); const wg = new T.CylinderGeometry(.25, .25, .2, 16);
    for (const [x, z] of [[.62,.5],[-.62,.5],[.62,-.5],[-.62,-.5]]){ const w = M(wg, wm, x, .25, z); w.rotation.x = PI/2; g.add(w); }
    for (const z of [.33, -.33]) g.add(M(B(.04, .12, .2), glowMat('#fff2b0', .6), 1.0, .6, z)); return g; },
  cloud(){ const g = new T.Group(); const m = colMat('#ffffff', {roughness:1});
    [[0,.5,0,.72],[.7,.42,.12,.56],[-.7,.4,-.1,.52],[.2,.78,-.15,.52],[-.25,.36,.35,.45]].forEach(([x,y,z,r]) => { const s = M(new T.SphereGeometry(r, 12, 9), m, x, y, z); s.castShadow = true; g.add(s); }); return g; },
  lamp(){ const g = new T.Group(); const d = colMat('#2f3237', {metalness:.4});
    g.add(M(new T.CylinderGeometry(.06, .08, 2.4, 8), d, 0, 1.2, 0)); g.add(M(B(.34, .4, .34), glowMat('#ffcf7a', .6), 0, 2.6, 0)); g.add(M(B(.44, .08, .44), d, 0, 2.84, 0)); g.add(M(B(.3, .06, .3), d, 0, 2.38, 0)); return g; },
};
export const SOLID = {
  block:e => [e.w, e.h, e.d], mover:e => [e.w, e.h, e.d], crumble:e => [e.w, e.h, e.d],
  jumppad:() => [1.5, .3, 1.5], checkpoint:() => [1.6, .3, 1.6], goal:() => [2, .3, 2], spikes:() => [2, .16, 2],
  chest:() => [.9, .72, .6], crate:() => [1, 1, 1], car:() => [2, 1.2, 1.05], rock:() => [1.1, .62, 1],
  oak:() => [.5, 2, .5], pine:() => [.4, 1.6, .4], deadtree:() => [.35, 2.2, .35], cloud:() => [2.3, .95, 1.4], lamp:() => [.2, 2.4, .2],
};
export const PICK_SIZE = {coin:[.8,1,.8], spawn:[.7,1.8,.7], crystal:[.9,1.2,.9], flowers:[1.2,.4,1.2], bush:[1.4,.9,1.2]};
export function entSize(e){
  const f = SOLID[e.kind]; let s = f ? f(e) : (PICK_SIZE[e.kind] || [1,1,1]);
  if (!SIZED.has(e.kind)){ const k = e.s || 1; s = s.map(v => v*k); }
  if (Math.round(((e.ry || 0) % 180 + 180) % 180) === 90) s = [s[2], s[1], s[0]];
  return s;
}
export function entName(e){
  if (e.kind === 'block') return (TEXDEF[e.tex] ? TEXDEF[e.tex].name : 'Painted') + ' block';
  return (KIND[e.kind] || {name:e.kind}).name;
}
