import * as T from 'three';
import { frameCourse } from './camera.js';
import { PRESETS, PROPS, animChar, buildCharacter } from './characters.js';
import { KIND } from './entities.js';
import { beginEdit, commitEdit, save, snapshot } from './history.js';
import { LOOKS } from './looks.js';
import { stdMat } from './materials.js';
import { startPlay } from './play.js';
import { applyLook, disposeObj, refreshEnt } from './scene.js';
import { openStore } from './store.js';
import { TEXDEF } from './textures.js';
import { charThumb, thumbs } from './thumbs.js';
import { renderToolCard } from './toolcard.js';
import { log, logs, updateCounts } from './ui.js';
import { $, $$, PI, esc } from './util.js';
import { world } from './world.js';

/* ---------------- Right panel ---------------- */
export let tab = 'page';
export const pbody = $('#pbody');
export function setTab(t){ tab = t; $$('.tabs [role=tab]').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === t)); renderPanel(); if (innerWidth <= 820) $('#panel').classList.add('open'); }
export function renderPanel(){ if (tab === 'page') renderPage(); else if (tab === 'look') renderLook(); else if (tab === 'char') renderChar(); else renderConsole(); }
export function renderAll(){ renderPanel(); renderToolCard(); updateCounts(); }
export function renderPage(soft){
  const kinds = {}; world.entities.forEach(e => { const n = e.kind === 'block' ? 'Block: ' + (TEXDEF[e.tex] ? TEXDEF[e.tex].name : 'Painted') : KIND[e.kind].name; kinds[n] = (kinds[n] || 0) + 1; });
  const tu = world.tune;
  if (soft && $('#tuneJump')){ $('#pageMeta').textContent = `Platformer, ${world.entities.length} things`; $('#brickChips').innerHTML = chipHtml(kinds); $('#brickCount').textContent = Object.keys(kinds).length; return; }
  pbody.innerHTML = `<input class="page-title" id="pTitle" value="${esc(world.title)}" aria-label="Course title">
    <div class="page-meta" id="pageMeta">Platformer, ${world.entities.length} things</div>
    <textarea class="page-desc" id="pDesc" rows="2" aria-label="Description">${esc(world.desc)}</textarea>
    <h4>Controls</h4>
    <p class="ctl"><b>WASD</b> move, <b>Space</b> jump (hold for height), <b>Shift</b> dash, <b>drag</b> to look. Walk off a ledge and you can still jump for a moment.</p>
    <div class="btnrow"><button class="btn primary" data-pact="play">Play</button><button class="btn" data-pact="store">Store</button><button class="btn" data-pact="frame">Frame course</button></div>
    <h4>Tune</h4>
    ${tuneRow('tuneJump','Jump height', 'jump', 1, 6, .1, 'm')}
    ${tuneRow('tuneApex','Time to apex', 'apex', .2, .7, .01, 's')}
    ${tuneRow('tuneRun','Run speed', 'run', 3, 14, .5, 'm/s')}
    <h4>Bricks used <span id="brickCount">${Object.keys(kinds).length}</span></h4>
    <div class="chips" id="brickChips">${chipHtml(kinds)}</div>`;
}
export const chipHtml = kinds => Object.entries(kinds).sort((a, b) => b[1] - a[1]).map(([k, n]) => `<span class="chip">${esc(k)}${n > 1 ? ' ×' + n : ''}</span>`).join('');
export const tuneRow = (id, label, key, min, max, step, unit) => `<div class="tune"><div><label for="${id}">${label}</label><span id="${id}V">${world.tune[key]} ${unit}</span></div><input type="range" id="${id}" data-tune="${key}" data-unit="${unit}" min="${min}" max="${max}" step="${step}" value="${world.tune[key]}"></div>`;
pbody.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'pTitle'){ world.title = t.value.slice(0, 60); $('#worldName').textContent = world.title || 'Untitled'; save(); }
  if (t.id === 'pDesc'){ world.desc = t.value.slice(0, 400); save(); }
  if (t.dataset.tune){ beginEdit(); world.tune[t.dataset.tune] = +t.value; $('#' + t.id + 'V').textContent = t.value + ' ' + t.dataset.unit; }
  if (t.dataset.cc){ beginEdit(); world.character.colors[t.dataset.cc] = t.value; charChanged(false); }
  if (t.id === 'cHeight'){ beginEdit(); world.character.height = +t.value; $('#cHeightV').textContent = (+t.value).toFixed(2) + ' m'; charChanged(false); }
});
pbody.addEventListener('change', ev => { const t = ev.target; if (t.dataset.tune || t.dataset.cc || t.id === 'cHeight') commitEdit(); });
pbody.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  const a = b.dataset.pact;
  if (a === 'play') startPlay(); if (a === 'store') openStore(); if (a === 'frame') frameCourse();
  if (b.dataset.look) useLook(b.dataset.look);
  if (b.dataset.preset){ snapshot(); world.character = {preset:b.dataset.preset, height:world.character.height, prop:world.character.prop, colors:{}}; charChanged(true); save(); }
  if (b.dataset.prop){ snapshot(); world.character.prop = b.dataset.prop; charChanged(true); save(); }
  if (b.dataset.anim){ charAnim = b.dataset.anim; renderChar(); }
  if (a === 'random'){ snapshot(); const ks = Object.keys(PRESETS); const r = Math.random; const hue = () => `hsl(${r()*360|0},${45+r()*35|0}%,${35+r()*30|0}%)`;
    world.character = {preset:ks[r()*ks.length|0], height:+(1.5 + r()*.6).toFixed(2), prop:['chibi','heroic','realistic'][r()*3|0], colors:{shirt:hslHex(hue()), pants:hslHex(hue())}}; charChanged(true); save(); }
  if (a === 'resetcol'){ snapshot(); world.character.colors = {}; charChanged(true); save(); }
  if (a === 'clearlog'){ logs.length = 0; renderConsole(); }
});
export function hslHex(h){ const c = document.createElement('canvas').getContext('2d'); c.fillStyle = h; return c.fillStyle; }
export function useLook(k){ if (world.look === k) return; snapshot(); world.look = k; applyLook(k); save(); renderLook(); log('Look set to ' + LOOKS[k].name); }
export function renderLook(){
  pbody.innerHTML = `<div class="page-title" style="font-size:24px">Look</div><p class="muted" style="margin:4px 0 14px">How the world is lit and graded. Pick one and it’s saved with the course.</p>
    <div class="looks">${Object.entries(LOOKS).map(([k, L]) => `<button data-look="${k}" aria-pressed="${world.look === k}"><div class="lsw" style="background:linear-gradient(${L.sw[0]} 55%, ${L.sw[1]} 55%)"><i style="left:10px;background:${L.sw[2]}"></i><i style="left:30px;background:${L.sw[1]};filter:brightness(.8)"></i></div><div><strong>${L.name}</strong><small>${L.desc}</small></div></button>`).join('')}</div>`;
}
export function renderConsole(){
  pbody.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:baseline"><div class="page-title" style="font-size:24px">Console</div><button class="btn sm ghost" data-pact="clearlog">Clear</button></div>
    <div class="log">${logs.length ? logs.slice().reverse().map(l => `<div><time>${l.t}</time><span class="${l.kind}">${esc(l.msg)}</span></div>`).join('') : '<p class="muted">Events from building and playing show up here.</p>'}</div>`;
}

/* ---------------- Character panel ---------------- */
export let charR = null, charScene, charCam, charObj, charAnim = 'idle', charYaw = .5;
export function ensureCharR(cv){
  if (charR && charR.domElement === cv) return;
  if (charR) charR.dispose();
  charR = new T.WebGLRenderer({canvas:cv, antialias:true, alpha:true}); charR.setPixelRatio(Math.min(devicePixelRatio, 2));
  charR.outputColorSpace = T.SRGBColorSpace; charR.toneMapping = T.ACESFilmicToneMapping; charR.shadowMap.enabled = true;
  charScene = new T.Scene(); charScene.add(new T.HemisphereLight(0xffffff, 0x777777, 1.4));
  const d = new T.DirectionalLight(0xffffff, 2.2); d.position.set(3, 6, 5); d.castShadow = true; charScene.add(d);
  const floor = new T.Mesh(new T.CircleGeometry(1.1, 40), stdMat({color:'#8a8a8a', transparent:true, opacity:.25})); floor.rotation.x = -PI/2; floor.receiveShadow = true; charScene.add(floor);
  charCam = new T.PerspectiveCamera(30, 1, .1, 50);
  let drag = null;
  cv.addEventListener('pointerdown', e => { drag = e.clientX; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', e => { if (drag != null){ charYaw += (e.clientX - drag) * .01; drag = e.clientX; } });
  cv.addEventListener('pointerup', () => drag = null);
}
export function renderChar(){
  const c = world.character, p = Object.assign({}, PRESETS[c.preset], c.colors);
  pbody.innerHTML = `<div class="page-title" style="font-size:24px">Make a character</div>
    <p class="muted" style="margin:4px 0 12px">Every character shares one rig, so any outfit animates the same. Drag to turn it.</p>
    <div class="charview"><canvas id="charCv"></canvas><div class="seg">${['idle','walk','run'].map(a => `<button data-anim="${a}" aria-pressed="${charAnim === a}">${a}</button>`).join('')}</div></div>
    <h4>Start from <button class="btn sm ghost" data-pact="random">Randomize</button></h4>
    <div class="cgrid">${Object.entries(PRESETS).map(([k, P]) => `<button data-preset="${k}" aria-pressed="${c.preset === k}" title="${esc(P.desc)}"><img alt="" src="${charThumb(k)}">${esc(P.name)}</button>`).join('')}</div>
    <h4>Body and proportions</h4>
    <div class="seg" style="width:100%;display:flex">${Object.entries(PROPS).map(([k, P]) => `<button style="flex:1" data-prop="${k}" aria-pressed="${c.prop === k}">${P.name}</button>`).join('')}</div>
    <div class="tune" style="margin-top:12px"><div><label for="cHeight">Height</label><span id="cHeightV">${(+c.height).toFixed(2)} m</span></div><input type="range" id="cHeight" min="1.2" max="2.4" step="0.05" value="${c.height}"></div>
    <h4>Colours <button class="btn sm ghost" data-pact="resetcol">Reset</button></h4>
    <div class="colors">${[['skin','Skin'],['shirt','Top'],['pants','Legs'],['shoes','Shoes']].map(([k, l]) => `<label>${l}<input type="color" data-cc="${k}" value="${hslHex(p[k])}"></label>`).join('')}</div>`;
  const cv = $('#charCv'); ensureCharR(cv); charChanged(false, true);
}
export function charChanged(rerender, onlyPreview){
  if (charScene){ if (charObj){ charScene.remove(charObj); disposeObj(charObj); } charObj = buildCharacter(world.character); charObj.traverse(o => { if (o.isMesh) o.castShadow = true; }); charScene.add(charObj); }
  if (onlyPreview) return;
  const sp = world.entities.find(e => e.kind === 'spawn'); if (sp) refreshEnt(sp.id);
  delete thumbs['a:spawn'];
  if (rerender) renderChar();
}
export function drawCharPreview(t, dt){
  if (!charR || tab !== 'char' || !document.body.contains(charR.domElement)) return;
  const cv = charR.domElement, w = cv.clientWidth, h = cv.clientHeight; if (!w) return;
  if (cv.width !== Math.round(w * charR.getPixelRatio())) { charR.setSize(w, h, false); charCam.aspect = w / h; charCam.updateProjectionMatrix(); }
  const H = world.character.height || 1.8;
  charCam.position.set(0, H * .62, H * 2.6 + 1); charCam.lookAt(0, H * .5, 0);
  charYaw += dt * .25; if (charObj){ charObj.rotation.y = charYaw; animChar(charObj, charAnim, t, dt); }
  charR.render(charScene, charCam);
}
