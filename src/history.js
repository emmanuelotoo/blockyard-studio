import { select } from './editor.js';
import { renderAll } from './panel.js';
import { applyLook, rebuildAll } from './scene.js';
import { toast, updateCounts } from './ui.js';
import { $ } from './util.js';
import { KEY, normalize, setWorld, world } from './world.js';

/* ---------------- History & save ---------------- */
export const undoStack = [], redoStack = [];
export let preEdit = null;
export function beginEdit(){ beginEdit(); }
export function snapshot(){ undoStack.push(JSON.stringify(world)); if (undoStack.length > 80) undoStack.shift(); redoStack.length = 0; }
export function commitEdit(){ if (preEdit){ undoStack.push(preEdit); redoStack.length = 0; preEdit = null; } save(); }
export function replaceWorld(json){ setWorld(normalize(JSON.parse(json))); select(null); rebuildAll(); applyLook(world.look); renderAll(); save(); }
export function undo(){ if (!undoStack.length) return toast('Nothing to undo'); redoStack.push(JSON.stringify(world)); replaceWorld(undoStack.pop()); }
export function redo(){ if (!redoStack.length) return toast('Nothing to redo'); undoStack.push(JSON.stringify(world)); replaceWorld(redoStack.pop()); }
export let saveT;
export function setSaved(txt, cls){ const s = $('#saved'); s.className = 'saved ' + (cls || ''); s.querySelector('span').textContent = txt; }
export function save(){
  setSaved('Saving', 'busy'); clearTimeout(saveT);
  saveT = setTimeout(() => { try { localStorage.setItem(KEY, JSON.stringify(world)); setSaved('Saved on this device'); } catch (e) { setSaved('Not saved: storage is off', 'bad'); } }, 350);
  updateCounts();
}
