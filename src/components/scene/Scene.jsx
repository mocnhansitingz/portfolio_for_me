import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Bmo from "./Bmo";
import Cassette from "./Cassette";
import Room from "./Room";
import Snail from "./Snail";
import InkOutlines from "./InkOutlines";

const FOV = 35;
const TAN_HALF_FOV = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

// Resting poses of the cassettes, tossed carelessly around the table.
// Projects fill them in order, so the first ones should already look scattered.
const SLOTS = [
  { position: [-1.25, 0, 1.05], rotation: [0, 0.5, 0] },
  // Dropped half on top of the previous one.
  { position: [-1.02, 0.036, 1.22], rotation: [0, -0.75, -0.17] },
  { position: [1.25, 0, 0.2], rotation: [0, -1.25, 0] },
  { position: [1.82, 0, 0.7], rotation: [0, 0.45, 0] },
  { position: [0.9, 0, 1.5], rotation: [0, 1.9, 0] },
  { position: [-1.0, 0, 0.35], rotation: [0, 2.2, 0] },
  { position: [-1.85, 0, -0.2], rotation: [0, -0.3, 0] },
  { position: [-0.1, 0, 1.85], rotation: [0, 0.2, 0] },
];

function Rig({ focused }) {
  const look = useRef(new THREE.Vector3(0, 0.62, 0));
  const pos = useMemo(() => new THREE.Vector3(), []);
  const aim = useMemo(() => new THREE.Vector3(), []);

  useFrame(({ camera, pointer, size }, dt) => {
    const aspect = size.width / size.height;

    if (!focused) {
      // Pull back on narrow screens so the whole table stays in frame.
      const k = Math.max(1, 1.35 / aspect);
      pos.set(pointer.x * 0.5, 2.6 * k + pointer.y * 0.25, 6.2 * k);
      aim.set(0, 0.62, 0);
    } else if (aspect < 1) {
      // Portrait: BMO in the upper half, the project sheet covers the bottom.
      const z = Math.max(3.4, 2.7 / aspect);
      const y = 0.7 - 0.44 * z * TAN_HALF_FOV;
      pos.set(0, y + 0.5, z);
      aim.set(0, y, 0);
    } else {
      // Landscape: BMO in the left half, the project panel on the right.
      const z = Math.max(3.1, 4.6 / aspect);
      const offset = 0.36 * z * TAN_HALF_FOV * aspect;
      pos.set(offset + 0.25, 1.2, z);
      aim.set(offset, 0.72, 0);
    }

    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos.x, 4, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos.y, 4, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.z, 4, dt);
    look.current.x = THREE.MathUtils.damp(look.current.x, aim.x, 4, dt);
    look.current.y = THREE.MathUtils.damp(look.current.y, aim.y, 4, dt);
    camera.lookAt(look.current);
  });

  return null;
}

function Scene({
  projects,
  selectedId,
  loaded,
  game,
  onSelect,
  onLoaded,
  onSnailFound,
}) {
  const selected = useMemo(
    () => projects.find((project) => project.id === selectedId) ?? null,
    [projects, selectedId],
  );
  const [hoveredId, setHoveredId] = useState(null);
  const [buttonHovered, setButtonHovered] = useState(false);
  const [propHovered, setPropHovered] = useState(false);
  const [snailHovered, setSnailHovered] = useState(false);

  const hover = useCallback((id, isOver) => {
    setHoveredId((prev) => (isOver ? id : prev === id ? null : prev));
  }, []);

  useEffect(() => {
    const clickable = hoveredId || buttonHovered || propHovered || snailHovered;
    document.body.style.cursor = clickable ? "pointer" : "";
    return () => {
      document.body.style.cursor = "";
    };
  }, [hoveredId, buttonHovered, propHovered, snailHovered]);

  const visible = useMemo(() => projects.slice(0, SLOTS.length), [projects]);
  const hoveredIndex = useMemo(
    () => visible.findIndex((project) => project.id === hoveredId),
    [visible, hoveredId],
  );
  const hoveredSlot = selected || hoveredIndex < 0 ? null : SLOTS[hoveredIndex];
  const lookAt = useMemo(
    () => hoveredSlot && [hoveredSlot.position[0], hoveredSlot.position[2]],
    [hoveredSlot],
  );
  // BMO gets excited about a hovered cassette and while one is flying in.
  const excited = lookAt !== null || (selected !== null && !loaded);

  return (
    <Canvas
      flat
      shadows
      dpr={[1, 2]}
      camera={{ fov: FOV, position: [0, 2.6, 6.2], near: 0.1, far: 80 }}
      onPointerMissed={() => onSelect(null)}
    >
      <color attach="background" args={["#E0A566"]} />
      <ambientLight intensity={1.7} />
      <directionalLight
        castShadow
        position={[-5, 7, 4]}
        intensity={1.6}
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0004}
      >
        <orthographicCamera
          attach="shadow-camera"
          args={[-7, 7, 7, -7, 0.5, 30]}
        />
      </directionalLight>

      <Rig focused={selected !== null} />
      <InkOutlines />

      <Suspense fallback={null}>
        <Room onHoverChange={setPropHovered} />
        <Snail onFound={onSnailFound} onHoverChange={setSnailHovered} />
        <Bmo
          project={loaded ? selected : null}
          game={loaded && selected?.kind === "game" ? game : null}
          lookAt={lookAt}
          excited={excited}
          focused={selected !== null}
          onHoverChange={setButtonHovered}
        />
        {visible.map((project, i) => (
          <Cassette
            key={project.id}
            project={project}
            slot={SLOTS[i]}
            active={project.id === selectedId}
            dimmed={selected !== null}
            onSelect={onSelect}
            onLoaded={onLoaded}
            onHover={hover}
          />
        ))}
      </Suspense>
    </Canvas>
  );
}

export default Scene;
