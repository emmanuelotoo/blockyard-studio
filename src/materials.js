import * as T from 'three';
import { TEXDEF, getTex } from './textures.js';

/* ---------------- Materials ---------------- */
export const matCache = new Map();
export const stdMat = o => new T.MeshStandardMaterial(Object.assign({roughness:.88, metalness:0}, o));
export function blockMat(tex, color){
  const k = tex + '|' + (color || '');
  if (!matCache.has(k)){
    let m;
    if (tex === 'paint' || !TEXDEF[tex]) m = stdMat({color: color || '#e8572d'});
    else m = stdMat({map: getTex(tex), color: color || '#ffffff'});
    if (tex === 'ice'){ m.roughness = .3; }
    if (tex === 'metal'){ m.metalness = .55; m.roughness = .45; }
    matCache.set(k, m);
  }
  return matCache.get(k);
}
export function colMat(c, o = {}){
  const k = 'c|' + c + '|' + JSON.stringify(o);
  if (!matCache.has(k)) matCache.set(k, stdMat(Object.assign({color:c}, o)));
  return matCache.get(k);
}
export function glowMat(c, base, o = {}){
  const m = stdMat(Object.assign({color:c, emissive:c, emissiveIntensity:base}, o));
  m.userData.glow = base; return m;
}
export function boxGeo(w, h, d, u = 2){
  const g = new T.BoxGeometry(w, h, d); const uv = g.attributes.uv;
  const dims = [[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for (let f = 0; f < 6; f++) for (let i = 0; i < 4; i++){ const k = f*4 + i; uv.setXY(k, uv.getX(k)*dims[f][0]/u, uv.getY(k)*dims[f][1]/u); }
  return g;
}
export function M(geo, mat, x = 0, y = 0, z = 0){ const m = new T.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = true; m.receiveShadow = true; return m; }
export const B = (w, h, d) => new T.BoxGeometry(w, h, d);
