import * as T from 'three';
import { buildCharacter } from './characters.js';
import { BUILD, CAT_BY_ID } from './entities.js';
import { disposeObj } from './scene.js';
import { mkEnt, world } from './world.js';

/* ---------------- Thumbnails ---------------- */
export const thumbR = new T.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:true});
thumbR.setPixelRatio(1); thumbR.setSize(200, 150, false); thumbR.outputColorSpace = T.SRGBColorSpace; thumbR.toneMapping = T.ACESFilmicToneMapping;
export const thumbScene = new T.Scene(); thumbScene.add(new T.HemisphereLight(0xffffff, 0x8a8f80, 1.5));
export const tsun = new T.DirectionalLight(0xffffff, 2.2); tsun.position.set(4, 8, 6); thumbScene.add(tsun);
export const thumbCam = new T.PerspectiveCamera(28, 4/3, .05, 200);
export const thumbs = {};
export function shoot(obj, dir, zoom = 1){
  thumbScene.add(obj);
  const box = new T.Box3().setFromObject(obj), sph = box.getBoundingSphere(new T.Sphere());
  const dist = sph.radius / Math.sin(T.MathUtils.degToRad(13)) * 1.02 * zoom;
  thumbCam.position.copy(sph.center).addScaledVector(dir.clone().normalize(), dist); thumbCam.lookAt(sph.center);
  thumbR.render(thumbScene, thumbCam); const url = thumbR.domElement.toDataURL();
  thumbScene.remove(obj); disposeObj(obj); return url;
}
export function assetThumb(id){
  if (thumbs['a:' + id]) return thumbs['a:' + id];
  const c = CAT_BY_ID[id]; const e = mkEnt(c.kind, c.w ? {w:c.w, h:c.h, d:c.d, tex:c.tex} : {});
  const obj = c.kind === 'spawn' ? buildCharacter(world.character) : (BUILD[c.kind])(e);
  return thumbs['a:' + id] = shoot(obj, new T.Vector3(1, .8, 1.3));
}
export function charThumb(preset){
  const k = 'c:' + preset; if (thumbs[k]) return thumbs[k];
  const o = buildCharacter({preset, height:1.8, prop:'heroic', colors:{}});
  return thumbs[k] = shoot(o, new T.Vector3(.45, .25, 1), .78);
}
