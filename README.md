# Blockyard Studio

A browser-based 3D block editor and platformer. Build a course on a grassy island out of blocks, moving platforms, crumbling blocks, jump pads, spikes, checkpoints and coins, then hit Play and run it with WASD.

Built with [three.js](https://threejs.org) and [Vite](https://vite.dev). No backend: courses save to the browser's local storage and can be exported or imported as JSON.

## Run it locally

You need Node.js 20.19 or newer.

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Build for production

```bash
npm run build      # outputs a static site to dist/
npm run preview    # serves dist/ locally to check it
```

`dist/` is plain HTML, JS and CSS, so any static host works.

## Deploy

**Vercel**
1. Push this folder to a GitHub repo.
2. In Vercel, choose Add New Project and import the repo.
3. It detects Vite automatically (build `npm run build`, output `dist`). Deploy.

**Netlify**
1. Push to GitHub and choose Add new site, then Import an existing project.
2. Build command `npm run build`, publish directory `dist`. Deploy.

Or with no Git at all: run `npm run build` and drag the `dist` folder onto https://app.netlify.com/drop.

**GitHub Pages**
Project pages live under a sub-path (`https://you.github.io/repo-name/`), so set the base in `vite.config.js` first:

```js
export default defineConfig({ base: '/repo-name/', /* ... */ });
```

Then build and publish `dist/` with GitHub Actions or the `gh-pages` package.

## Controls

**Build mode**
| Action | Input |
| --- | --- |
| Orbit / pan / zoom | drag / right-drag / wheel |
| Select, then move | click, then drag |
| Raise or lower selection | Q / E |
| Turn 90° | R |
| Duplicate / delete | Ctrl D / Del |
| Tools: select, place, paint, erase | V / B / P / X |
| Undo / redo | Ctrl Z / Ctrl Shift Z |
| Frame course or focus selection | F |

**Play mode**: WASD move, Space jump (hold for height), Shift dash (one air dash per jump), drag to look, R restart from checkpoint, Esc back to build. On touch screens you get a joystick plus Jump and Dash buttons.

## Project structure

```
index.html          app shell and markup
src/
  main.js           entry: render loop and startup
  style.css         all styling, light and dark themes
  util.js           DOM helpers, math, seeded random
  textures.js       procedural canvas textures (grass, cobble, brick...)
  materials.js      material cache and mesh helpers
  characters.js     blocky character rig, 12 presets, walk/run animation
  entities.js       every placeable kind: how it's built, its collider, the Store catalog
  world.js          course data: the default course, load and validate
  looks.js          lighting presets (Soft, Cinematic, Toon, Night...)
  scene.js          renderer, lights, island, adding and removing entities
  history.js        undo/redo and autosave
  camera.js         orbit camera for build mode, framing
  thumbs.js         offscreen renders for Store and palette thumbnails
  editor.js         tool state, selection, raycast picking and placement
  toolcard.js       floating card for the active tool
  panel.js          right panel tabs: Page, Look, Character, Console
  store.js          full-screen asset Store
  input.js          mouse, touch and keyboard for the editor
  play.js           player physics, collisions, triggers, touch controls
  menu.js           course menu, import/export, button wiring
  ui.js             toasts, console log, HUD
public/favicon.svg
```

### Adding a new kind of thing

1. In `src/entities.js`, add a builder to `BUILD` that returns a `THREE.Group` with its base at y = 0.
2. If the player should be able to stand on it, add its size to `SOLID`.
3. Add an entry to `CATALOG` so it appears in the Store, and a name to `KIND`.
4. For behavior (like the jump pad or coin), handle the kind in `updatePlay` in `src/play.js`.

### Course file format

Exported courses are JSON:

```json
{
  "v": 1,
  "title": "Clay Peaks",
  "look": "soft",
  "tune": { "jump": 3.2, "apex": 0.38, "run": 7 },
  "character": { "preset": "knight", "height": 1.8, "prop": "heroic", "colors": {} },
  "entities": [
    { "id": 2, "kind": "block", "x": 0, "y": 0, "z": 8.5, "ry": 0, "w": 2, "h": 1, "d": 2, "tex": "cobble" }
  ]
}
```

Positions are the center of each object's bottom face, in meters, with y up. The island top is y = 0 and spans -18 to 18 on x and z.
