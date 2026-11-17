import * as T from 'three';
import { entSize } from './entities.js';
import { HALF, camera, getEnt } from './scene.js';
import { clamp } from './util.js';
import { world } from './world.js';

/* ---------------- Camera ---------------- */
export const bcam = {target:new T.Vector3(0, 3, 0), yaw:.6, pitch:.62, dist:38};
export const pcam = {yaw:0, pitch:.38, dist:9, target:new T.Vector3()};
export function placeCam(c){
  const cp = Math.cos(c.pitch);
  camera.position.set(c.target.x + Math.sin(c.yaw)*cp*c.dist, c.target.y + Math.sin(c.pitch)*c.dist, c.target.z + Math.cos(c.yaw)*cp*c.dist);
  camera.lookAt(c.target);
}
export let camAnim = null;
export function setCamAnim(v){ camAnim = v; }
export function frameCourse(){
  if (!world.entities.length) return;
  const box = new T.Box3(); world.entities.forEach(e => box.expandByPoint(new T.Vector3(e.x, e.y, e.z)));
  box.expandByPoint(new T.Vector3(-HALF, 0, -HALF)); box.expandByPoint(new T.Vector3(HALF, 0, HALF));
  const c = box.getCenter(new T.Vector3()), s = box.getSize(new T.Vector3());
  camAnim = {target:c, dist:clamp(Math.max(s.x, s.z, s.y*1.4) * 1.25 / Math.min(1, (camera.aspect || 1) * 1.25), 12, 90)};
}
export function focusEnt(id){ const e = getEnt(id); if (!e) return; const s = entSize(e); camAnim = {target:new T.Vector3(e.x, e.y + s[1]/2, e.z), dist:clamp(Math.max(...s) * 4 + 6, 7, 30)}; }
