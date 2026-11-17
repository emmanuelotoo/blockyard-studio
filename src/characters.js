import * as T from 'three';
import { B, M, colMat, glowMat } from './materials.js';
import { PI } from './util.js';

/* ---------------- Characters ---------------- */
export const PRESETS = {
  knight:{name:'Knight', desc:'Armoured hero with a sword and red cape', skin:'#e9b38a', shirt:'#b9bdc5', pants:'#7e838c', shoes:'#3d4046', head:'helmet', headC:'#c6cad1', plume:'#d63a2f', hand:'sword', back:'cape', backC:'#c62f2f'},
  ranger:{name:'Ranger', desc:'Green hood, longbow, quiet boots', skin:'#d9a27a', shirt:'#3e6b34', pants:'#5c4a31', shoes:'#3b2c1d', head:'hood', headC:'#2f5a28', hand:'bow', back:'quiver', backC:'#6b4a2c'},
  mage:{name:'Mage', desc:'Midnight robe, crooked hat, glowing staff', skin:'#efc3a0', shirt:'#3f3a8f', pants:'#3f3a8f', shoes:'#2a2550', head:'wizard', headC:'#2e2a70', hand:'staff', body:'robe', bodyC:'#3a3586'},
  robot:{name:'Robot', desc:'Tin plates, cyan visor, antenna', skin:'#9eabb9', shirt:'#7d8da1', pants:'#5f6c7d', shoes:'#3f4855', head:'antenna', headC:'#ff5a3d', face:'visor', faceC:'#33d4ff'},
  chef:{name:'Chef', desc:'Whites, apron and a tall toque', skin:'#f0c29c', shirt:'#f4f4f2', pants:'#2f2f33', shoes:'#1f1f22', head:'toque', headC:'#ffffff', hand:'spatula', body:'apron', bodyC:'#e2dccd'},
  astronaut:{name:'Astronaut', desc:'Pressure suit and a glass dome', skin:'#f1c7a5', shirt:'#eef0f3', pants:'#dfe2e7', shoes:'#9aa3ad', head:'dome', headC:'#bfe6ff', back:'pack', backC:'#cfd4da', hair:'#5a3b22'},
  pirate:{name:'Pirate', desc:'Tricorn hat, patch and a cutlass', skin:'#d39a74', shirt:'#f0e6d2', pants:'#2c2c38', shoes:'#3a2416', head:'tricorn', headC:'#1f1f24', face:'patch', hand:'sword', body:'vest', bodyC:'#7a1f22'},
  fox:{name:'Fox', desc:'Quick, orange, very fluffy tail', skin:'#e8762d', shirt:'#f2efe8', pants:'#e8762d', shoes:'#3a2a20', head:'ears', headC:'#e8762d', back:'tail', backC:'#e8762d'},
  goblin:{name:'Goblin', desc:'Long ears, leather and a club', skin:'#79a83a', shirt:'#6b4a2c', pants:'#4b3a28', shoes:'#2e2318', head:'goblin', headC:'#79a83a', hand:'club'},
  ninja:{name:'Ninja', desc:'All black with a red sash', skin:'#e6b18c', shirt:'#1e1f24', pants:'#1e1f24', shoes:'#111216', head:'mask', headC:'#1e1f24', hand:'katana', body:'sash', bodyC:'#d0302b'},
  brawler:{name:'Brawler', desc:'Tank top and big red gloves', skin:'#c98b62', shirt:'#f2f2f2', pants:'#2f4f8f', shoes:'#f2f2f2', hair:'#1f1a16', hand:'gloves', handC:'#d63a2f'},
  slime:{name:'Slime', desc:'Jelly green and a little see-through', skin:'#6fd06a', shirt:'#6fd06a', pants:'#5ab856', shoes:'#4aa345', jelly:true},
};
export const PROPS = {
  chibi:{name:'Chibi', head:.72, leg:.5, torso:.55},
  heroic:{name:'Heroic', head:.5, leg:.8, torso:.7},
  realistic:{name:'Realistic', head:.4, leg:.95, torso:.75},
};
export function charMat(c, jelly){ return jelly ? colMat(c, {transparent:true, opacity:.78, roughness:.25}) : colMat(c, {roughness:.8}); }
export function buildCharacter(c){
  const p = Object.assign({}, PRESETS[c.preset] || PRESETS.knight, c.colors || {});
  const pr = PROPS[c.prop] || PROPS.heroic;
  const legH = pr.leg, torH = pr.torso, hs = pr.head, tw = .56, td = .32, aw = .2, ah = torH * .95;
  const k = (c.height || 1.8) / (legH + torH + hs);
  const root = new T.Group(), body = new T.Group(); body.scale.setScalar(k); root.add(body);
  const mat = col => charMat(col, p.jelly);
  const limb = (x, y) => { const pv = new T.Group(); pv.position.set(x, y, 0); body.add(pv); return pv; };
  const legL = limb(-.135, legH), legR = limb(.135, legH);
  for (const L of [legL, legR]){ L.add(M(B(.25, legH - .12, .28), mat(p.pants), 0, -(legH-.12)/2, 0)); L.add(M(B(.27, .14, .33), mat(p.shoes), 0, -legH + .07, .025)); }
  const torso = M(B(tw, torH, td), mat(p.shirt), 0, legH + torH/2, 0); body.add(torso);
  const sy = legH + torH - .04, sx = tw/2 + aw/2 + .01;
  const armL = limb(-sx, sy), armR = limb(sx, sy);
  for (const A of [armL, armR]){ A.add(M(B(aw, ah*.68, .22), mat(p.shirt), 0, -ah*.34, 0));
    const hand = p.hand === 'gloves' ? M(B(.3, .3, .3), mat(p.handC), 0, -ah*.82, 0) : M(B(aw*.95, ah*.32, .2), mat(p.skin), 0, -ah*.84, 0);
    A.add(hand); }
  const head = limb(0, legH + torH);
  head.add(M(B(hs, hs, hs), mat(p.skin), 0, hs/2, 0));
  const eye = colMat('#1d1b1a'), ey = hs*.56, ez = hs/2 + .006;
  const addEyes = () => { head.add(M(B(.07, .09, .015), eye, -hs*.2, ey, ez)); head.add(M(B(.07, .09, .015), eye, hs*.2, ey, ez)); };
  const hc = p.headC || p.skin;
  switch (p.head){
    case 'helmet':
      head.add(M(B(hs*1.1, hs*1.08, hs*1.1), colMat(hc, {metalness:.5, roughness:.4}), 0, hs*.54, 0));
      head.add(M(B(hs*.9, .07, .02), colMat('#1d1b1a'), 0, hs*.58, hs*.56));
      head.add(M(B(.07, .26, hs*.7), colMat(p.plume), 0, hs*1.18, -.02));
      break;
    case 'hood':
      addEyes();
      head.add(M(B(hs*1.12, hs*.32, hs*1.12), mat(hc), 0, hs*.92, -.01));
      head.add(M(B(hs*1.12, hs*1.0, .1), mat(hc), 0, hs*.55, -hs*.55));
      head.add(M(B(.07, hs*.9, hs*1.12), mat(hc), -hs*.56, hs*.5, -.01));
      head.add(M(B(.07, hs*.9, hs*1.12), mat(hc), hs*.56, hs*.5, -.01));
      break;
    case 'wizard': {
      addEyes();
      head.add(M(new T.CylinderGeometry(hs*.95, hs*.95, .05, 16), mat(hc), 0, hs + .02, 0));
      const cone = M(new T.ConeGeometry(hs*.5, .75, 10), mat(hc), 0, hs + .4, -.04); cone.rotation.x = -.18; head.add(cone);
      head.add(M(B(hs*.7, hs*.38, .08), colMat('#e9e7e2'), 0, hs*.15, hs*.5 + .04));
      break; }
    case 'toque':
      addEyes();
      head.add(M(new T.CylinderGeometry(hs*.42, hs*.38, .42, 14), mat('#ffffff'), 0, hs + .2, 0));
      head.add(M(new T.SphereGeometry(hs*.5, 14, 10), mat('#ffffff'), 0, hs + .44, 0));
      break;
    case 'tricorn':
      addEyes();
      head.add(M(B(hs*1.45, .06, hs*1.15), mat(hc), 0, hs + .03, 0));
      head.add(M(B(hs*.9, .2, hs*.8), mat(hc), 0, hs + .15, 0));
      head.add(M(B(hs*1.47, .02, .02), colMat('#d4a63a'), 0, hs + .065, hs*.58));
      break;
    case 'dome': {
      addEyes();
      if (p.hair) head.add(M(B(hs*1.04, .12, hs*1.04), mat(p.hair), 0, hs*.98, 0));
      const g = new T.Mesh(new T.SphereGeometry(hs*.88, 20, 14), colMat(hc, {transparent:true, opacity:.28, roughness:.05, metalness:.1})); g.position.y = hs*.55; head.add(g);
      head.add(M(new T.CylinderGeometry(hs*.8, hs*.8, .08, 18), colMat('#cfd4da'), 0, 0, 0));
      break; }
    case 'antenna':
      head.add(M(B(hs*.8, .14, .02), glowMat(p.faceC, .9), 0, hs*.56, hs/2 + .008));
      head.add(M(new T.CylinderGeometry(.02, .02, .3, 6), colMat('#5f6c7d'), 0, hs + .15, 0));
      head.add(M(new T.SphereGeometry(.06, 10, 8), glowMat(hc, .8), 0, hs + .32, 0));
      break;
    case 'ears':
      addEyes();
      for (const s of [-1, 1]){ const e = M(new T.ConeGeometry(.11, .24, 4), mat(hc), s*hs*.32, hs + .1, 0); e.rotation.y = PI/4; head.add(e); }
      head.add(M(B(hs*.5, hs*.26, .12), colMat('#f2efe8'), 0, hs*.24, hs*.5 + .04));
      head.add(M(B(.06, .05, .03), colMat('#1d1b1a'), 0, hs*.32, hs*.5 + .1));
      break;
    case 'goblin':
      addEyes();
      for (const s of [-1, 1]){ const e = M(B(.32, .09, .12), mat(hc), s*(hs*.5 + .13), hs*.62, 0); e.rotation.z = s*.35; head.add(e); }
      break;
    case 'mask':
      head.add(M(B(hs*1.03, hs*1.03, hs*1.03), mat(hc), 0, hs*.5, 0));
      head.add(M(B(hs*1.05, .12, hs*1.05), mat(p.skin), 0, hs*.58, 0));
      addEyes(); head.children[head.children.length-1].position.z = hs*.53; head.children[head.children.length-2].position.z = hs*.53;
      head.add(M(B(hs*1.06, .06, hs*1.06), colMat(p.bodyC || '#d0302b'), 0, hs*.82, 0));
      break;
    default:
      addEyes();
      if (p.hair){ head.add(M(B(hs*1.05, .14, hs*1.05), mat(p.hair), 0, hs*.98, 0)); head.add(M(B(hs*1.05, hs*.6, .08), mat(p.hair), 0, hs*.66, -hs*.5)); }
  }
  if (p.face === 'patch'){ head.add(M(B(.11, .11, .02), colMat('#111'), hs*.2, ey, ez + .008)); head.add(M(B(hs*1.04, .03, hs*1.04), colMat('#111'), 0, ey + .04, 0)); }
  if (p.face === 'visor' && p.head !== 'antenna') head.add(M(B(hs*.8, .14, .02), glowMat(p.faceC, .9), 0, hs*.56, hs/2 + .008));
  // body extras
  if (p.body === 'robe') body.add(M(B(tw*1.06, legH*.92, td*1.25), mat(p.bodyC), 0, legH*.54, 0));
  if (p.body === 'apron') body.add(M(B(tw*.82, torH*.62 + legH*.45, .03), mat(p.bodyC), 0, legH + torH*.25 - legH*.22, td/2 + .02));
  if (p.body === 'vest'){ for (const s of [-1, 1]) body.add(M(B(tw*.36, torH*.95, .03), mat(p.bodyC), s*tw*.32, legH + torH/2, td/2 + .02)); }
  if (p.body === 'sash') body.add(M(B(tw*1.04, .1, td*1.08), mat(p.bodyC), 0, legH + .06, 0));
  if (p.back === 'cape'){ const c = M(B(tw*.95, torH + legH*.55, .04), mat(p.backC), 0, legH + torH - (torH + legH*.55)/2, -td/2 - .04); body.add(c); }
  if (p.back === 'quiver'){ const q = M(new T.CylinderGeometry(.09, .09, .6, 8), mat(p.backC), .1, legH + torH*.6, -td/2 - .1); q.rotation.z = .5; body.add(q); }
  if (p.back === 'pack') body.add(M(B(.42, .5, .2), mat(p.backC), 0, legH + torH*.55, -td/2 - .1));
  if (p.back === 'tail'){ const t = M(B(.22, .22, .6), mat(p.backC), 0, legH*.95, -td/2 - .3); t.rotation.x = .5; body.add(t); t.add(M(B(.23, .23, .16), colMat('#f2efe8'), 0, 0, -.3)); }
  // held items
  const item = new T.Group(); item.position.set(0, -ah*.9, .05);
  if (p.hand === 'sword' || p.hand === 'katana'){ const kat = p.hand === 'katana'; item.rotation.x = PI/2;
    item.add(M(B(kat ? .05 : .08, kat ? .95 : .72, .025), colMat('#dfe3e8', {metalness:.8, roughness:.25}), 0, kat ? .58 : .48, 0));
    item.add(M(B(kat ? .12 : .28, .05, .07), colMat(kat ? '#222' : '#c9a23a', {metalness:.5}), 0, .1, 0));
    item.add(M(B(.05, .18, .05), colMat('#3a2416'), 0, 0, 0)); armR.add(item); }
  if (p.hand === 'staff'){ item.add(M(new T.CylinderGeometry(.035, .04, 1.6, 6), colMat('#6b4a2c'), 0, .25, 0)); item.add(M(new T.IcosahedronGeometry(.12, 0), glowMat('#8fd8ff', 1.2), 0, 1.1, 0)); armR.add(item); }
  if (p.hand === 'spatula'){ item.rotation.x = PI/2.4; item.add(M(B(.04, .45, .04), colMat('#3a2416'), 0, .15, 0)); item.add(M(B(.18, .2, .02), colMat('#c9ced6', {metalness:.6}), 0, .46, 0)); armR.add(item); }
  if (p.hand === 'club'){ item.rotation.x = PI/2.2; const cl = M(new T.CylinderGeometry(.11, .05, .7, 7), colMat('#6b4a2c'), 0, .3, 0); item.add(cl); armR.add(item); }
  if (p.hand === 'bow'){ const bow = new T.Group(); bow.position.set(0, -ah*.9, .08);
    const arc = M(new T.TorusGeometry(.42, .025, 6, 16, PI), colMat('#7a4f2a'), 0, 0, 0); arc.rotation.y = PI/2; arc.rotation.z = PI/2; bow.add(arc);
    bow.add(M(B(.01, .84, .01), colMat('#eeeeee'), 0, 0, -.0)); armL.add(bow); }
  root.userData.rig = {legL, legR, armL, armR, head, body, held: !!p.hand && p.hand !== 'gloves' && p.hand !== 'bow'};
  return root;
}
export function animChar(o, mode, t, dt = .016){
  const r = o.userData.rig; if (!r) return;
  let amp = 0, f = 0; if (mode === 'walk'){ amp = .6; f = 8; } else if (mode === 'run'){ amp = .95; f = 12; }
  const s = Math.sin(t * f), a = 1 - Math.pow(.0001, dt);
  const tgt = {};
  if (mode === 'air'){ tgt.lL = -.6; tgt.lR = .4; tgt.aL = -2.5; tgt.aR = r.held ? -1.2 : -2.5; tgt.zL = -.25; tgt.zR = .25; }
  else { tgt.lL = s*amp; tgt.lR = -s*amp; tgt.aL = -s*amp*.8; tgt.aR = s*amp*.8 + (r.held ? -.35 : 0); tgt.zL = -.04; tgt.zR = .04; }
  r.legL.rotation.x += (tgt.lL - r.legL.rotation.x) * a; r.legR.rotation.x += (tgt.lR - r.legR.rotation.x) * a;
  r.armL.rotation.x += (tgt.aL - r.armL.rotation.x) * a; r.armR.rotation.x += (tgt.aR - r.armR.rotation.x) * a;
  r.armL.rotation.z += (tgt.zL - r.armL.rotation.z) * a; r.armR.rotation.z += (tgt.zR - r.armR.rotation.z) * a;
  r.body.position.y = mode === 'idle' ? Math.sin(t*2.2)*.012 : (mode === 'air' ? 0 : Math.abs(s)*.06*amp);
  r.head.rotation.y = mode === 'idle' ? Math.sin(t*.7)*.15 : 0;
}
