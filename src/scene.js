import * as T from 'three';
import { BUILD, SIZED } from './entities.js';
import { LOOKS } from './looks.js';
import { blockMat, boxGeo, stdMat } from './materials.js';
import { getTex } from './textures.js';
import { $, PI, mulberry } from './util.js';
import { world } from './world.js';

/* ---------------- Scene ---------------- */
export const stage = $('#stage'), canvas = $('#view');
export const renderer = new T.WebGLRenderer({canvas, antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true; renderer.shadowMap.type = T.PCFShadowMap;
renderer.toneMapping = T.ACESFilmicToneMapping; renderer.outputColorSpace = T.SRGBColorSpace;
export const scene = new T.Scene();
export const camera = new T.PerspectiveCamera(50, 1, .1, 500);
export const hemi = new T.HemisphereLight(0xffffff, 0x6f8f55, 1); scene.add(hemi);
export const sun = new T.DirectionalLight(0xffffff, 2.4); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, {left:-30, right:30, top:30, bottom:-30, near:1, far:140});
sun.shadow.bias = -.0004; sun.shadow.normalBias = .03; scene.add(sun, sun.target);
export const amb = new T.AmbientLight(0xffffff, .12); scene.add(amb);
export const lightPool = []; for (let i = 0; i < 6; i++){ const l = new T.PointLight(0xffc070, 0, 10, 1.4); scene.add(l); lightPool.push(l); }
export const playerLight = new T.PointLight(0xffd9a0, 0, 9, 1.4); scene.add(playerLight);

export const HALF = 18, ISL = 36;
export const island = new T.Group(); scene.add(island);
export const sideMat = stdMat({color:'#5a9c33', map:getTex('grass')});
export const slab = new T.Mesh(boxGeo(ISL, .8, ISL, 3), [sideMat, sideMat, blockMat('grass'), sideMat, sideMat, sideMat]);
slab.position.y = -.4; slab.receiveShadow = true; island.add(slab);
export const dirt = new T.Mesh(boxGeo(ISL - .4, 1.8, ISL - .4, 3), blockMat('dirt')); dirt.position.y = -1.7; island.add(dirt);
{ // grass tufts
  const geo = new T.ConeGeometry(.05, .42, 3); geo.translate(0, .21, 0);
  const N = 2800, im = new T.InstancedMesh(geo, stdMat({color:'#2f6d1e'}), N); im.receiveShadow = true;
  const r = mulberry(11), m4 = new T.Matrix4(), q = new T.Quaternion(), eu = new T.Euler(), v = new T.Vector3(), s = new T.Vector3();
  let i = 0; while (i < N){ const cx = (r()*2-1)*(HALF-.6), cz = (r()*2-1)*(HALF-.6);
    for (let k = 0; k < 4 && i < N; k++, i++){ v.set(cx + (r()-.5)*.25, 0, cz + (r()-.5)*.25); eu.set((r()-.5)*.5, r()*PI, (r()-.5)*.5); q.setFromEuler(eu); const h = .6 + r()*.8; s.set(1, h, 1); m4.compose(v, q, s); im.setMatrixAt(i, m4); } }
  island.add(im);
}
export const grid = new T.GridHelper(ISL, ISL, 0x000000, 0x000000); grid.material.transparent = true; grid.material.opacity = .07; grid.position.y = .012; scene.add(grid);
export const entRoot = new T.Group(); scene.add(entRoot);
export const selBox = new T.Box3Helper(new T.Box3(), 0xff6a3d); selBox.visible = false; scene.add(selBox);

/* ---------------- Material modes (look) ---------------- */
export const toonGrad = (() => { const t = new T.DataTexture(new Uint8Array([70, 160, 255]), 3, 1, T.RedFormat); t.minFilter = t.magFilter = T.NearestFilter; t.needsUpdate = true; return t; })();
export const greyMat = new T.MeshStandardMaterial({color:'#d2d0cc', roughness:.95});
export const toonCache = new WeakMap();
export function toonOf(m){
  if (!toonCache.has(m)){ const t = new T.MeshToonMaterial({color:m.color, map:m.map, gradientMap:toonGrad, emissive:m.emissive || new T.Color(0), emissiveIntensity:m.emissiveIntensity, transparent:m.transparent, opacity:m.opacity, side:m.side}); t.userData = m.userData; toonCache.set(m, t); }
  return toonCache.get(m);
}
export let matMode = 'std';
export function swapMats(root){
  root.traverse(o => {
    if (!o.isMesh || o.userData.keepMat) return;
    if (!o.userData.base) o.userData.base = o.material;
    const b = o.userData.base, f = matMode === 'grey' ? () => greyMat : matMode === 'toon' ? toonOf : m => m;
    o.material = Array.isArray(b) ? b.map(f) : f(b);
  });
}
export let lookGlow = 1;
export function setGlow(root){ root.traverse(o => { if (!o.isMesh) return; const ms = Array.isArray(o.material) ? o.material : [o.material]; for (const m of ms) if (m.userData && m.userData.glow !== undefined) m.emissiveIntensity = m.userData.glow * lookGlow * (m.userData.boost || 1); }); }
export function applyLook(name){
  const L = LOOKS[name] || LOOKS.soft;
  scene.background = new T.Color(L.bg); scene.fog = new T.Fog(L.bg, L.fog[0], L.fog[1]); stage.style.background = L.bg;
  hemi.color.set(L.hs); hemi.groundColor.set(L.hg); hemi.intensity = L.hi;
  sun.color.set(L.sun); sun.intensity = L.si; sun.position.set(...L.sp); sun.target.position.set(0, 0, 0);
  renderer.toneMappingExposure = L.exp; canvas.style.filter = L.filter; $('#vignette').style.opacity = L.vig;
  amb.intensity = name === 'night' ? .05 : .12;
  matMode = L.mode; lookGlow = L.glow;
  swapMats(scene); setGlow(scene);
  nightLights = !!L.lights; if (!nightLights){ lightPool.forEach(l => l.intensity = 0); playerLight.intensity = 0; }
  grid.material.color.set(name === 'night' ? 0xffffff : 0x000000);
}
export let nightLights = false;

/* ---------------- Entities ---------------- */
export const ents = new Map();
export function disposeObj(o){ o.traverse(c => { if (c.geometry && !c.isInstancedMesh) c.geometry.dispose(); }); }
export function buildObj(e){
  const g = (BUILD[e.kind] || BUILD.block)(e);
  g.userData.eid = e.id; g.position.set(e.x, e.y, e.z); g.rotation.y = (e.ry || 0) * PI / 180;
  if (!SIZED.has(e.kind) && e.kind !== 'spawn') g.scale.setScalar(e.s || 1);
  swapMats(g); setGlow(g); return g;
}
export function addEnt(e){ const obj = buildObj(e); entRoot.add(obj); ents.set(e.id, {e, obj, st:{}}); }
export function removeEnt(id){ const r = ents.get(id); if (!r) return; entRoot.remove(r.obj); disposeObj(r.obj); ents.delete(id); }
export function refreshEnt(id){ const r = ents.get(id); if (!r) return; entRoot.remove(r.obj); disposeObj(r.obj); r.obj = buildObj(r.e); entRoot.add(r.obj); }
export function rebuildAll(){ for (const id of [...ents.keys()]) removeEnt(id); world.entities.forEach(addEnt); }
export function getEnt(id){ return world.entities.find(e => e.id === id); }
