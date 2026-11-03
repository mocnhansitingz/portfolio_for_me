import { useEffect, useMemo, useRef, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Html, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { inkify, modelUrl, toonify } from "./toonify";
import { makeLabelTexture, useFontReady } from "./textures";

const URL = modelUrl("cassette");

// Where a cassette hovers in front of BMO's slot, and where it ends up inside.
const SLOT_FRONT = new THREE.Vector3(-0.11, 0.6, 0.85);
const SLOT_INSIDE = new THREE.Vector3(-0.11, 0.6, 0.1);
const SLOT_SCALE = 0.72;
// The game cassette stands out with a golden shell.
const GAME_SHELL = "#E3A72F";

const damp = THREE.MathUtils.damp;

// `slot` is the resting pose on the table: { position: [x, y, z], rotation: [x, y, z] }.
// `onHover(id, isOver)` reports pointer enter / leave to the scene.
function Cassette({
  project,
  slot,
  active,
  dimmed,
  onSelect,
  onLoaded,
  onHover,
}) {
  const { scene } = useGLTF(URL);
  const group = useRef();
  const [hovered, setHovered] = useState(false);
  const fontReady = useFontReady();
  // 0: on the table / travelling to the slot, 1: sliding into BMO
  const stage = useRef(0);
  const notified = useRef(false);

  const home = useMemo(() => new THREE.Vector3(...slot.position), [slot]);
  const target = useMemo(() => new THREE.Vector3(), []);
  const turn = useMemo(() => new THREE.Vector3(), []);

  const model = useMemo(() => {
    toonify(scene);
    const clone = scene.clone(true);
    const label = clone.getObjectByName("Cassette_Label");
    label.material = label.material.clone();
    label.material.color.set(project.color);
    if (project.kind === "game") {
      const gold = new THREE.Color(GAME_SHELL);
      clone.traverse((o) => {
        if (!o.isMesh || o.material.name !== "Cassette_Shell") return;
        o.material = o.material.clone();
        o.material.color.copy(gold);
      });
    }
    return inkify(clone);
  }, [scene, project.color, project.kind]);

  const labelTexture = useMemo(
    () => (fontReady ? makeLabelTexture(project.title) : null),
    [project.title, fontReady],
  );
  useEffect(() => () => labelTexture?.dispose(), [labelTexture]);

  const hover = (isOver) => {
    setHovered(isOver);
    onHover(project.id, isOver);
  };

  useEffect(() => {
    if (active) {
      // The hit area unmounts while active, so no pointer-out will arrive.
      setHovered(false);
      onHover(project.id, false);
    } else {
      notified.current = false;
    }
  }, [active, onHover, project.id]);

  useFrame(({ clock }, dt) => {
    const g = group.current;
    let scale = 1;
    let speed = 6;
    turn.set(...slot.rotation);

    if (active) {
      turn.set(0, 0, 0);
      scale = SLOT_SCALE;
      if (stage.current === 0) {
        target.copy(SLOT_FRONT);
        // Only start sliding in once lined up with the slot.
        const lined =
          Math.abs(g.rotation.x) +
          Math.abs(g.rotation.y) +
          Math.abs(g.rotation.z);
        if (g.position.distanceTo(target) < 0.05 && lined < 0.08)
          stage.current = 1;
      } else {
        target.copy(SLOT_INSIDE);
        speed = 9;
        if (!notified.current && g.position.distanceTo(target) < 0.03) {
          notified.current = true;
          onLoaded(project.id);
        }
      }
    } else if (stage.current === 1) {
      // Ejecting: back out of the slot before flying home.
      target.copy(SLOT_FRONT);
      turn.set(0, 0, 0);
      scale = SLOT_SCALE;
      speed = 9;
      if (g.position.distanceTo(target) < 0.08) stage.current = 0;
    } else {
      target.copy(home);
      if (hovered && !dimmed) {
        // Float, face the camera and wobble a little to invite a click.
        target.y += 0.18 + Math.sin(clock.elapsedTime * 4) * 0.015;
        turn.set(0.45, turn.y + Math.sin(clock.elapsedTime * 3) * 0.08, 0);
        scale = 1.15;
      }
    }

    g.position.x = damp(g.position.x, target.x, speed, dt);
    g.position.y = damp(g.position.y, target.y, speed, dt);
    g.position.z = damp(g.position.z, target.z, speed, dt);
    g.rotation.x = damp(g.rotation.x, turn.x, speed, dt);
    g.rotation.y = damp(g.rotation.y, turn.y, speed, dt);
    g.rotation.z = damp(g.rotation.z, turn.z, speed, dt);
    g.scale.setScalar(damp(g.scale.x, scale, speed, dt));
  });

  return (
    <>
      {/* Static hit area, so the hover lift never moves the cassette out from under the cursor. */}
      {!active && (
        <mesh
          visible={false}
          position={[home.x, home.y + 0.12, home.z]}
          rotation-y={slot.rotation[1]}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(project.id);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            hover(true);
          }}
          onPointerOut={() => hover(false)}
        >
          <boxGeometry args={[0.52, 0.24, 0.36]} />
        </mesh>
      )}
      <group ref={group} position={home} rotation={slot.rotation}>
        <primitive object={model} />
        {labelTexture && (
          <mesh position={[0, 0.0618, -0.085]} rotation-x={-Math.PI / 2}>
            <planeGeometry args={[0.34, 0.06]} />
            <meshBasicMaterial map={labelTexture} transparent />
          </mesh>
        )}
        {hovered && !active && (
          <Html center position={[0, 0.42, 0]} pointerEvents="none">
            <div className="tooltip">{project.title}</div>
          </Html>
        )}
      </group>
    </>
  );
}

useGLTF.preload(URL);

export default Cassette;
