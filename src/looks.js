/* ---------------- Looks ---------------- */
export const LOOKS = {
  soft:{name:'Soft', desc:'Gentle sky light and soft shadows. The default.', sw:['#dfe6ec','#7cc04a','#e8572d'],
    bg:'#dfe6ec', fog:[70,170], hs:'#ffffff', hg:'#6f8f55', hi:1.15, sun:'#fff3e2', si:2.5, sp:[18,32,14], exp:1, filter:'', vig:0, glow:1, mode:'std'},
  blockout:{name:'Blockout', desc:'Flat grey shapes for judging layout. No textures, no colour.', sw:['#e6e6e6','#cfcfcf','#9b9b9b'],
    bg:'#e8e8e8', fog:[80,200], hs:'#ffffff', hg:'#9a9a9a', hi:1.2, sun:'#ffffff', si:2.2, sp:[18,32,14], exp:1, filter:'', vig:0, glow:0, mode:'grey'},
  cinematic:{name:'Cinematic', desc:'Low golden sun, longer shadows, deeper contrast.', sw:['#e7c39c','#5f7f3a','#ff8a3d'],
    bg:'#e5bf98', fog:[40,140], hs:'#ffe2c0', hg:'#4a5a3a', hi:.75, sun:'#ffb36b', si:3.4, sp:[-30,13,-6], exp:1.05, filter:'contrast(1.12) saturate(1.08)', vig:1, glow:1, mode:'std'},
  toon:{name:'Toon', desc:'Banded cel shading with crisp light steps.', sw:['#cfe7f6','#79d14a','#ff6a3d'],
    bg:'#cfe7f6', fog:[80,200], hs:'#ffffff', hg:'#8fb06a', hi:1, sun:'#ffffff', si:2.8, sp:[16,30,18], exp:1, filter:'saturate(1.15)', vig:0, glow:1, mode:'toon'},
  night:{name:'Night', desc:'Moonlit blue. Lanterns, coins and crystals glow.', sw:['#0e1626','#2b4a3a','#ffcf7a'],
    bg:'#0e1626', fog:[25,95], hs:'#5470a8', hg:'#0b1020', hi:.38, sun:'#9db4ff', si:.55, sp:[-12,30,10], exp:1.1, filter:'saturate(1.05)', vig:.6, glow:6, mode:'std', lights:true},
  vivid:{name:'Vivid', desc:'Saturated toy-box colour under a bright sky.', sw:['#a9dcff','#5bd12e','#ff4d2e'],
    bg:'#a9dcff', fog:[90,220], hs:'#ffffff', hg:'#5aa02c', hi:1.35, sun:'#fffaf0', si:2.9, sp:[14,34,16], exp:1.02, filter:'saturate(1.45) contrast(1.05)', vig:0, glow:1.3, mode:'std'},
};
