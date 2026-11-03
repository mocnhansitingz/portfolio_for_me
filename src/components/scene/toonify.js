import * as THREE from "three";

// Materials that should ignore lighting (BMO's glowing screen, the view outside the window).
const UNLIT = /^(Outside_|BMO_ScreenGreen)/;

// Decals and small details that sit on top of another shape. They never get an ink outline
// of their own; the outline pass simply doesn't see them.
const DETAIL =
  /^(Wood_Line|BMO_(Ink|Tongue|Slot)|Cassette_(Label|Window|Reel|Strip)|Detail_)/;

// The room shell only receives shadows; casting would bury the corners in darkness.
const NO_SHADOW_CAST = /^(Wood_(Wall|Floor|Line)|Rug_)/;

export const INK = "#2B1B12";

// Meshes on this layer are drawn into the id buffer that the ink outlines are traced from.
export const INK_LAYER = 1;

// Writes a mesh's outline id (2 bytes) and its view depth (2 bytes) instead of its colour.
export const idMaterial = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  uniforms: { uId: { value: new THREE.Vector2() }, uFar: { value: 100 } },
  vertexShader: /* glsl */ `
    varying float vDepth;
    void main() {
      vec4 mv = modelViewMatrix * vec4(position, 1.0);
      vDepth = -mv.z;
      gl_Position = projectionMatrix * mv;
    }
  `,
  fragmentShader: /* glsl */ `
    uniform vec2 uId;
    uniform float uFar;
    varying float vDepth;
    void main() {
      float depth = floor(clamp(vDepth / uFar, 0.0, 1.0) * 65535.0);
      float high = floor(depth / 256.0);
      gl_FragColor = vec4(uId, high / 255.0, (depth - high * 256.0) / 255.0);
    }
  `,
});

const materials = new Map();
let nextId = 1;

function convert(material) {
  if (!material.isMeshStandardMaterial) return material;
  if (!materials.has(material.name)) {
    const Toon = UNLIT.test(material.name)
      ? THREE.MeshBasicMaterial
      : THREE.MeshToonMaterial;
    const toon = new Toon({ color: material.color, side: material.side });
    toon.name = material.name;
    materials.set(material.name, toon);
  }
  return materials.get(material.name);
}

// Gives every outlined mesh under `root` its own id, so an ink line appears wherever two
// of them meet on screen. Clones copy the layer but not the id, so call this on them too.
export function inkify(root) {
  root.traverse((o) => {
    if (!o.isMesh || !o.layers.isEnabled(INK_LAYER)) return;
    const id = nextId++;
    const high = Math.floor(id / 256) / 255;
    const low = (id % 256) / 255;
    o.onBeforeRender = (renderer, scene, camera, geometry, material) => {
      if (material !== idMaterial) return;
      material.uniforms.uId.value.set(high, low);
      material.uniformsNeedUpdate = true;
    };
  });
  return root;
}

// Swaps the exported PBR materials for flat cartoon ones, enables shadows and marks
// which meshes get an ink outline.
export function toonify(root) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    o.material = convert(o.material);
    const unlit = o.material.isMeshBasicMaterial;
    o.castShadow = !unlit && !NO_SHADOW_CAST.test(o.material.name);
    o.receiveShadow = !unlit;
    if (!DETAIL.test(o.material.name)) o.layers.enable(INK_LAYER);
  });
  return inkify(root);
}

export const modelUrl = (name) =>
  `${import.meta.env.BASE_URL}models/${name}.glb`;
