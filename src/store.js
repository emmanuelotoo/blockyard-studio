import { PRESETS } from './characters.js';
import { mode, setTool } from './editor.js';
import { CATALOG } from './entities.js';
import { save, snapshot } from './history.js';
import { LOOKS } from './looks.js';
import { charChanged, renderChar, tab, useLook } from './panel.js';
import { stopPlay } from './play.js';
import { TEXDEF, TEX_KEYS, texThumb } from './textures.js';
import { assetThumb, charThumb } from './thumbs.js';
import { toast } from './ui.js';
import { $, esc } from './util.js';
import { world } from './world.js';

/* ---------------- Store ---------------- */
export const STORE_CATS = ['Everything','Characters','Level bricks','Level logic','Hazards and collectibles','Nature','Props','Textures','Looks'];
export let storeCat = 'Everything';
export function openStore(){ $('#store').classList.add('open'); renderStore(); setTimeout(() => $('#storeSearch').focus(), 30); }
export function closeStore(){ $('#store').classList.remove('open'); }
export function renderStore(){
  $('#storeChips').innerHTML = STORE_CATS.map(c => `<button class="chip" data-scat="${c}" aria-pressed="${c === storeCat}">${c}</button>`).join('');
  const q = $('#storeSearch').value.trim().toLowerCase();
  const m = (n, d) => !q || n.toLowerCase().includes(q) || d.toLowerCase().includes(q);
  const show = c => storeCat === 'Everything' || storeCat === c;
  let h = '';
  const section = (title, sub, items) => { if (items.length) h += `<h3>${title}</h3><p>${sub}</p><div class="sgrid">${items.join('')}</div>`; };
  if (show('Characters')) section('Characters', 'Pick who you play as. Edit the details in the Character tab.', Object.entries(PRESETS).filter(([k, P]) => m(P.name, P.desc)).map(([k, P]) =>
    `<button class="sitem" data-schar="${k}" aria-pressed="${world.character.preset === k}"><div class="im"><img alt="" src="${charThumb(k)}"></div><b>${esc(P.name)}</b><small>${esc(P.desc)}</small></button>`));
  for (const cat of ['Level bricks','Level logic','Hazards and collectibles','Nature','Props']){
    if (!show(cat)) continue;
    const sub = {"Level bricks":'Platforms you can stand on. Resize and retexture them after placing.', "Level logic":'Pieces that make a course behave like a game.', "Hazards and collectibles":'Things to grab and things to avoid.', Nature:'Scenery for the island.', Props:'Odds and ends to dress the world.'}[cat];
    section(cat, sub, CATALOG.filter(c => c.cat === cat && m(c.name, c.desc)).map(c => `<button class="sitem" data-sasset="${c.id}"><div class="im cont"><img alt="" src="${assetThumb(c.id)}"></div><b>${esc(c.name)}</b><small>${esc(c.desc)}</small></button>`));
  }
  if (show('Textures')) section('Textures', 'Choose one, then click blocks to paint them.', TEX_KEYS.filter(k => m(TEXDEF[k].name, TEXDEF[k].desc)).map(k =>
    `<button class="sitem" data-stex="${k}"><div class="im"><img alt="" src="${texThumb(k)}" style="image-rendering:auto"></div><b>${esc(TEXDEF[k].name)}</b><small>${esc(TEXDEF[k].desc)}</small></button>`));
  if (show('Looks')) section('Looks', 'Lighting and grading for the whole world.', Object.entries(LOOKS).filter(([k, L]) => m(L.name, L.desc)).map(([k, L]) =>
    `<button class="sitem" data-slook="${k}" aria-pressed="${world.look === k}"><div class="im" style="background:linear-gradient(${L.sw[0]} 58%, ${L.sw[1]} 58%)"></div><b>${esc(L.name)}</b><small>${esc(L.desc)}</small></button>`));
  $('#storeBody').innerHTML = h || `<p class="muted" style="margin-top:30px">Nothing matches “${esc(q)}”. Try a shorter word, like “tree” or “stone”.</p>`;
}
$('#storeSearch').addEventListener('input', renderStore);
$('#storeChips').addEventListener('click', e => { const b = e.target.closest('[data-scat]'); if (b){ storeCat = b.dataset.scat; renderStore(); } });
$('#storeBody').addEventListener('click', e => {
  const b = e.target.closest('.sitem'); if (!b) return;
  if (b.dataset.schar){ snapshot(); world.character = {preset:b.dataset.schar, height:world.character.height, prop:world.character.prop, colors:{}}; charChanged(false); save(); closeStore(); toast('Playing as ' + PRESETS[b.dataset.schar].name); if (tab === 'char') renderChar(); }
  if (b.dataset.sasset){ closeStore(); if (mode === 'play') stopPlay(); setTool('place', {place:b.dataset.sasset}); }
  if (b.dataset.stex){ closeStore(); if (mode === 'play') stopPlay(); setTool('paint', {tex:b.dataset.stex}); }
  if (b.dataset.slook){ useLook(b.dataset.slook); renderStore(); }
});
$('#storeClose').onclick = closeStore;
