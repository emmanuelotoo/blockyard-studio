import { BUILD, DEF, SIZED } from './entities.js';
import { LOOKS } from './looks.js';

/* ---------------- World data ---------------- */
export const KEY = 'blockyard.world.v1';
export function mkEnt(kind, o = {}){
  const e = Object.assign({id:0, kind, x:0, y:0, z:0, ry:0}, DEF[kind] ? JSON.parse(JSON.stringify(DEF[kind])) : {}, SIZED.has(kind) ? {} : {s:1}, o);
  return e;
}
export function defaultWorld(){
  const E = []; let id = 1;
  const add = (kind, x, y, z, o = {}) => E.push(Object.assign(mkEnt(kind, o), {id:id++, x, y, z}));
  add('spawn', 0, 0, 13, {ry:180});
  add('block', 0, 0, 8.5); add('coin', 0, 1, 8.5);
  add('spikes', 3, 0, 10);
  add('block', 3.5, 1.2, 5.5, {tex:'clay'}); add('coin', 3.5, 2.2, 5.5);
  add('block', .5, 2.6, 1.5, {w:3, d:3}); add('checkpoint', 1.2, 3.6, 1.0);
  add('mover', -4, 3.6, -1.5, {axis:'z', dist:2.2, speed:1.1}); add('coin', -4, 4.3, -1.5);
  add('crumble', -7.5, 4.6, -5); add('coin', -7.5, 5.5, -5);
  add('block', -4.5, 4.6, -8.5, {tex:'clay'}); add('jumppad', -4.5, 5.6, -8.5);
  add('block', .5, 11, -10, {tex:'clay', w:4, d:3}); add('checkpoint', 1.6, 12, -10.4); add('coin', -.6, 12, -9.6);
  add('block', 4.6, 11.5, -7, {tex:'ice', w:3, h:.4, d:1.2, ry:90}); add('coin', 4.6, 11.9, -7);
  add('block', 5, 12.4, -2.8, {tex:'cream', w:2.5, d:2.5});
  add('block', 1.6, 13.6, 1.2, {tex:'brick'}); add('coin', 1.6, 14.6, 1.2);
  add('block', -2.6, 14.4, 3.4, {tex:'clay', w:3, d:3}); add('goal', -2.6, 15.4, 3.4);
  add('coin', -6, 0, 8); add('coin', 7, 0, 3); add('coin', 9, 0, -11);
  add('oak', -11, 0, 9, {s:1.3}); add('oak', 12.5, 0, 12); add('oak', -14, 0, -6, {s:1.1}); add('oak', 6, 0, -15, {s:1.2});
  add('pine', 10, 0, -7, {s:1.2}); add('pine', 13.5, 0, -2); add('pine', -9, 0, 14); add('pine', -15, 0, 3.5, {s:1.3}); add('pine', 15, 0, 8);
  add('deadtree', 14, 0, -14); add('bush', -6, 0, 11); add('bush', 8, 0, 9); add('bush', -12, 0, -12); add('bush', 2, 0, -14);
  add('rock', 6, 0, 11); add('rock', -3, 0, -15, {s:1.4}); add('rock', 12, 0, 4); add('rock', -10, 0, 4, {s:.8});
  add('crystal', -11, 0, -1); add('crystal', -9.6, 0, -.2, {s:.7}); add('crystal', 9, 0, -13, {s:.9, color:'#38bdf8'});
  add('flowers', -4, 0, 15); add('flowers', 5, 0, 15); add('flowers', -13, 0, 1); add('flowers', 11, 0, -4);
  add('chest', -14.5, 0, -14.5, {ry:90}); add('crate', 11, 0, 9.5); add('crate', 11, 1, 9.5); add('crate', 12.1, 0, 9.6);
  add('lamp', 2.2, 0, 14); add('lamp', -2.2, 0, 14); add('car', -13, 0, 13, {ry:90});
  add('cloud', 11, 10, -14); add('cloud', -13, 13, 7, {s:1.3});
  return {v:1, title:'Clay Peaks', desc:'A 3D platformer course.', look:'soft', tune:{jump:3.2, apex:.38, run:7},
    character:{preset:'knight', height:1.8, prop:'heroic', colors:{}}, entities:E, nextId:id};
}
export function normalize(w){
  const d = defaultWorld();
  w.title = String(w.title || d.title).slice(0, 60); w.desc = String(w.desc || '').slice(0, 400);
  w.look = LOOKS[w.look] ? w.look : 'soft';
  w.tune = Object.assign({}, d.tune, w.tune || {});
  w.character = Object.assign({}, d.character, w.character || {}); w.character.colors = w.character.colors || {};
  w.entities = (w.entities || []).filter(e => e && (BUILD[e.kind]));
  let max = 0; for (const e of w.entities){ max = Math.max(max, e.id | 0); }
  w.entities.forEach(e => { if (!e.id) e.id = ++max; });
  if (!w.entities.some(e => e.kind === 'spawn')) w.entities.push(Object.assign(mkEnt('spawn', {ry:180}), {id:++max, x:0, z:13}));
  w.nextId = Math.max(w.nextId | 0, max + 1);
  return w;
}
export function loadWorld(){ try { const s = localStorage.getItem(KEY); if (s){ const w = JSON.parse(s); if (w && Array.isArray(w.entities)) return normalize(w); } } catch (e) {} return null; }
export let world = null;
export function setWorld(w){ world = w; }
