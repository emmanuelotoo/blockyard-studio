import * as T from 'three';
import { PI, mulberry } from './util.js';

/* ---------------- Procedural textures ---------------- */
export const TEXDEF = {
  grass:{name:'Grass', desc:'Meadow green with darker flecks'},
  cobble:{name:'Cobble', desc:'Rounded stones set in mortar'},
  brick:{name:'Brick', desc:'Fired red brick in offset rows'},
  wood:{name:'Planks', desc:'Warm sawn boards with grain'},
  bark:{name:'Bark', desc:'Rough, furrowed tree bark'},
  concrete:{name:'Concrete', desc:'Poured, with pits and stains'},
  dirt:{name:'Dirt', desc:'Packed earth with pebbles'},
  sand:{name:'Sand', desc:'Fine pale sand'},
  checker:{name:'Checker', desc:'Classic grey test pattern'},
  ice:{name:'Ice', desc:'Pale blue with glassy streaks'},
  metal:{name:'Metal', desc:'Brushed plate with rivets'},
  clay:{name:'Clay', desc:'Smooth orange plaster'},
  cream:{name:'Cream', desc:'Soft painted cream'},
  moss:{name:'Moss', desc:'Damp green stone'},
};
export const TEX_KEYS = Object.keys(TEXDEF);
export function noise(g, S, r, base, amt, size){
  g.fillStyle = base; g.fillRect(0, 0, S, S);
  for (let y = 0; y < S; y += size) for (let x = 0; x < S; x += size){
    const v = (r() - .5) * amt;
    g.fillStyle = v > 0 ? `rgba(255,255,255,${v})` : `rgba(0,0,0,${-v})`;
    g.fillRect(x, y, size, size);
  }
}
export function wrapDraw(S, fn){ for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) fn(ox, oy); }
export const texCanvas = {};
export function drawTex(key){
  if (texCanvas[key]) return texCanvas[key];
  const S = 128, c = document.createElement('canvas'); c.width = c.height = S;
  const g = c.getContext('2d'); const r = mulberry(key.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 7));
  switch (key){
    case 'grass':
      noise(g, S, r, '#6cb93c', .14, 2);
      for (let i = 0; i < 170; i++){ g.fillStyle = r() < .6 ? 'rgba(40,110,30,.45)' : 'rgba(160,220,100,.4)'; g.fillRect(r()*S|0, r()*S|0, 2, 3 + (r()*4|0)); }
      break;
    case 'cobble': case 'moss': {
      noise(g, S, r, key === 'moss' ? '#4d5a3a' : '#5e5951', .12, 2);
      const n = 4, cs = S / n;
      for (let i = 0; i < n; i++) for (let j = 0; j < n; j++){
        const cx = i * cs + cs/2 + (r()-.5)*8, cy = j * cs + cs/2 + (r()-.5)*8;
        const rx = cs*.44 + r()*3, ry = cs*.4 + r()*3, l = 44 + r()*16;
        const col = key === 'moss' ? `hsl(${85+r()*20},${18+r()*12}%,${l-6}%)` : `hsl(${30+r()*20},${5+r()*6}%,${l}%)`;
        wrapDraw(S, (ox, oy) => {
          g.beginPath(); g.ellipse(cx+ox, cy+oy, rx, ry, r()*.4, 0, PI*2); g.fillStyle = col; g.fill();
          g.lineWidth = 2; g.strokeStyle = 'rgba(0,0,0,.35)'; g.stroke();
          g.beginPath(); g.ellipse(cx+ox-3, cy+oy-3, rx*.6, ry*.5, 0, PI, PI*1.8); g.strokeStyle = 'rgba(255,255,255,.18)'; g.stroke();
        });
      }
      const d = g.getImageData(0,0,S,S); for (let k = 0; k < d.data.length; k += 4){ const v = (r()-.5)*22; d.data[k]+=v; d.data[k+1]+=v; d.data[k+2]+=v; } g.putImageData(d,0,0);
      break; }
    case 'brick': {
      g.fillStyle = '#d3c9bb'; g.fillRect(0,0,S,S);
      const bh = 16, bw = 32;
      for (let row = 0; row < S/bh; row++){ const off = row % 2 ? bw/2 : 0;
        for (let x = -bw; x < S + bw; x += bw){ g.fillStyle = `hsl(${6+r()*10},${48+r()*14}%,${36+r()*10}%)`; g.fillRect(x+off+1.5, row*bh+1.5, bw-3, bh-3); } }
      const d = g.getImageData(0,0,S,S); for (let k = 0; k < d.data.length; k += 4){ const v = (r()-.5)*26; d.data[k]+=v; d.data[k+1]+=v; d.data[k+2]+=v; } g.putImageData(d,0,0);
      break; }
    case 'wood': {
      const ph = 32;
      for (let row = 0; row < S/ph; row++){ g.fillStyle = `hsl(${26+r()*6},${48+r()*8}%,${42+r()*8}%)`; g.fillRect(0, row*ph, S, ph);
        for (let k = 0; k < 9; k++){ g.strokeStyle = `rgba(70,40,15,${.12+r()*.18})`; g.lineWidth = 1; g.beginPath(); const y0 = row*ph + 3 + r()*(ph-6); g.moveTo(0, y0);
          for (let x = 0; x <= S; x += 8) g.lineTo(x, y0 + Math.sin(x*.05 + k)*1.5); g.stroke(); }
        g.fillStyle = 'rgba(40,22,8,.55)'; g.fillRect(0, row*ph, S, 2);
        g.fillStyle = 'rgba(30,20,10,.6)'; g.fillRect(6, row*ph + ph/2 - 1, 3, 3); g.fillRect(S-9, row*ph + ph/2 - 1, 3, 3); }
      break; }
    case 'bark':
      noise(g, S, r, '#5f4129', .1, 2);
      for (let i = 0; i < 60; i++){ g.fillStyle = r() < .5 ? 'rgba(25,14,6,.45)' : 'rgba(150,110,70,.25)'; g.fillRect(r()*S|0, 0, 1 + r()*3|0, S); }
      break;
    case 'concrete':
      noise(g, S, r, '#a6a29b', .1, 2);
      for (let i = 0; i < 5; i++){ const x = r()*S, y = r()*S, rr = 14 + r()*26; const gr = g.createRadialGradient(x,y,0,x,y,rr); gr.addColorStop(0,'rgba(60,55,45,.12)'); gr.addColorStop(1,'rgba(60,55,45,0)'); g.fillStyle = gr; g.fillRect(0,0,S,S); }
      for (let i = 0; i < 55; i++){ g.fillStyle = 'rgba(40,40,40,.35)'; g.beginPath(); g.arc(r()*S, r()*S, .6 + r()*1.4, 0, PI*2); g.fill(); }
      break;
    case 'dirt':
      noise(g, S, r, '#7a5636', .2, 3);
      for (let i = 0; i < 40; i++){ g.fillStyle = `rgba(${150+r()*50|0},${120+r()*40|0},${90+r()*30|0},.55)`; g.beginPath(); g.ellipse(r()*S, r()*S, 1+r()*2.5, 1+r()*2, 0, 0, PI*2); g.fill(); }
      break;
    case 'sand':
      noise(g, S, r, '#e2c88f', .1, 1);
      for (let i = 0; i < 90; i++){ g.fillStyle = 'rgba(120,90,50,.35)'; g.fillRect(r()*S, r()*S, 1, 1); }
      break;
    case 'checker':
      for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++){ g.fillStyle = (i + j) % 2 ? '#bdbdbd' : '#f1f1f1'; g.fillRect(i*32, j*32, 32, 32); }
      break;
    case 'ice':
      noise(g, S, r, '#a9d8f0', .06, 2);
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 1.5;
      for (let i = 0; i < 14; i++){ const x = r()*S, y = r()*S, l = 10 + r()*30; wrapDraw(S, (ox, oy) => { g.beginPath(); g.moveTo(x+ox, y+oy); g.lineTo(x+ox+l, y+oy-l*.5); g.stroke(); }); }
      break;
    case 'metal':
      g.fillStyle = '#8c939a'; g.fillRect(0,0,S,S);
      for (let y = 0; y < S; y++){ g.fillStyle = `rgba(255,255,255,${r()*.08})`; g.fillRect(0, y, S, 1); }
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.strokeRect(1,1,S-2,S-2);
      for (const [x, y] of [[8,8],[S-8,8],[8,S-8],[S-8,S-8]]){ g.fillStyle = '#5f666d'; g.beginPath(); g.arc(x,y,3,0,PI*2); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x-1,y-2,1,1); }
      break;
    case 'clay': noise(g, S, r, '#e8572d', .05, 2); break;
    case 'cream': noise(g, S, r, '#efe1c6', .05, 2); break;
    default: noise(g, S, r, '#999', .1, 2);
  }
  texCanvas[key] = c; return c;
}
export const texCache = {};
export function getTex(key){
  if (!texCache[key]){ const t = new T.CanvasTexture(drawTex(key)); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.SRGBColorSpace; t.anisotropy = 4; texCache[key] = t; }
  return texCache[key];
}
export const texURL = {};
export function texThumb(key){ return texURL[key] || (texURL[key] = drawTex(key).toDataURL()); }
