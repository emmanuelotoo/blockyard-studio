import { frameCourse } from './camera.js';
import { mode, setTool } from './editor.js';
import { redo, replaceWorld, snapshot, undo } from './history.js';
import { setTab } from './panel.js';
import { startPlay, stopPlay } from './play.js';
import { openStore } from './store.js';
import { log, toast } from './ui.js';
import { $, $$ } from './util.js';
import { defaultWorld, world } from './world.js';

/* ---------------- Menus, export, import ---------------- */
export function exportWorld(){
  const data = JSON.stringify(world, null, 1), name = (world.title || 'course').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').toLowerCase() + '.json';
  const url = URL.createObjectURL(new Blob([data], {type:'application/json'}));
  const a = document.createElement('a'); a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  log('Exported ' + name); toast('Downloaded ' + name);
}
$('#exportBtn').onclick = exportWorld;
export let menuEl = null;
export function closeMenu(){ if (menuEl){ menuEl.remove(); menuEl = null; } }
$('#worldBtn').onclick = e => {
  e.stopPropagation(); if (menuEl) return closeMenu();
  const r = e.currentTarget.getBoundingClientRect();
  menuEl = document.createElement('div'); menuEl.className = 'menu'; menuEl.setAttribute('role', 'menu');
  menuEl.style.left = r.left + 'px'; menuEl.style.top = (r.bottom + 6) + 'px';
  menuEl.innerHTML = `<button data-m="reset">Reset to Clay Peaks</button><button data-m="empty">New empty island</button><hr><button data-m="import">Import course JSON</button><button data-m="export">Export course JSON</button>`;
  document.body.appendChild(menuEl);
  menuEl.onclick = ev => { const m = ev.target.dataset.m; closeMenu(); if (!m) return; if (mode === 'play') stopPlay();
    if (m === 'reset'){ snapshot(); replaceWorld(JSON.stringify(defaultWorld())); frameCourse(); toast('Reset. Ctrl Z to undo'); }
    if (m === 'empty'){ snapshot(); const w = defaultWorld(); w.title = 'Untitled course'; w.desc = 'A fresh island.'; w.entities = w.entities.filter(e => e.kind === 'spawn'); replaceWorld(JSON.stringify(w)); toast('New island. Ctrl Z to undo'); }
    if (m === 'import') $('#importFile').click();
    if (m === 'export') exportWorld(); };
};
addEventListener('pointerdown', e => { if (menuEl && !menuEl.contains(e.target)) closeMenu(); });
$('#importFile').onchange = async e => { const f = e.target.files[0]; e.target.value = ''; if (!f) return;
  try { const w = JSON.parse(await f.text()); if (!w || !Array.isArray(w.entities)) throw 0; snapshot(); replaceWorld(JSON.stringify(w)); frameCourse(); toast('Imported ' + world.title); } catch (err) { toast('That file isn’t a Blockyard course'); } };

/* ---------------- Wiring ---------------- */
$('#buildBtn').onclick = () => stopPlay();
$('#playBtn').onclick = () => startPlay();
$('#storeBtn').onclick = openStore;
$('#panelBtn').onclick = () => $('#panel').classList.toggle('open');
$('#panelClose').onclick = () => $('#panel').classList.remove('open');
$$('.rail [data-tool]').forEach(b => b.onclick = () => { if (mode === 'play') stopPlay(); setTool(b.dataset.tool); });
$$('.rail [data-tab]').forEach(b => b.onclick = () => setTab(b.dataset.tab));
$('.rail [data-act="undo"]').onclick = undo; $('.rail [data-act="redo"]').onclick = redo;
$('.rail [data-act="frame"]').onclick = frameCourse; $('.rail [data-act="store"]').onclick = openStore;
$$('.tabs [role=tab]').forEach(b => b.onclick = () => setTab(b.dataset.tab));
