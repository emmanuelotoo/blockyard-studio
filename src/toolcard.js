import { focusEnt } from './camera.js';
import { makeGhost, mode, paintTex, placeId, selId, select, setPaintTex, setPlaceId, tool } from './editor.js';
import { CAT_BY_ID, SIZED, entName } from './entities.js';
import { beginEdit, commitEdit, save, snapshot } from './history.js';
import { addEnt, ents, getEnt, refreshEnt, removeEnt } from './scene.js';
import { openStore } from './store.js';
import { TEXDEF, TEX_KEYS, texThumb } from './textures.js';
import { assetThumb } from './thumbs.js';
import { toast } from './ui.js';
import { $, clamp, esc, r2 } from './util.js';
import { world } from './world.js';

/* ---------------- Tool card ---------------- */
export const tc = $('#toolcard');
export function renderToolCard(){
  if (mode !== 'build'){ tc.innerHTML = ''; return; }
  if (tool === 'place'){
    const c = CAT_BY_ID[placeId];
    const quick = ['stone','clayblock','iceslab','mover','crumble','jumppad','coin','spikes','checkpoint','goal','oak','crystal'];
    tc.innerHTML = `<div class="place-head"><img alt="" src="${assetThumb(placeId)}"><div><div class="tc-title">${esc(c.name)}</div><div class="muted">Click the world to place it. Esc to stop.</div></div></div>
      <div class="palette">${quick.map(id => `<button data-place="${id}" aria-pressed="${id === placeId}" title="${esc(CAT_BY_ID[id].name)}"><img alt="" src="${assetThumb(id)}">${esc(CAT_BY_ID[id].name.split(' ')[0])}</button>`).join('')}</div>
      <div class="minirow"><button class="btn sm" data-act="store">More in the Store</button></div>`;
    return;
  }
  if (tool === 'paint'){
    tc.innerHTML = `<div class="tc-head"><span class="tc-title">Paint</span><span class="muted">${esc(TEXDEF[paintTex].name)}</span></div>
      <div class="muted" style="margin-bottom:8px">Click any block, mover or crumble to give it this texture.</div>
      <div class="swatches">${TEX_KEYS.map(k => `<button data-tex="${k}" title="${esc(TEXDEF[k].name)}" aria-pressed="${k === paintTex}" style="background-image:url(${texThumb(k)})"></button>`).join('')}</div>`;
    return;
  }
  if (tool === 'erase'){ tc.innerHTML = `<div class="tc-head"><span class="tc-title">Erase</span></div><div class="muted">Click a thing to remove it. Ctrl Z brings it back.</div>`; return; }
  const e = selId != null ? getEnt(selId) : null;
  if (!e){
    tc.innerHTML = `<div class="tc-head"><span class="tc-title">Select</span><span class="muted">${world.entities.length} things</span></div>
      <input class="tc-search" id="findEnt" placeholder="Find an entity…" autocomplete="off"><div class="tc-results" id="findRes"></div>
      <dl class="keys"><dt>Orbit</dt><dd>drag</dd><dt>Pan</dt><dd>right drag</dd><dt>Zoom</dt><dd>wheel</dd><dt>Move</dt><dd>drag selected</dd><dt>Height</dt><dd>Q, E</dd><dt>Turn</dt><dd>R</dd><dt>Copy</dt><dd>Ctrl D</dd><dt>Focus</dt><dd>F</dd><dt>Delete</dt><dd>Del</dd></dl>`;
    return;
  }
  let h = `<div class="tc-head"><span class="tc-title">${esc(entName(e))}</span><span class="muted">#${e.id}</span></div>
    <div class="field"><label>Position</label><div class="trio">${['x','y','z'].map(k => `<input class="num" type="number" step="0.5" data-f="${k}" value="${r2(e[k])}" aria-label="${k}">`).join('')}</div></div>`;
  if (SIZED.has(e.kind)){
    h += `<div class="field"><label>Size</label><div class="trio">${['w','h','d'].map(k => `<input class="num" type="number" step="0.2" min="0.2" max="30" data-f="${k}" value="${r2(e[k])}" aria-label="${k}">`).join('')}</div></div>
      <div class="field" style="align-items:start"><label>Texture</label><div class="swatches">${TEX_KEYS.map(k => `<button data-settex="${k}" title="${esc(TEXDEF[k].name)}" aria-pressed="${k === e.tex}" style="background-image:url(${texThumb(k)})"></button>`).join('')}</div></div>`;
  }
  if (e.kind === 'mover'){
    h += `<div class="field"><label>Axis</label><div class="seg"><button data-axis="x" aria-pressed="${e.axis !== 'z'}">X</button><button data-axis="z" aria-pressed="${e.axis === 'z'}">Z</button></div></div>
      <div class="field"><label>Distance</label><input type="range" min="1" max="8" step="0.5" data-f="dist" value="${e.dist}"></div>
      <div class="field"><label>Speed</label><input type="range" min="0.3" max="3" step="0.1" data-f="speed" value="${e.speed}"></div>`;
  }
  if (!SIZED.has(e.kind) && e.kind !== 'spawn') h += `<div class="field"><label>Scale</label><input type="range" min="0.4" max="3" step="0.1" data-f="s" value="${e.s || 1}"></div>`;
  if (e.kind === 'crystal' || e.kind === 'car') h += `<div class="field"><label>Colour</label><input type="color" data-f="color" value="${e.color}"></div>`;
  h += `<div class="minirow"><button class="btn sm" data-act="rotate">Turn 90°</button>${e.kind === 'spawn' ? '' : '<button class="btn sm" data-act="dup">Duplicate</button><button class="btn sm" data-act="del">Delete</button>'}<button class="btn sm ghost" data-act="deselect">Done</button></div>`;
  tc.innerHTML = h;
}
export function renderFind(q){
  const res = $('#findRes'); if (!res) return;
  q = q.trim().toLowerCase(); if (!q){ res.innerHTML = ''; return; }
  const list = world.entities.filter(e => entName(e).toLowerCase().includes(q) || String(e.id) === q).slice(0, 8);
  res.innerHTML = list.length ? list.map(e => `<button data-find="${e.id}"><span>${esc(entName(e))}</span><span class="muted">#${e.id}</span></button>`).join('') : '<div class="muted" style="padding:4px 6px">No matches. Try “coin” or “block”.</div>';
}
tc.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'findEnt') return renderFind(t.value);
  const f = t.dataset.f; if (!f || selId == null) return;
  const e = getEnt(selId); if (!e) return;
  beginEdit();
  if (f === 'color') e.color = t.value;
  else { const v = parseFloat(t.value); if (!isFinite(v)) return; e[f] = ['w','h','d'].includes(f) ? clamp(v, .2, 30) : f === 's' ? clamp(v, .3, 4) : v; }
  refreshEnt(e.id);
});
tc.addEventListener('change', ev => { if (ev.target.dataset.f){ commitEdit(); } });
tc.addEventListener('click', ev => {
  const b = ev.target.closest('button'); if (!b) return;
  if (b.dataset.place){ setPlaceId(b.dataset.place); makeGhost(); renderToolCard(); return; }
  if (b.dataset.tex){ setPaintTex(b.dataset.tex); renderToolCard(); return; }
  if (b.dataset.find){ const id = +b.dataset.find; select(id); focusEnt(id); return; }
  const e = selId != null ? getEnt(selId) : null;
  if (b.dataset.settex && e){ snapshot(); e.tex = b.dataset.settex; refreshEnt(e.id); save(); renderToolCard(); return; }
  if (b.dataset.axis && e){ snapshot(); e.axis = b.dataset.axis; refreshEnt(e.id); save(); renderToolCard(); return; }
  const act = b.dataset.act;
  if (act === 'store') openStore();
  if (act === 'rotate') rotateSel();
  if (act === 'dup') dupSel();
  if (act === 'del') delSel();
  if (act === 'deselect') select(null);
});
export function rotateSel(){ const e = selId != null && getEnt(selId); if (!e) return; snapshot(); e.ry = ((e.ry || 0) + 90) % 360; refreshEnt(e.id); save(); }
export function dupSel(){ const e = selId != null && getEnt(selId); if (!e || e.kind === 'spawn') return; snapshot(); const n = JSON.parse(JSON.stringify(e)); n.id = world.nextId++; n.x += 1; n.z += 1; world.entities.push(n); addEnt(n); select(n.id); save(); }
export function delSel(){ const e = selId != null && getEnt(selId); if (!e) return; if (e.kind === 'spawn') return toast('The player start can’t be deleted. Move it instead.'); snapshot(); world.entities = world.entities.filter(x => x !== e); removeEnt(e.id); select(null); save(); }
export function nudgeSel(dy){ const e = selId != null && getEnt(selId); if (!e) return; snapshot(); e.y = Math.max(0, r2(e.y + dy)); ents.get(e.id).obj.position.y = e.y; save(); renderToolCard(); }
