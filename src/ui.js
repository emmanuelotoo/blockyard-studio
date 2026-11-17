import { mode } from './editor.js';
import { renderPage, renderPanel, tab } from './panel.js';
import { P } from './play.js';
import { $ } from './util.js';
import { world } from './world.js';

/* ---------------- UI helpers ---------------- */
export let toastT;
export function toast(msg){ const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2200); }
export const logs = [];
export function log(msg, kind = ''){ const d = new Date(); logs.push({t:d.toTimeString().slice(0, 5), msg, kind}); if (logs.length > 200) logs.shift(); if (tab === 'console') renderPanel(); }
export function updateCounts(){
  $('#things').textContent = world.entities.length + ' things';
  $('#worldName').textContent = world.title || 'Untitled';
  renderHud();
  if (tab === 'page' && !panelEditing()) renderPage(true);
}
export function panelEditing(){ const a = document.activeElement; return a && $('#pbody').contains(a) && (a.tagName === 'INPUT' || a.tagName === 'TEXTAREA'); }

/* ---------------- HUD ---------------- */
export function renderHud(){
  const total = world.entities.filter(e => e.kind === 'coin').length;
  if (mode === 'play') $('#hud').innerHTML = `<span>Coins <b id="coinN">${P.coins}</b> / ${total}</span><span>Time <b id="timeN">${P.time.toFixed(1)}</b>s</span>`;
  else $('#hud').innerHTML = `<span>Coins <b>${total}</b></span>`;
}
