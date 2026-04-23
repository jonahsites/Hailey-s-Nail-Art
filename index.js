import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { HDRLoader } from 'three/examples/jsm/loaders/HDRLoader.js';

// ─────────────────────────────────────────
// CONFIG
// ─────────────────────────────────────────
const cameraKeyframes = [
  { scroll: 0.0,   cam: { x: 4,    y: 1.8, z: 4    }, target: { x: -0.1, y: -0.1, z: 0   }, fov: 15, distance: 1.06 },
  { scroll: 0.125, cam: { x: 1.5,  y: 1.2, z: 0.9  }, target: { x: 0,    y: 0,    z: 0   }, fov: 40, distance: 1.64 },
  { scroll: 0.25,  cam: { x: -2.6, y: 0.9, z: -3.5 }, target: { x: 0.2,  y: 0.4,  z: 0.4 }, fov: 68, distance: 0.23 },
  { scroll: 0.5,   cam: { x: -3.5, y: 1.5, z: -1.5 }, target: { x: 0,    y: 0.4,  z: 0   }, fov: 36, distance: 0.57 },
  { scroll: 0.75,  cam: { x: 0.5,  y: 2.0, z: -3.5 }, target: { x: 0,    y: 0.3,  z: 0   }, fov: 34, distance: 1.0  },
  { scroll: 1.0,   cam: { x: 3,    y: 1.5, z: -2.5 }, target: { x: 0,    y: 0.8,  z: 0   }, fov: 16, distance: 1.91 },
];

const settings = {
  object: { x: 0, y: 0, z: 0, rotX: 0, rotY: 0, rotZ: 0, scale: 1 },
  env: { ambientIntensity: 0.8, dirIntensity: 2.5, fillIntensity: 1.0, rimIntensity: 1.2, exposure: 1.6, envIntensity: 1.4, bgBlur: 0.3 },
};

