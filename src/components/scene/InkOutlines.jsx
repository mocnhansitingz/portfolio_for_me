import { useEffect, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { idMaterial, INK, INK_LAYER } from "./toonify";

// Line width as a fraction of the viewport height, with a floor for small screens (CSS px).
const WIDTH = 0.0034;
const MIN_WIDTH_PX = 1.6;
// The sampling disc is a bit wider than the line, so its edge can fade out smoothly.
const DISC_SCALE = 1.25;
const TAPS = 24;

// Full-screen pass: a pixel is inked when a different, nearer object lies within the disc
// around it. That draws the line just outside each silhouette, at the same width whether
// the object floats in the air or rests flat against the table or a wall.
const inkMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthTest: false,
  depthWrite: false,
  defines: { TAPS },
  uniforms: {
    tIds: { value: null },
    uTexel: { value: new THREE.Vector2() },
    uRadius: { value: 3 },
    uColor: { value: new THREE.Color(INK) },
  },
  vertexShader: /* glsl */ `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = vec4(position.xy, 0.0, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    uniform sampler2D tIds;
    uniform vec2 uTexel;
    uniform float uRadius;
    uniform vec3 uColor;
    varying vec2 vUv;

    float idOf(vec4 s) {
      return floor(s.r * 255.0 + 0.5) * 256.0 + floor(s.g * 255.0 + 0.5);
    }
    float depthOf(vec4 s) {
      return floor(s.b * 255.0 + 0.5) * 256.0 + floor(s.a * 255.0 + 0.5);
    }

    void main() {
      vec4 here = texture2D(tIds, vUv);
      float id = idOf(here);
      float depth = depthOf(here);
      // Depths this close count as touching; the higher id then owns the line,
      // so a boundary between flush surfaces is still inked on one side only.
      float tolerance = max(depth * 0.004, 2.0);

      float hits = 0.0;
      for (int i = 0; i < TAPS; i++) {
        float fi = float(i);
        float radius = sqrt((fi + 0.5) / float(TAPS)) * uRadius;
        float angle = fi * 2.39996323;
        vec4 tap = texture2D(tIds, vUv + vec2(cos(angle), sin(angle)) * radius * uTexel);
        float tapId = idOf(tap);
        float tapDepth = depthOf(tap);
        bool nearer = tapDepth < depth - tolerance;
        bool touching = tapDepth <= depth + tolerance && tapId > id;
        if (tapId != id && (nearer || touching)) hits += 1.0;
      }

      float alpha = smoothstep(0.02, 0.11, hits / float(TAPS));
      gl_FragColor = vec4(uColor, alpha);
      #include <colorspace_fragment>
    }
  `,
});

// Takes over rendering: object ids -> offscreen buffer, the scene as usual, then the ink on top.
function InkOutlines() {
  const scene = useThree((state) => state.scene);

  const { target, overlay, overlayCamera, clearColor } = useMemo(() => {
    const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), inkMaterial);
    quad.frustumCulled = false;
    return {
      target: new THREE.WebGLRenderTarget(1, 1, {
        minFilter: THREE.NearestFilter,
        magFilter: THREE.NearestFilter,
        generateMipmaps: false,
      }),
      overlay: new THREE.Scene().add(quad),
      overlayCamera: new THREE.Camera(),
      clearColor: new THREE.Color(),
    };
  }, []);

  useEffect(() => () => target.dispose(), [target]);

  useFrame(({ gl, camera, size }) => {
    const dpr = gl.getPixelRatio();
    const width = Math.floor(size.width * dpr);
    const height = Math.floor(size.height * dpr);
    if (target.width !== width || target.height !== height)
      target.setSize(width, height);

    // Lights stay visible to the id pass so both passes share one light setup;
    // otherwise three.js would re-validate every lit material twice a frame.
    scene.traverse((o) => o.isLight && o.layers.enable(INK_LAYER));

    // 1. Ids and depths of the outlined meshes. Background = no id, as far away as possible.
    const background = scene.background;
    const clearAlpha = gl.getClearAlpha();
    const shadowAutoUpdate = gl.shadowMap.autoUpdate;
    gl.getClearColor(clearColor);
    idMaterial.uniforms.uFar.value = camera.far;

    scene.background = null;
    scene.overrideMaterial = idMaterial;
    camera.layers.set(INK_LAYER);
    gl.shadowMap.autoUpdate = false;
    gl.setRenderTarget(target);
    gl.setClearColor(0x0000ff, 1);
    gl.render(scene, camera);

    gl.setRenderTarget(null);
    gl.setClearColor(clearColor, clearAlpha);
    gl.shadowMap.autoUpdate = shadowAutoUpdate;
    camera.layers.set(0);
    scene.overrideMaterial = null;
    scene.background = background;

    // 2. The scene itself.
    gl.render(scene, camera);

    // 3. Ink lines on top.
    const linePx = Math.max(WIDTH * size.height, MIN_WIDTH_PX) * dpr;
    inkMaterial.uniforms.tIds.value = target.texture;
    inkMaterial.uniforms.uTexel.value.set(1 / width, 1 / height);
    inkMaterial.uniforms.uRadius.value = linePx * DISC_SCALE;
    gl.autoClear = false;
    gl.render(overlay, overlayCamera);
    gl.autoClear = true;
  }, 1);

  return null;
}

export default InkOutlines;
