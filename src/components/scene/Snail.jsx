import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { modelUrl, toonify } from "./toonify";

const URL = modelUrl("snail");

// Hiding places; one is picked at random on every visit.
const SPOTS = [
  // on top of the red book on the shelf
  { position: [2.12, 1.87, -3.72], turn: 0.1, scale: 0.75 },
  // at the bottom of the round window
  { position: [-3.0, 0.0, -3.9], turn: -0.2, scale: 1.3 },
  // on top of the landscape picture frame
  { position: [-0.55, 1.78, -3.955], turn: 0, scale: 1.0 },
  // on the table, behind the mug
  { position: [-1.25, 0, -1.45], turn: 0.4, scale: 1.0 },
  // on the floor next to the treasure chest
  { position: [3.7, -1.7, -3.0], turn: -0.3, scale: 1.5 },
  // on the rug, in front of the table
  { position: [-2.9, -1.67, 1.3], turn: 0.5, scale: 1.6 },
];

const WAVE_INTERVAL = 6.5;
const WAVE_DURATION = 1.4;
const FOUND_DURATION = 2.6;

const damp = THREE.MathUtils.damp;

// The little snail that hides somewhere in the room and waves at the camera.
// `onFound()` fires when it is clicked, `onHoverChange(bool)` reports pointer hover.
function Snail({ onFound, onHoverChange }) {
  const { scene } = useGLTF(URL);
  const clock = useThree((state) => state.clock);
  const group = useRef();
  const found = useRef(-Infinity);

  const spot = useMemo(
    () => SPOTS[Math.floor(Math.random() * SPOTS.length)],
    [],
  );
  const arm = useMemo(() => {
    toonify(scene);
    return scene.getObjectByName("Snail_Arm");
  }, [scene]);

  useFrame((_, dt) => {
    const t = clock.elapsedTime;
    const celebrating = t - found.current < FOUND_DURATION;
    const waving = celebrating || t % WAVE_INTERVAL < WAVE_DURATION;

    // The arm stays up; it wags when waving, faster once the snail has been found.
    const wag = waving ? Math.sin(t * (celebrating ? 22 : 13)) * 0.55 : 0;
    arm.rotation.z = damp(arm.rotation.z, wag, 14, dt);

    // Found: a few happy hops and a spin.
    const since = t - found.current;
    const g = group.current;
    g.position.y =
      spot.position[1] +
      (celebrating ? Math.abs(Math.sin(since * 9)) * 0.07 * spot.scale : 0);
    g.rotation.y =
      spot.turn +
      (celebrating
        ? Math.PI * 2 * THREE.MathUtils.smoothstep(since, 0, 0.8)
        : 0);
  });

  return (
    <group
      ref={group}
      position={spot.position}
      rotation-y={spot.turn}
      scale={spot.scale}
      onClick={(e) => {
        e.stopPropagation();
        found.current = clock.elapsedTime;
        onFound();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHoverChange(true);
      }}
      onPointerOut={() => onHoverChange(false)}
    >
      <primitive object={scene} />
    </group>
  );
}

useGLTF.preload(URL);

export default Snail;