const hdrEnvironments = [
  { name: 'Studio Small',         url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr' },
  { name: 'Metro Noord',          url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/metro_noord_1k.hdr' },
  { name: 'Industrial Sunset',    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/industrial_sunset_puresky_1k.hdr' },
  { name: 'Kloofendal Cloudy',    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/kloofendal_48d_partly_cloudy_puresky_1k.hdr' },
  { name: 'Rosendal Plains',      url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/rosendal_plains_2_1k.hdr' },
  { name: 'Sunset Fairway',       url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/sunset_fairway_1k.hdr' },
  { name: 'Royal Esplanade',      url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/royal_esplanade_1k.hdr' },
  { name: 'Quarry',               url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/quarry_04_1k.hdr' },
  { name: 'Abandoned Parking',    url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/abandoned_parking_1k.hdr' },
  { name: 'Moonlit Golf',         url: 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/moonlit_golf_1k.hdr' },
];

let currentHdrIndex = 2;
let showHdrBg = false;
const hdrCache = {};

// ── Scene ──
const scene = new THREE.Scene();
scene.background = new THREE.Color('#ffffff');
scene.fog = new THREE.FogExp2('#ffffff', 0.015);

const camera = new THREE.PerspectiveCamera(cameraKeyframes[0].fov, window.innerWidth / window.innerHeight, 0.1, 200);
camera.position.set(cameraKeyframes[0].cam.x, cameraKeyframes[0].cam.y, cameraKeyframes[0].cam.z);
camera.name = 'mainCamera';

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.shadowMap.autoUpdate = false;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.6;
renderer.outputColorSpace = THREE.SRGBColorSpace;
document.getElementById('canvas-wrapper').appendChild(renderer.domElement);

// Dirty flag system — skip render when nothing changes
let needsRender = true;
let shadowDirtyFrames = 0;
function markDirty(shadowToo) { needsRender = true; if (shadowToo) shadowDirtyFrames = 3; }

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

let hdrLoadCount = 0;
function loadHDR(index) {
  if (index < 0 || index >= hdrEnvironments.length) return;
  currentHdrIndex = index;
  const entry = hdrEnvironments[index];
  const statusEl = document.getElementById('hdr-status');
  if (statusEl) { statusEl.textContent = 'Loading…'; statusEl.style.color = '#997'; }
  if (hdrCache[entry.url]) {
    applyEnvMap(hdrCache[entry.url]);
    if (statusEl) { statusEl.textContent = entry.name; statusEl.style.color = '#6a6'; }
    markDirty(true);
    return;
  }
  const hdrLoader = new HDRLoader();
  hdrLoader.load(entry.url, (hdrTexture) => {
    const envMap = pmremGenerator.fromEquirectangular(hdrTexture).texture;
    hdrTexture.dispose();
    hdrCache[entry.url] = envMap;
    hdrLoadCount++;
    // Dispose PMREM after all environments are cached
    if (hdrLoadCount >= hdrEnvironments.length) { pmremGenerator.dispose(); }
    applyEnvMap(envMap);
    if (statusEl) { statusEl.textContent = entry.name; statusEl.style.color = '#6a6'; }
    markDirty(true);
  }, undefined, (err) => {
    console.error('HDR load error:', err);
    if (statusEl) { statusEl.textContent = 'Load failed'; statusEl.style.color = '#a66'; }
  });
}

function applyEnvMap(envMap) {
  scene.environment = envMap;
  scene.environmentIntensity = settings.env.envIntensity;
  if (showHdrBg) {
    scene.background = envMap;
    scene.backgroundBlurriness = settings.env.bgBlur;
  } else {
    scene.background = new THREE.Color('#ffffff');
    scene.backgroundBlurriness = 0;
  }
  markDirty(true);
}

// ── Lights ──
const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
ambientLight.name = 'ambientLight'; scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, settings.env.dirIntensity);
dirLight.position.set(6, 12, 8);
dirLight.target.position.set(0, 0, 0);
dirLight.castShadow = true;
dirLight.shadow.mapSize.set(2048, 2048);
// Tight frustum around car — car is ~3 units wide/long after scaling
// Keep bounds just large enough to avoid clipping shadow edges
dirLight.shadow.camera.near = 0.1;
dirLight.shadow.camera.far = 80;
dirLight.shadow.camera.left   = -8;
dirLight.shadow.camera.right  =  8;
dirLight.shadow.camera.top    =  8;
dirLight.shadow.camera.bottom = -8;
dirLight.shadow.bias = -0.0003;
dirLight.shadow.normalBias = 0.02;
dirLight.name = 'dirLight';
scene.add(dirLight);
scene.add(dirLight.target);

const fillLight = new THREE.DirectionalLight(0xf0f4ff, settings.env.fillIntensity);
fillLight.position.set(-4, 3, -3); fillLight.name = 'fillLight'; scene.add(fillLight);

const rimLight = new THREE.DirectionalLight(0xffffff, settings.env.rimIntensity);
rimLight.position.set(0, 4, -6); rimLight.name = 'rimLight'; scene.add(rimLight);

// ── Ground ──
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, metalness: 0.0 });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2; ground.position.y = -0.01;
ground.receiveShadow = true; ground.name = 'groundPlane';
scene.add(ground);

// ── Model & Anim ──
let model = null;
let mixer = null;
let groundShadowMesh = null;
let groundShadowUniforms = null;
let animDuration = 0;
let allClips = [];
let scrollClip = null;
let isManualPlaying = false;
let manualPlayClock = new THREE.Clock(false);

// ── Batch material groups ──
const materialGroups = {
  'Primary Surface':   { keywords: ['body','exterior','shell','main','surface','base','bottle','polish','liquid'], color: '#f8f8f8', mats: [] },
  'Metallic Detail':   { keywords: ['metal','chrome','rim','accents','silver','trim','cap','lid'], color: '#d1d1d1', mats: [] },
  'Structural Element': { keywords: ['frame','pillar','base','support','stand'], color: '#1a1a1a', mats: [] },
  'Translucent':       { keywords: ['glass','window','visor','clear','optics','bottle_glass'], color: '#ffffff', mats: [] },
  'Ungrouped':         { keywords: [], color: '#888888', mats: [] },
};

function classifyMaterial(matName) {
  const lower = (matName || '').toLowerCase();
  for (const [groupName, group] of Object.entries(materialGroups)) {
    if (groupName === 'Ungrouped') continue;
    if (group.keywords.some(kw => lower.includes(kw))) return groupName;
  }
  return 'Ungrouped';
}

// Surface-related keywords that get the expensive Physical material
const bodyKeywords = ['main','surface','base','exterior','shell'];

function upgradeToPhysical(mesh, oldMat) {
  if (!oldMat || !oldMat.color) return null;
  const matName = (oldMat.name || '').toLowerCase();
  const isBody = bodyKeywords.some(kw => matName.includes(kw));

  // Use cheaper MeshStandardMaterial for non-body parts
  const phys = isBody ? new THREE.MeshPhysicalMaterial() : new THREE.MeshStandardMaterial();
  phys.color.copy(oldMat.color);
  phys.roughness = oldMat.roughness ?? 0.5;
  phys.metalness = oldMat.metalness ?? 0.0;
  if (oldMat.map) phys.map = oldMat.map;
  if (oldMat.normalMap) phys.normalMap = oldMat.normalMap;
  if (oldMat.roughnessMap) phys.roughnessMap = oldMat.roughnessMap;
  if (oldMat.metalnessMap) phys.metalnessMap = oldMat.metalnessMap;
  if (oldMat.emissiveMap) phys.emissiveMap = oldMat.emissiveMap;
  if (oldMat.emissive) phys.emissive.copy(oldMat.emissive);
  phys.emissiveIntensity = oldMat.emissiveIntensity ?? 0;
  phys.opacity = oldMat.opacity ?? 1;
  phys.transparent = oldMat.transparent ?? false;
  phys.side = oldMat.side ?? THREE.FrontSide;
  phys.name = oldMat.name;
  phys.envMapIntensity = oldMat.envMapIntensity ?? 1;
  if (isBody) {
    phys.clearcoat = 0; phys.clearcoatRoughness = 0.1;
    phys.sheen = 0; phys.ior = 1.5; phys.transmission = 0; phys.thickness = 0;
  }
  return phys;
}

function collectAndUpgradeMaterials(obj) {
  Object.values(materialGroups).forEach(g => g.mats = []);
  const seen = new Map();
  obj.traverse(ch => {
    if (!ch.isMesh) return;
    // Skip the ground shadow mesh — it has a custom ShaderMaterial
    const isGroundShadow = ch.name && (
      ch.name.toLowerCase().includes('ground_shadow') ||
      ch.name.includes('FC0004') ||
      ch.name.includes('Material008')
    );
    if (isGroundShadow) return;

    const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
    const upgraded = mats.map(m => {
      if (!m) return m;
      if (seen.has(m.uuid)) return seen.get(m.uuid);
      // Skip ShaderMaterials or materials without .color
      if (m.isShaderMaterial || !m.color) {
        seen.set(m.uuid, m);
        return m;
      }
      let physMat = m.isMeshPhysicalMaterial ? m : upgradeToPhysical(ch, m);
      if (!physMat) { seen.set(m.uuid, m); return m; }
      seen.set(m.uuid, physMat);
      return physMat;
    });
    ch.material = Array.isArray(ch.material) ? upgraded : upgraded[0];
  });
  seen.forEach((physMat) => {
    // Only classify materials that have a color (Physical/Standard)
    if (physMat && physMat.color) {
      const group = classifyMaterial(physMat.name);
      materialGroups[group].mats.push(physMat);
    }
  });
}

// ── Animation helpers ──
// We use a completely different approach: create a SECOND mixer just for scrubbing
// so that we can call mixer.setTime() without interfering with anything else.
let scrubMixer = null;
let lastScrubTime = -1;

function setupScrollAnimation(clips) {
  if (!model || clips.length === 0) return;
  animDuration = 0; scrollClip = null;

  const found = clips.find(c => c.name && c.name.toLowerCase().includes('allaction'));
  scrollClip = found || clips.reduce((a, b) => a.duration >= b.duration ? a : b, clips[0]);
  animDuration = scrollClip.duration;
  console.log(`[Anim] Setup scroll clip: "${scrollClip.name}" duration=${animDuration.toFixed(3)}s tracks=${scrollClip.tracks.length}`);

  // Create a dedicated scrub mixer
  scrubMixer = new THREE.AnimationMixer(model);
  const action = scrubMixer.clipAction(scrollClip);
  action.play();
  // Immediately seek to time 0 so the pose is applied
  scrubMixer.setTime(0);
  lastScrubTime = 0;
}

function playClipManually(clip) {
  if (!model) return;
  // Use the main mixer for manual playback
  if (mixer) { mixer.stopAllAction(); mixer.uncacheRoot(model); }
  mixer = new THREE.AnimationMixer(model);
  isManualPlaying = true;
  manualPlayClock = new THREE.Clock(true);
  const action = mixer.clipAction(clip);
  action.reset(); action.play(); action.paused = false;
  action.enabled = true; action.setEffectiveWeight(1);
  action.setEffectiveTimeScale(1); action.setLoop(THREE.LoopOnce);
  action.clampWhenFinished = true;
  mixer.addEventListener('finished', function onDone(e) {
    if (e.action === action) {
      mixer.removeEventListener('finished', onDone);
      isManualPlaying = false;
      // Rebuild scrub mixer
      setupScrollAnimation(allClips);
    }
  });
}

window._debugAnim = () => {
  console.log('scrubMixer:', !!scrubMixer, 'scrollClip:', scrollClip?.name, 'duration:', animDuration, 'isManual:', isManualPlaying);
  console.log('smoothScroll:', smoothScroll.toFixed(3), 'lastScrubTime:', lastScrubTime?.toFixed(3));
};

// ─────────────────────────────────────────
// COLOR CONFIGURATOR (in-page section)
// ─────────────────────────────────────────
const bodyColors = [
  { name: 'Studio White', color: '#f8f8f8' },
  { name: 'Obsidian',     color: '#0a0a0a' },
  { name: 'Marble Grey',  color: '#d1d1d1' },
];

let currentBodyColor = '#f8f8f8';
let selectedColorIdx = 0;

function applyToGroup(groupName, fn) {
  if (materialGroups[groupName]) {
    materialGroups[groupName].mats.forEach(m => { fn(m); m.needsUpdate = true; });
  }
}

function setBodyColor(hex) {
  currentBodyColor = hex;
  applyToGroup('Red Surface', m => m.color.set(hex));
  markDirty(false);
}

// Body finish: 0 = full matte, 100 = high gloss
function setBodyFinish(val) {
  const t = val / 100; // 0..1
  // Roughness: 1.0 (matte) → 0.15 (gloss)
  const roughness = 1.0 - t * 0.85;
  // Metalness: 0.0 → 0.6
  const metalness = t * 0.6;
  // Clearcoat: 0 → 1
  const clearcoat = t;
  // Clearcoat roughness: 0.5 → 0.05
  const ccRoughness = 0.5 - t * 0.45;

  applyToGroup('Red Surface', m => {
    m.roughness = roughness;
    m.metalness = metalness;
    if (m.clearcoat !== undefined) {
      m.clearcoat = clearcoat;
      m.clearcoatRoughness = ccRoughness;
    }
  });
  markDirty(false);
}

// Build the in-page color swatches
function buildCustomizeSection() {
  const container = document.getElementById('cust-colors');
  if (!container) return;
  container.innerHTML = '';
  bodyColors.forEach((preset, idx) => {
    const el = document.createElement('div');
    el.className = 'cust-color' + (idx === selectedColorIdx ? ' active' : '');
    el.innerHTML = `
      <div class="cust-color-swatch" style="background:${preset.color}"></div>
      <div class="cust-color-name">${preset.name}</div>
    `;
    el.addEventListener('click', () => {
      selectedColorIdx = idx;
      setBodyColor(preset.color);
      container.querySelectorAll('.cust-color').forEach((p, i) => p.classList.toggle('active', i === idx));
    });
    container.appendChild(el);
  });
}

// Finish slider
const finishSlider = document.getElementById('finish-slider');
const finishVal = document.getElementById('finish-val');
if (finishSlider) {
  finishSlider.addEventListener('input', () => {
    const v = parseInt(finishSlider.value);
    if (finishVal) finishVal.textContent = v;
    setBodyFinish(v);
  });
}

// ── Nav scroll behavior ──
const topNav = document.getElementById('top-nav');
const navLinks = document.querySelectorAll('.nav-links a');

navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

document.getElementById('hamburger')?.addEventListener('click', () => {
  document.getElementById('nav-links')?.classList.toggle('mobile-open');
});

// ── Load model ──
const MODEL_URL = 'https://dl.dropboxusercontent.com/scl/fi/794rgnaz38r0onl73f71i/bottle_of_red_nail_polish.glb?rlkey=qjg110cx830pcos1cn2dsrkkc&st=xukhsj26&raw=1';

{
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
  const loader = new GLTFLoader();
  loader.setDRACOLoader(dracoLoader);
  loader.load(MODEL_URL, (gltf) => {
    model = gltf.scene;
    model.name = 'loadedModel';

    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    if (maxDim > 0) {
      const s = 1.1 / maxDim;
      model.scale.setScalar(s);
      settings.object.scale = parseFloat(s.toFixed(3));
    }
    box.setFromObject(model);
    box.getCenter(center);
    model.position.x = -center.x;
    model.position.z = -center.z;
    const newBox = new THREE.Box3().setFromObject(model);
    model.position.y = -newBox.min.y;

    settings.object.x = parseFloat(model.position.x.toFixed(3));
    settings.object.y = parseFloat(model.position.y.toFixed(3));
    settings.object.z = parseFloat(model.position.z.toFixed(3));

    // Log all mesh names for debugging
    console.log('[Model] All mesh names:');
    model.traverse(ch => {
      if (ch.isMesh) console.log('  -', ch.name, '| mat:', Array.isArray(ch.material) ? ch.material.map(m=>m.name).join(', ') : ch.material?.name);
    });

    // Selective shadow casting — only large body meshes cast
    const shadowCastKeywords = ['body','door','hood','fender','roof','trunk','bumper','chassis','shell','quarter'];
    model.traverse(ch => {
      if (ch.isMesh) {
        const meshName = (ch.name || '').toLowerCase();
        ch.castShadow = shadowCastKeywords.some(kw => meshName.includes(kw));
        ch.receiveShadow = true;
        // Precompute bounding spheres for frustum culling
        if (ch.geometry && !ch.geometry.boundingSphere) ch.geometry.computeBoundingSphere();

        // Fade the baked ground shadow at its edges
        const isGroundShadow = ch.name && (
          ch.name.toLowerCase().includes('ground_shadow') ||
          ch.name.includes('FC0004') ||
          ch.name.includes('Material008')
        );

        if (isGroundShadow) {
          console.log('[Shadow] Found ground shadow mesh:', ch.name);
          ch.castShadow = false;
          ch.receiveShadow = false;
          groundShadowMesh = ch;

          const oldMat = Array.isArray(ch.material) ? ch.material[0] : ch.material;
          const shadowTexture = oldMat.map || null;
          const hasAlphaMap = !!oldMat.alphaMap;
          const oldColor = oldMat.color ? oldMat.color.clone() : new THREE.Color(0x000000);
          const oldOpacity = oldMat.opacity !== undefined ? oldMat.opacity : 1.0;

          console.log('[Shadow] Texture:', !!shadowTexture, 'AlphaMap:', hasAlphaMap, 'Opacity:', oldOpacity, 'Color:', '#' + oldColor.getHexString());

          // Compute bounding box of geometry in local space to get proper center
          const geo = ch.geometry;
          if (geo) {
            geo.computeBoundingBox();
            const bbox = geo.boundingBox;
            const center = new THREE.Vector3();
            const size = new THREE.Vector3();
            bbox.getCenter(center);
            bbox.getSize(size);

            const shadowShaderMat = new THREE.ShaderMaterial({
              uniforms: {
                uMap: { value: shadowTexture },
                uAlphaMap: { value: oldMat.alphaMap || null },
                uOpacity: { value: oldOpacity },
                uFadeStart: { value: 0.35 },
                uFadeEnd: { value: 0.95 },
                uFadePower: { value: 1.5 },
                uColor: { value: oldColor },
                uCenter: { value: new THREE.Vector2(center.x, center.z) },
                uSize: { value: new THREE.Vector2(size.x * 0.5, size.z * 0.5) },
              },
              vertexShader: `
                varying vec2 vUv;
                varying vec3 vLocalPos;
                void main() {
                  vUv = uv;
                  vLocalPos = position;
                  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
              `,
              fragmentShader: `
                uniform sampler2D uMap;
                uniform sampler2D uAlphaMap;
                uniform float uOpacity;
                uniform float uFadeStart;
                uniform float uFadeEnd;
                uniform float uFadePower;
                uniform vec3 uColor;
                uniform vec2 uCenter;
                uniform vec2 uSize;
                varying vec2 vUv;
                varying vec3 vLocalPos;

                void main() {
                  // Sample the original texture
                  vec4 texColor = texture2D(uMap, vUv);

                  // If texture is mostly empty, use color
                  vec3 finalColor = texColor.rgb;
                  float finalAlpha = texColor.a;

                  // Also check alpha map if present
                  #ifdef HAS_ALPHA_MAP
                    float alphaVal = texture2D(uAlphaMap, vUv).r;
                    finalAlpha *= alphaVal;
                  #endif

                  // Radial fade based on local position from mesh center
                  vec2 offset = (vLocalPos.xz - uCenter) / max(uSize, vec2(0.001));
                  float dist = length(offset);

                  float fade = 1.0 - smoothstep(uFadeStart, uFadeEnd, dist);
                  fade = pow(clamp(fade, 0.0, 1.0), uFadePower);

                  gl_FragColor = vec4(finalColor, finalAlpha * fade * uOpacity);
                }
              `,
              transparent: true,
              depthWrite: false,
              side: THREE.DoubleSide,
            });

            // Set defines based on available maps
            shadowShaderMat.defines = {};
            if (shadowTexture) {
              shadowShaderMat.defines.HAS_MAP = '';
            }
            if (hasAlphaMap) {
              shadowShaderMat.defines.HAS_ALPHA_MAP = '';
            }

            groundShadowUniforms = shadowShaderMat.uniforms;
            ch.material = shadowShaderMat;
            ch.renderOrder = -1;

            console.log('[Shadow] Applied fade shader. BBox center:', center.toArray(), 'size:', size.toArray());
          }
        }
      }
    });
    scene.add(model);
    markDirty(true);

    collectAndUpgradeMaterials(model);

    // Force specific materials to black: #27 "chrome" and #1 "metal_1"
    const blackTargets = ['chrome', 'metal_1'];
    model.traverse(ch => {
      if (!ch.isMesh) return;
      const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
      mats.forEach(m => {
        if (!m || !m.color) return;
        const matName = (m.name || '').toLowerCase().trim();
        if (blackTargets.some(t => matName === t)) {
          console.log(`[Mat Override] Forcing "${m.name}" to black on mesh "${ch.name}"`);
          m.color.set('#0a0a0a');
          m.roughness = 0.25;
          m.metalness = 0.85;
          m.clearcoat = 0.3;
          m.clearcoatRoughness = 0.1;
          m.needsUpdate = true;
        }
      });
    });

    buildCustomizeSection();

    // Apply default finish
    setBodyFinish(50);

    allClips = gltf.animations || [];
    if (allClips.length > 0) {
      mixer = new THREE.AnimationMixer(model);
      setupScrollAnimation(allClips);
      console.log(`[Anim] Found ${allClips.length} clip(s). Scroll clip: "${scrollClip?.name}" duration: ${animDuration.toFixed(2)}s`);
    } else {
      console.log('[Anim] No animation clips found in model');
    }
    buildMaterialUI();
    buildAnimationUI();
    loadHDR(2);
  }, (xhr) => {
    if (xhr.total) console.log(`[Model] Loading: ${(xhr.loaded/xhr.total*100).toFixed(0)}%`);
  }, (err) => {
    console.error('Model load error:', err);
  });
}

// ── Scroll tracking (RAF-batched) ──
let scrollProgress = 0;
let smoothScroll = 0;
let scrollRafPending = false;
let prevScrollProgress = -1;

const sections = document.querySelectorAll('.content-section, .cta-section, .customize-section');
const heroSection = document.getElementById('sec-hero');
const navDots = document.querySelectorAll('.nav-dot');
const canvasWrapper = document.getElementById('canvas-wrapper');
const siteFooter = document.querySelector('.site-footer');

// Cache previous DOM states to avoid redundant classList toggles
let prevHeroFaded = false;
let prevActiveNavDot = -1;
let prevNavScrolled = false;
const prevSectionVisible = new Array(sections.length).fill(false);
const prevLinkActive = new Array(navLinks.length).fill(false);
let prevFooterTransform = '';

function onScroll() {
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  scrollProgress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;

  if (!scrollRafPending) {
    scrollRafPending = true;
    requestAnimationFrame(updateDOMFromScroll);
  }
  markDirty(false);
}

function updateDOMFromScroll() {
  scrollRafPending = false;
  const scrollTop = window.scrollY;
  const winH = window.innerHeight;

  // Hero fade
  const heroFaded = scrollTop > winH * 0.4;
  if (heroFaded !== prevHeroFaded) {
    prevHeroFaded = heroFaded;
    if (heroSection) heroSection.classList.toggle('faded', heroFaded);
  }

  // Section visibility
  for (let i = 0; i < sections.length; i++) {
    const rect = sections[i].getBoundingClientRect();
    const inView = rect.top < winH * 0.75 && rect.bottom > winH * 0.25;
    if (inView !== prevSectionVisible[i]) {
      prevSectionVisible[i] = inView;
      sections[i].classList.toggle('visible', inView);
    }
  }

  // Nav dots
  const sectionCount = navDots.length;
  const activeIdx = Math.min(Math.floor(scrollProgress * sectionCount), sectionCount - 1);
  if (activeIdx !== prevActiveNavDot) {
    if (prevActiveNavDot >= 0) navDots[prevActiveNavDot]?.classList.remove('active');
    navDots[activeIdx]?.classList.add('active');
    prevActiveNavDot = activeIdx;
  }

  // Nav links
  for (let i = 0; i < navLinks.length; i++) {
    const href = navLinks[i].getAttribute('href');
    const el = document.querySelector(href);
    if (el) {
      const rect = el.getBoundingClientRect();
      const active = rect.top < winH * 0.5 && rect.bottom > winH * 0.3;
      if (active !== prevLinkActive[i]) {
        prevLinkActive[i] = active;
        navLinks[i].classList.toggle('active', active);
      }
    }
  }

  // Top nav scrolled state
  const navScrolled = scrollTop > 20;
  if (navScrolled !== prevNavScrolled) {
    prevNavScrolled = navScrolled;
    topNav?.classList.toggle('scrolled', navScrolled);
  }

  // Footer push
  if (canvasWrapper && siteFooter) {
    const footerRect = siteFooter.getBoundingClientRect();
    let transform = 'translateY(0)';
    if (footerRect.top < winH) {
      const overlap = winH - footerRect.top;
      transform = `translateY(-${overlap}px)`;
    }
    if (transform !== prevFooterTransform) {
      prevFooterTransform = transform;
      canvasWrapper.style.transform = transform;
    }
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();

navDots.forEach(dot => {
  dot.addEventListener('click', () => {
    const idx = parseInt(dot.dataset.index);
    const totalH = document.documentElement.scrollHeight - window.innerHeight;
    const targetScroll = (idx / (navDots.length - 1)) * totalH;
    window.scrollTo({ top: targetScroll, behavior: 'smooth' });
  });
});

// ── Interpolation ──
function lerp(a, b, t) { return a + (b - a) * t; }

function getInterpolatedCamera(progress) {
  let i = 0;
  for (let k = 0; k < cameraKeyframes.length - 1; k++) {
    if (progress >= cameraKeyframes[k].scroll && progress <= cameraKeyframes[k + 1].scroll) { i = k; break; }
    if (k === cameraKeyframes.length - 2) i = k;
  }
  const kf0 = cameraKeyframes[i];
  const kf1 = cameraKeyframes[i + 1];
  const range = kf1.scroll - kf0.scroll;
  const localT = range > 0 ? (progress - kf0.scroll) / range : 0;
  const t = localT * localT * (3 - 2 * localT);

  const interpTarget = {
    x: lerp(kf0.target.x, kf1.target.x, t),
    y: lerp(kf0.target.y, kf1.target.y, t),
    z: lerp(kf0.target.z, kf1.target.z, t),
  };
  const baseCam = {
    x: lerp(kf0.cam.x, kf1.cam.x, t),
    y: lerp(kf0.cam.y, kf1.cam.y, t),
    z: lerp(kf0.cam.z, kf1.cam.z, t),
  };
  const dist = lerp(kf0.distance, kf1.distance, t);
  const dx = baseCam.x - interpTarget.x;
  const dy = baseCam.y - interpTarget.y;
  const dz = baseCam.z - interpTarget.z;
  const cam = {
    x: interpTarget.x + dx * dist,
    y: interpTarget.y + dy * dist,
    z: interpTarget.z + dz * dist,
  };
  const fov = lerp(kf0.fov, kf1.fov, t);
  return { cam, target: interpTarget, fov };
}

function jumpToSection(kfIndex) {
  const totalH = document.documentElement.scrollHeight - window.innerHeight;
  const targetScroll = cameraKeyframes[kfIndex].scroll * totalH;
  window.scrollTo({ top: targetScroll, behavior: 'smooth' });
}

// ── Hint ──
const hint = document.getElementById('hint');
setTimeout(() => { if (hint) { hint.style.opacity = '0'; setTimeout(() => hint.remove(), 500); } }, 5000);

// ─────────────────────────────────────────
// SETTINGS PANEL (press S)
// ─────────────────────────────────────────
let panelVisible = false;
const panel = document.createElement('div');
panel.id = 'settingsPanel';
panel.style.cssText = `
  position:fixed;top:70px;right:10px;width:380px;max-height:calc(100vh - 80px);
  background:rgba(255,255,255,0.95);border:1px solid rgba(0,0,0,0.08);
  border-radius:10px;padding:16px;font-family:'Inter',sans-serif;font-size:12px;
  color:#333;display:none;overflow-y:auto;z-index:2000;backdrop-filter:blur(16px);
  box-sizing:border-box;user-select:none;pointer-events:auto;
  box-shadow:0 8px 32px rgba(0,0,0,0.08);
`;

function createSection(title, startCollapsed) {
  const sec = document.createElement('div');
  sec.style.marginBottom = '14px';
  const h = document.createElement('div');
  h.style.cssText = 'font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:1px;color:#999;margin-bottom:8px;cursor:pointer;display:flex;align-items:center;gap:6px;border-bottom:1px solid rgba(0,0,0,0.05);padding-bottom:6px;';
  const arrow = document.createElement('span');
  arrow.style.cssText = 'font-size:9px;transition:transform 0.2s;';
  const label = document.createElement('span');
  label.textContent = title;
  h.append(arrow, label);
  const body = document.createElement('div');
  body.style.cssText = 'overflow:hidden;padding-top:4px;';
  let collapsed = startCollapsed || false;
  arrow.textContent = collapsed ? '▸' : '▾';
  body.style.display = collapsed ? 'none' : 'block';
  h.addEventListener('click', () => {
    collapsed = !collapsed;
    body.style.display = collapsed ? 'none' : 'block';
    arrow.textContent = collapsed ? '▸' : '▾';
  });
  sec.appendChild(h); sec.appendChild(body);
  return { sec, body };
}

function createSlider(label, min, max, step, value, onChange) {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;margin-bottom:5px;gap:8px;';
  const lbl = document.createElement('span');
  lbl.textContent = label;
  lbl.style.cssText = 'width:80px;flex-shrink:0;font-size:11px;color:#888;';
  const slider = document.createElement('input');
  slider.type = 'range'; slider.min = min; slider.max = max; slider.step = step; slider.value = value;
  slider.style.cssText = 'flex:1;accent-color:#888;height:3px;cursor:pointer;';
  const val = document.createElement('span');
  val.textContent = parseFloat(value).toFixed(step < 0.1 ? 2 : 1);
  val.style.cssText = 'width:48px;text-align:right;font-size:11px;color:#999;font-variant-numeric:tabular-nums;';
  slider.addEventListener('input', () => {
    val.textContent = parseFloat(slider.value).toFixed(step < 0.1 ? 2 : 1);
    onChange(parseFloat(slider.value));
  });
  row.append(lbl, slider, val);
  return { row, slider, val };
}

function createColorPicker(label, value, onChange) {
  const row = document.createElement('div');
  row.style.cssText = 'display:flex;align-items:center;margin-bottom:5px;gap:8px;';
  const lbl = document.createElement('span');
  lbl.textContent = label; lbl.style.cssText = 'width:80px;flex-shrink:0;font-size:11px;color:#888;';
  const picker = document.createElement('input');
  picker.type = 'color'; picker.value = value;
  picker.style.cssText = 'width:36px;height:20px;border:1px solid rgba(0,0,0,0.1);background:transparent;cursor:pointer;border-radius:3px;padding:0;';
  const hex = document.createElement('span');
  hex.textContent = value;
  hex.style.cssText = 'font-size:11px;color:#999;font-family:monospace;';
  picker.addEventListener('input', () => {
    hex.textContent = picker.value; onChange(picker.value);
  });
  row.append(lbl, picker, hex);
  return { row, picker, hex };
}

function createSmallBtn(text, onClick) {
  const btn = document.createElement('button');
  btn.textContent = text;
  btn.style.cssText = `padding:4px 10px;background:rgba(0,0,0,0.04);border:1px solid rgba(0,0,0,0.08);border-radius:4px;color:#666;font-family:Inter,sans-serif;font-size:10px;cursor:pointer;transition:all 0.2s;flex-shrink:0;`;
  btn.addEventListener('mouseenter', () => btn.style.background = 'rgba(0,0,0,0.08)');
  btn.addEventListener('mouseleave', () => btn.style.background = 'rgba(0,0,0,0.04)');
  btn.addEventListener('click', onClick);
  return btn;
}

// HDR Section
const { sec: hdrSec, body: hdrBody } = createSection('HDR Environment');
const hdrStatus = document.createElement('div');
hdrStatus.id = 'hdr-status'; hdrStatus.textContent = 'Loading…';
hdrStatus.style.cssText = 'font-size:10px;color:#999;margin-bottom:8px;';
hdrBody.appendChild(hdrStatus);

const hdrGrid = document.createElement('div');
hdrGrid.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px;';
hdrEnvironments.forEach((env, idx) => {
  const btn = document.createElement('button');
  btn.textContent = env.name; btn.dataset.idx = idx;
  const isDefault = idx === 2;
  btn.style.cssText = `padding:6px 8px;background:${isDefault ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.02)'};border:1px solid ${isDefault ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.06)'};border-radius:4px;color:${isDefault ? '#444' : '#999'};font-family:Inter,sans-serif;font-size:10px;cursor:pointer;text-align:left;transition:all 0.2s;`;
  btn.addEventListener('click', () => {
    loadHDR(idx);
    hdrGrid.querySelectorAll('button').forEach(b => {
      const isActive = parseInt(b.dataset.idx) === idx;
      b.style.background = isActive ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.02)';
      b.style.borderColor = isActive ? 'rgba(0,0,0,0.15)' : 'rgba(0,0,0,0.06)';
      b.style.color = isActive ? '#444' : '#999';
    });
  });
  hdrGrid.appendChild(btn);
});
hdrBody.appendChild(hdrGrid);
hdrBody.appendChild(createSlider('Env Intensity', 0, 5, 0.01, settings.env.envIntensity, v => { settings.env.envIntensity = v; scene.environmentIntensity = v; }).row);

const showBgRow = document.createElement('div');
showBgRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:5px;';
const showBgLabel = document.createElement('span');
showBgLabel.textContent = 'Show HDR BG'; showBgLabel.style.cssText = 'font-size:11px;color:#888;width:80px;';
const showBgCheck = document.createElement('input');
showBgCheck.type = 'checkbox'; showBgCheck.checked = showHdrBg;
showBgCheck.style.cssText = 'accent-color:#888;cursor:pointer;';
showBgCheck.addEventListener('change', () => {
  showHdrBg = showBgCheck.checked;
  if (showHdrBg && hdrCache[hdrEnvironments[currentHdrIndex]?.url]) {
    scene.background = hdrCache[hdrEnvironments[currentHdrIndex].url];
    scene.backgroundBlurriness = settings.env.bgBlur;
  } else {
    scene.background = new THREE.Color('#ffffff'); scene.backgroundBlurriness = 0;
  }
});
showBgRow.append(showBgLabel, showBgCheck);
hdrBody.appendChild(showBgRow);
hdrBody.appendChild(createSlider('BG Blur', 0, 1, 0.01, settings.env.bgBlur, v => { settings.env.bgBlur = v; scene.backgroundBlurriness = v; }).row);
panel.appendChild(hdrSec);

// Camera Keyframes
const sectionNames = ['Hero', 'Design (Open)', 'Design (End)', 'Customize', 'Performance', 'Reserve'];
const { sec: kfSec, body: kfBody } = createSection('Camera Keyframes');
cameraKeyframes.forEach((kf, idx) => {
  const kfBlock = document.createElement('div');
  kfBlock.style.cssText = 'margin-bottom:12px;padding:10px;background:rgba(0,0,0,0.02);border:1px solid rgba(0,0,0,0.05);border-radius:6px;';
  const headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;';
  const kfLabel = document.createElement('div');
  const kfDisplayNum = idx <= 1 ? (idx === 0 ? '1' : '1.5') : String(idx);
  kfLabel.textContent = `KF ${kfDisplayNum} — ${sectionNames[idx] || 'Section ' + (idx+1)} (${(kf.scroll * 100).toFixed(0)}%)`;
  kfLabel.style.cssText = 'font-size:10px;font-weight:600;color:#777;cursor:pointer;';
  const jumpBtn = createSmallBtn('⤵ Jump', () => jumpToSection(idx));
  headerRow.append(kfLabel, jumpBtn);
  kfBlock.appendChild(headerRow);
  const kfContent = document.createElement('div');
  let kfCollapsed = false;
  kfLabel.addEventListener('click', () => {
    kfCollapsed = !kfCollapsed;
    kfContent.style.display = kfCollapsed ? 'none' : 'block';
  });
  kfContent.appendChild(createSlider('Cam X', -15, 15, 0.1, kf.cam.x, v => kf.cam.x = v).row);
  kfContent.appendChild(createSlider('Cam Y', -2, 15, 0.1, kf.cam.y, v => kf.cam.y = v).row);
  kfContent.appendChild(createSlider('Cam Z', -15, 15, 0.1, kf.cam.z, v => kf.cam.z = v).row);
  kfContent.appendChild(createSlider('Look X', -5, 5, 0.1, kf.target.x, v => kf.target.x = v).row);
  kfContent.appendChild(createSlider('Look Y', -2, 5, 0.1, kf.target.y, v => kf.target.y = v).row);
  kfContent.appendChild(createSlider('Look Z', -5, 5, 0.1, kf.target.z, v => kf.target.z = v).row);
  kfContent.appendChild(createSlider('FOV', 15, 90, 1, kf.fov, v => kf.fov = v).row);
  kfContent.appendChild(createSlider('Distance', 0.1, 3, 0.01, kf.distance, v => kf.distance = v).row);
  kfBlock.appendChild(kfContent);
  kfBody.appendChild(kfBlock);
});
panel.appendChild(kfSec);

// Object
const { sec: objSec, body: objBody } = createSection('Object', true);
objBody.appendChild(createSlider('Pos X', -5, 5, 0.01, settings.object.x, v => { if (model) { settings.object.x = v; model.position.x = v; } }).row);
objBody.appendChild(createSlider('Pos Y', -2, 5, 0.01, settings.object.y, v => { if (model) { settings.object.y = v; model.position.y = v; } }).row);
objBody.appendChild(createSlider('Pos Z', -5, 5, 0.01, settings.object.z, v => { if (model) { settings.object.z = v; model.position.z = v; } }).row);
objBody.appendChild(createSlider('Rot X', -180, 180, 1, 0, v => { if (model) model.rotation.x = THREE.MathUtils.degToRad(v); }).row);
objBody.appendChild(createSlider('Rot Y', -180, 180, 1, 0, v => { if (model) model.rotation.y = THREE.MathUtils.degToRad(v); }).row);
objBody.appendChild(createSlider('Rot Z', -180, 180, 1, 0, v => { if (model) model.rotation.z = THREE.MathUtils.degToRad(v); }).row);
objBody.appendChild(createSlider('Scale', 0.1, 10, 0.01, settings.object.scale, v => { if (model) model.scale.setScalar(v); }).row);
panel.appendChild(objSec);

// Lighting
const { sec: envSec, body: envBody } = createSection('Lighting', true);
envBody.appendChild(createSlider('Ambient', 0, 2, 0.01, settings.env.ambientIntensity, v => ambientLight.intensity = v).row);
envBody.appendChild(createSlider('Key', 0, 5, 0.01, settings.env.dirIntensity, v => dirLight.intensity = v).row);
envBody.appendChild(createSlider('Fill', 0, 3, 0.01, settings.env.fillIntensity, v => fillLight.intensity = v).row);
envBody.appendChild(createSlider('Rim', 0, 3, 0.01, settings.env.rimIntensity, v => rimLight.intensity = v).row);
envBody.appendChild(createSlider('Exposure', 0.2, 3, 0.01, settings.env.exposure, v => renderer.toneMappingExposure = v).row);
panel.appendChild(envSec);

// Car Materials (batch, in settings)
const { sec: matSec, body: matBody } = createSection('Car Materials', true);
const matContainer = document.createElement('div');
matContainer.id = 'matListContainer';
matBody.appendChild(matContainer);
panel.appendChild(matSec);

function buildGroupControls(groupName, group, container) {
  const block = document.createElement('div');
  block.style.cssText = 'margin-bottom:14px;padding:10px;background:rgba(0,0,0,0.02);border:1px solid rgba(0,0,0,0.05);border-radius:6px;';
  const headerRow = document.createElement('div');
  headerRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:8px;cursor:pointer;';
  const titleRow = document.createElement('div');
  titleRow.style.cssText = 'display:flex;align-items:center;gap:8px;';
  const swatch = document.createElement('div');
  swatch.style.cssText = `width:12px;height:12px;border-radius:50%;background:${group.color};border:1px solid rgba(0,0,0,0.1);flex-shrink:0;`;
  const title = document.createElement('span');
  title.textContent = groupName; title.style.cssText = 'font-size:11px;font-weight:600;color:#555;';
  const count = document.createElement('span');
  count.textContent = `(${group.mats.length})`; count.style.cssText = 'font-size:10px;color:#aaa;';
  titleRow.append(swatch, title, count);
  const arrow = document.createElement('span');
  arrow.textContent = '▸'; arrow.style.cssText = 'font-size:9px;color:#aaa;';
  headerRow.append(titleRow, arrow);
  const content = document.createElement('div');
  content.style.display = 'none';
  let collapsed = true;
  headerRow.addEventListener('click', () => {
    collapsed = !collapsed;
    content.style.display = collapsed ? 'none' : 'block';
    arrow.textContent = collapsed ? '▸' : '▾';
  });
  block.appendChild(headerRow);
  if (group.mats.length === 0) {
    const empty = document.createElement('div');
    empty.textContent = 'No materials assigned';
    empty.style.cssText = 'font-size:10px;color:#bbb;font-style:italic;padding:4px 0;';
    content.appendChild(empty); block.appendChild(content); container.appendChild(block); return;
  }
  const matList = document.createElement('div');
  matList.style.cssText = 'font-size:10px;color:#aaa;margin-bottom:8px;padding:4px 0;border-bottom:1px solid rgba(0,0,0,0.04);';
  matList.textContent = group.mats.map(m => m.name || 'unnamed').join(', ');
  content.appendChild(matList);

  function applyToGrp(fn) { group.mats.forEach(m => { fn(m); m.needsUpdate = true; }); }

  const rep = group.mats[0];
  const colorHex = '#' + rep.color.getHexString();
  content.appendChild(createColorPicker('Color', colorHex, v => { applyToGrp(m => m.color.set(v)); swatch.style.background = v; }).row);
  content.appendChild(createSlider('Roughness', 0, 1, 0.01, rep.roughness ?? 0.5, v => applyToGrp(m => m.roughness = v)).row);
  content.appendChild(createSlider('Metalness', 0, 1, 0.01, rep.metalness ?? 0, v => applyToGrp(m => m.metalness = v)).row);
  content.appendChild(createSlider('Clearcoat', 0, 1, 0.01, rep.clearcoat ?? 0, v => applyToGrp(m => m.clearcoat = v)).row);
  content.appendChild(createSlider('CC Rough', 0, 1, 0.01, rep.clearcoatRoughness ?? 0.1, v => applyToGrp(m => m.clearcoatRoughness = v)).row);
  content.appendChild(createSlider('IOR', 1, 3, 0.01, rep.ior ?? 1.5, v => applyToGrp(m => m.ior = v)).row);
  content.appendChild(createSlider('Transmission', 0, 1, 0.01, rep.transmission ?? 0, v => applyToGrp(m => { m.transmission = v; m.transparent = v > 0 || m.opacity < 1; })).row);
  content.appendChild(createSlider('Thickness', 0, 5, 0.01, rep.thickness ?? 0, v => applyToGrp(m => m.thickness = v)).row);
  content.appendChild(createSlider('Opacity', 0, 1, 0.01, rep.opacity ?? 1, v => applyToGrp(m => { m.opacity = v; m.transparent = v < 1 || m.transmission > 0; })).row);
  content.appendChild(createSlider('Emissive Int', 0, 5, 0.01, rep.emissiveIntensity ?? 0, v => applyToGrp(m => m.emissiveIntensity = v)).row);
  const emHex = '#' + (rep.emissive ? rep.emissive.getHexString() : '000000');
  content.appendChild(createColorPicker('Emissive', emHex, v => applyToGrp(m => m.emissive.set(v))).row);
  const wireRow = document.createElement('div');
  wireRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:4px;';
  const wireLabel = document.createElement('span'); wireLabel.textContent = 'Wireframe';
  wireLabel.style.cssText = 'font-size:11px;color:#888;width:80px;';
  const wireCheck = document.createElement('input'); wireCheck.type = 'checkbox'; wireCheck.checked = false;
  wireCheck.style.cssText = 'accent-color:#888;cursor:pointer;';
  wireCheck.addEventListener('change', () => applyToGrp(m => m.wireframe = wireCheck.checked));
  wireRow.append(wireLabel, wireCheck); content.appendChild(wireRow);
  block.appendChild(content); container.appendChild(block);
}

function buildMaterialUI() {
  const container = document.getElementById('matListContainer');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);
  const totalMats = Object.values(materialGroups).reduce((s, g) => s + g.mats.length, 0);

  // Collect ALL individual materials from the model (including ungrouped/unknown)
  const allModelMats = new Map();
  if (model) {
    model.traverse(ch => {
      if (!ch.isMesh) return;
      // Skip ground shadow
      const isGS = ch.name && (ch.name.toLowerCase().includes('ground_shadow') || ch.name.includes('FC0004') || ch.name.includes('Material008'));
      if (isGS) return;
      const mats = Array.isArray(ch.material) ? ch.material : [ch.material];
      mats.forEach(m => {
        if (m && !allModelMats.has(m.uuid)) {
          allModelMats.set(m.uuid, { mat: m, meshNames: [ch.name] });
        } else if (m && allModelMats.has(m.uuid)) {
          allModelMats.get(m.uuid).meshNames.push(ch.name);
        }
      });
    });
  }

  // Find which materials are NOT in any named group
  const groupedUUIDs = new Set();
  Object.values(materialGroups).forEach(g => g.mats.forEach(m => groupedUUIDs.add(m.uuid)));
  const ungroupedMats = [];
  allModelMats.forEach(({ mat, meshNames }) => {
    if (!groupedUUIDs.has(mat.uuid)) {
      ungroupedMats.push({ mat, meshNames });
    }
  });

  const grandTotal = totalMats + ungroupedMats.length;

  if (grandTotal === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:11px;color:#999;font-style:italic;';
    empty.textContent = 'No materials found';
    container.appendChild(empty);
    return;
  }
  const info = document.createElement('div');
  info.textContent = `${grandTotal} material(s) total — ${totalMats} grouped, ${ungroupedMats.length} individual`;
  info.style.cssText = 'font-size:10px;color:#aaa;margin-bottom:10px;';
  container.appendChild(info);

  // Build the named groups first
  Object.entries(materialGroups).forEach(([gn, g]) => buildGroupControls(gn, g, container));

  // Now build individual controls for EVERY material in the model
  if (allModelMats.size > 0) {
    const divider = document.createElement('div');
    divider.style.cssText = 'height:1px;background:rgba(0,0,0,0.08);margin:16px 0 12px;';
    container.appendChild(divider);

    const allTitle = document.createElement('div');
    allTitle.textContent = `ALL INDIVIDUAL MATERIALS (${allModelMats.size})`;
    allTitle.style.cssText = 'font-size:10px;font-weight:600;letter-spacing:1.5px;color:#999;margin-bottom:10px;';
    container.appendChild(allTitle);

    const allDesc = document.createElement('div');
    allDesc.textContent = 'Every material in the model listed individually with its mesh names. Use this to find and tweak specific parts.';
    allDesc.style.cssText = 'font-size:10px;color:#bbb;margin-bottom:12px;line-height:1.5;';
    container.appendChild(allDesc);

    let matIndex = 0;
    allModelMats.forEach(({ mat, meshNames }) => {
      matIndex++;
      const block = document.createElement('div');
      block.style.cssText = 'margin-bottom:8px;padding:8px 10px;background:rgba(0,0,0,0.02);border:1px solid rgba(0,0,0,0.04);border-radius:6px;';

      const headerRow = document.createElement('div');
      headerRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;cursor:pointer;';

      const leftSide = document.createElement('div');
      leftSide.style.cssText = 'display:flex;align-items:center;gap:8px;flex:1;min-width:0;';

      const swatch = document.createElement('div');
      const swatchColor = mat.color ? '#' + mat.color.getHexString() : '#888';
      swatch.style.cssText = `width:14px;height:14px;border-radius:3px;background:${swatchColor};border:1px solid rgba(0,0,0,0.1);flex-shrink:0;`;

      const nameEl = document.createElement('span');
      nameEl.textContent = `#${matIndex} ${mat.name || 'unnamed'}`;
      nameEl.style.cssText = 'font-size:11px;font-weight:500;color:#555;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

      const typeTag = document.createElement('span');
      typeTag.textContent = mat.type || 'unknown';
      typeTag.style.cssText = 'font-size:9px;color:#aaa;border:1px solid rgba(0,0,0,0.06);border-radius:3px;padding:1px 4px;flex-shrink:0;';

      leftSide.append(swatch, nameEl, typeTag);

      const arrow = document.createElement('span');
      arrow.textContent = '▸';
      arrow.style.cssText = 'font-size:9px;color:#bbb;flex-shrink:0;margin-left:8px;';

      headerRow.append(leftSide, arrow);

      const content = document.createElement('div');
      content.style.display = 'none';

      let collapsed = true;
      headerRow.addEventListener('click', () => {
        collapsed = !collapsed;
        content.style.display = collapsed ? 'none' : 'block';
        arrow.textContent = collapsed ? '▸' : '▾';
      });

      // Mesh names
      const meshInfo = document.createElement('div');
      meshInfo.textContent = 'Meshes: ' + meshNames.join(', ');
      meshInfo.style.cssText = 'font-size:9px;color:#aaa;margin:8px 0 6px;word-break:break-all;line-height:1.4;padding:4px 6px;background:rgba(0,0,0,0.02);border-radius:3px;';
      content.appendChild(meshInfo);

      // Only add controls if the material has controllable properties
      if (mat.color) {
        function applyToMat(fn) { fn(mat); mat.needsUpdate = true; }

        const colorHex = '#' + mat.color.getHexString();
        content.appendChild(createColorPicker('Color', colorHex, v => { applyToMat(m => m.color.set(v)); swatch.style.background = v; }).row);

        if (mat.roughness !== undefined) {
          content.appendChild(createSlider('Roughness', 0, 1, 0.01, mat.roughness, v => applyToMat(m => m.roughness = v)).row);
        }
        if (mat.metalness !== undefined) {
          content.appendChild(createSlider('Metalness', 0, 1, 0.01, mat.metalness, v => applyToMat(m => m.metalness = v)).row);
        }
        if (mat.clearcoat !== undefined) {
          content.appendChild(createSlider('Clearcoat', 0, 1, 0.01, mat.clearcoat, v => applyToMat(m => m.clearcoat = v)).row);
        }
        if (mat.clearcoatRoughness !== undefined) {
          content.appendChild(createSlider('CC Rough', 0, 1, 0.01, mat.clearcoatRoughness, v => applyToMat(m => m.clearcoatRoughness = v)).row);
        }
        if (mat.transmission !== undefined) {
          content.appendChild(createSlider('Transmission', 0, 1, 0.01, mat.transmission, v => applyToMat(m => { m.transmission = v; m.transparent = v > 0 || m.opacity < 1; })).row);
        }
        if (mat.opacity !== undefined) {
          content.appendChild(createSlider('Opacity', 0, 1, 0.01, mat.opacity, v => applyToMat(m => { m.opacity = v; m.transparent = v < 1; })).row);
        }
        if (mat.emissiveIntensity !== undefined) {
          content.appendChild(createSlider('Emissive Int', 0, 5, 0.01, mat.emissiveIntensity, v => applyToMat(m => m.emissiveIntensity = v)).row);
        }
        if (mat.emissive) {
          const emHex = '#' + mat.emissive.getHexString();
          content.appendChild(createColorPicker('Emissive', emHex, v => applyToMat(m => m.emissive.set(v))).row);
        }
        // Wireframe toggle
        const wireRow = document.createElement('div');
        wireRow.style.cssText = 'display:flex;align-items:center;gap:8px;margin-top:4px;';
        const wireLabel = document.createElement('span'); wireLabel.textContent = 'Wireframe';
        wireLabel.style.cssText = 'font-size:11px;color:#888;width:80px;';
        const wireCheck = document.createElement('input'); wireCheck.type = 'checkbox'; wireCheck.checked = false;
        wireCheck.style.cssText = 'accent-color:#888;cursor:pointer;';
        wireCheck.addEventListener('change', () => applyToMat(m => m.wireframe = wireCheck.checked));
        wireRow.append(wireLabel, wireCheck);
        content.appendChild(wireRow);
      } else {
        const noCtrl = document.createElement('div');
        noCtrl.textContent = mat.isShaderMaterial ? 'Custom ShaderMaterial — no standard controls' : 'No color property — limited controls';
        noCtrl.style.cssText = 'font-size:10px;color:#bbb;font-style:italic;margin-top:6px;';
        content.appendChild(noCtrl);
      }

      block.appendChild(headerRow);
      block.appendChild(content);
      container.appendChild(block);
    });
  }
}

// Animations
const { sec: animSec, body: animBody } = createSection('Animations', true);
const animContainer = document.createElement('div');
animContainer.id = 'animListContainer';
animBody.appendChild(animContainer);
panel.appendChild(animSec);

function buildAnimationUI() {
  const container = document.getElementById('animListContainer');
  if (!container) return;
  while (container.firstChild) container.removeChild(container.firstChild);
  if (allClips.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'font-size:11px;color:#999;font-style:italic;';
    empty.textContent = 'No animations found';
    container.appendChild(empty);
    return;
  }
  const scrollClipName = scrollClip ? scrollClip.name : 'none';
  const info = document.createElement('div');
  info.textContent = `${allClips.length} clip(s) — scroll: "${scrollClipName}"`;
  info.style.cssText = 'font-size:10px;color:#aaa;margin-bottom:8px;';
  container.appendChild(info);
  allClips.forEach(clip => {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:6px;';
    const nameLbl = document.createElement('span');
    nameLbl.textContent = `${clip.name || 'Unnamed'} (${clip.duration.toFixed(2)}s)`;
    nameLbl.style.cssText = 'flex:1;font-size:11px;color:#666;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    const isScrollClip = scrollClip && clip.name === scrollClip.name;
    if (isScrollClip) {
      const tag = document.createElement('span');
      tag.textContent = 'scroll'; tag.style.cssText = 'font-size:9px;color:#6a6;border:1px solid #6a6;border-radius:3px;padding:1px 4px;';
      row.append(nameLbl, tag);
    } else {
      const btn = createSmallBtn('▶ Play', () => {
        playClipManually(clip);
        btn.textContent = '⏵ Playing…'; btn.style.color = '#4a4';
        setTimeout(() => { btn.textContent = '▶ Play'; btn.style.color = '#666'; }, clip.duration * 1000 + 200);
      });
      row.append(nameLbl, btn);
    }
    container.appendChild(row);
  });
  const resetBtn = createSmallBtn('↻ Reset Scroll-Driven', () => {
    isManualPlaying = false; setupScrollAnimation(allClips);
  });
  resetBtn.style.cssText += 'width:100%;margin-top:8px;';
  container.appendChild(resetBtn);
}

// Ground Shadow Controls
const { sec: gsSec, body: gsBody } = createSection('Ground Shadow', false);
gsBody.appendChild(createSlider('Opacity', 0, 2, 0.01, 1.0, v => {
  if (groundShadowUniforms) groundShadowUniforms.uOpacity.value = v;
}).row);
gsBody.appendChild(createSlider('Fade Start', 0, 1, 0.01, 0.3, v => {
  if (groundShadowUniforms) groundShadowUniforms.uFadeStart.value = v;
}).row);
gsBody.appendChild(createSlider('Fade End', 0, 2, 0.01, 1.0, v => {
  if (groundShadowUniforms) groundShadowUniforms.uFadeEnd.value = v;
}).row);
gsBody.appendChild(createSlider('Fade Power', 0.1, 5, 0.1, 2.0, v => {
  if (groundShadowUniforms) groundShadowUniforms.uFadePower.value = v;
}).row);
gsBody.appendChild(createSlider('Scale', 0.5, 5, 0.01, 1.0, v => {
  if (groundShadowMesh) groundShadowMesh.scale.setScalar(v);
}).row);
gsBody.appendChild(createSlider('Y Offset', -0.1, 0.5, 0.001, 0, v => {
  if (groundShadowMesh) groundShadowMesh.position.y = v;
}).row);
panel.appendChild(gsSec);

// Copy buttons
const btnRow = document.createElement('div');
btnRow.style.cssText = 'display:flex;gap:8px;margin-top:12px;';
const copyAll = createSmallBtn('Copy All Settings', () => {
  const out = {
    cameraKeyframes: cameraKeyframes.map(kf => ({
      scroll: kf.scroll,
      cam: { x: +kf.cam.x.toFixed(2), y: +kf.cam.y.toFixed(2), z: +kf.cam.z.toFixed(2) },
      target: { x: +kf.target.x.toFixed(2), y: +kf.target.y.toFixed(2), z: +kf.target.z.toFixed(2) },
      fov: kf.fov, distance: +kf.distance.toFixed(2),
    })),
    object: { ...settings.object },
    lighting: { ...settings.env, exposure: renderer.toneMappingExposure },
    hdr: hdrEnvironments[currentHdrIndex]?.name || 'none',
  };
  navigator.clipboard.writeText(JSON.stringify(out, null, 2));
  copyAll.textContent = '✓ Copied!'; setTimeout(() => copyAll.textContent = 'Copy All Settings', 1500);
});
copyAll.style.flex = '1';
const copyCam = createSmallBtn('Copy Camera', () => {
  const out = cameraKeyframes.map(kf => ({
    scroll: kf.scroll,
    cam: { x: +kf.cam.x.toFixed(2), y: +kf.cam.y.toFixed(2), z: +kf.cam.z.toFixed(2) },
    target: { x: +kf.target.x.toFixed(2), y: +kf.target.y.toFixed(2), z: +kf.target.z.toFixed(2) },
    fov: kf.fov, distance: +kf.distance.toFixed(2),
  }));
  navigator.clipboard.writeText(JSON.stringify(out, null, 2));
  copyCam.textContent = '✓ Copied!'; setTimeout(() => copyCam.textContent = 'Copy Camera', 1500);
});
copyCam.style.flex = '1';
btnRow.append(copyAll, copyCam);
panel.appendChild(btnRow);
document.body.appendChild(panel);

window.addEventListener('keydown', (e) => {
  if (e.key === 's' || e.key === 'S') {
    if (document.activeElement && (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA')) return;
    panelVisible = !panelVisible;
    panel.style.display = panelVisible ? 'block' : 'none';
  }
});

// ─────────────────────────────────────────
// RENDER LOOP
// ─────────────────────────────────────────
const lookTarget = new THREE.Vector3();
const progressBar = document.getElementById('progress-bar');
const ANIM_SCROLL_START = 0.0;
const ANIM_SCROLL_END = 0.25;
const SMOOTH_EPSILON = 0.00005;
let frameCount = 0;

function animate() {
  const prevSmooth = smoothScroll;
  smoothScroll += (scrollProgress - smoothScroll) * 0.08;

  // Check if smoothing is still converging
  const isSmoothing = Math.abs(smoothScroll - prevSmooth) > SMOOTH_EPSILON;
  if (isSmoothing) needsRender = true;

  // Animation scrub via dedicated scrubMixer
  let animUpdated = false;
  if (scrubMixer && scrollClip && animDuration > 0 && !isManualPlaying) {
    const rawT = (smoothScroll - ANIM_SCROLL_START) / (ANIM_SCROLL_END - ANIM_SCROLL_START);
    const clampedT = Math.max(0, Math.min(1, rawT));
    const targetTime = clampedT * animDuration;

    if (Math.abs(targetTime - lastScrubTime) > 0.0001) {
      lastScrubTime = targetTime;
      scrubMixer.setTime(targetTime);
      animUpdated = true;
      needsRender = true;
      shadowDirtyFrames = 3;
    }
  } else if (mixer && isManualPlaying) {
    mixer.update(manualPlayClock.getDelta());
    needsRender = true;
    shadowDirtyFrames = 3;
  }

  if (!needsRender) return;

  const interp = getInterpolatedCamera(smoothScroll);
  camera.position.set(interp.cam.x, interp.cam.y, interp.cam.z);
  lookTarget.set(interp.target.x, interp.target.y, interp.target.z);
  camera.lookAt(lookTarget);
  if (camera.fov !== interp.fov) {
    camera.fov = interp.fov;
    camera.updateProjectionMatrix();
  }

  // Throttled shadow updates
  if (shadowDirtyFrames > 0) {
    renderer.shadowMap.needsUpdate = true;
    shadowDirtyFrames--;
  }

  if (progressBar) progressBar.style.width = (smoothScroll * 100) + '%';
  renderer.render(scene, camera);
  frameCount++;

  // Reset dirty flag — will be set again by scroll/interaction
  if (!isSmoothing && !isManualPlaying) needsRender = false;
}
renderer.setAnimationLoop(animate);

// Debounced resize
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    markDirty(true);
  }, 100);
}, { passive: true });