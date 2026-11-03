import { useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sparkles, useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { modelUrl, toonify } from "./toonify";

const URL = modelUrl("room");

// Clouds drift across this x range behind the window and wrap around.
const CLOUD_MIN_X = -16;
const CLOUD_MAX_X = 3;

// The sunbeam runs from the round window down to the rug.
const BEAM_FROM = new THREE.Vector3(-3, 1.3, -4);
const BEAM_TO = new THREE.Vector3(-1.9, -1.66, 0.7);
const BEAM_COLOR = "#FFF1B0";

function Sunbeam() {
  const { position, quaternion, length } = useMemo(() => {
    const dir = BEAM_FROM.clone().sub(BEAM_TO);
    return {
      position: BEAM_FROM.clone().add(BEAM_TO).multiplyScalar(0.5),
      quaternion: new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        dir.clone().normalize(),
      ),
      length: dir.length(),
    };
  }, []);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        side: THREE.DoubleSide,
        blending: THREE.AdditiveBlending,
        uniforms: { uColor: { value: new THREE.Color(BEAM_COLOR) } },
        vertexShader: /* glsl */ `
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            vUv = uv;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            vNormal = normalMatrix * normal;
            vView = -mv.xyz;
            gl_Position = projectionMatrix * mv;
          }
        `,
        fragmentShader: /* glsl */ `
          uniform vec3 uColor;
          varying vec2 vUv;
          varying vec3 vNormal;
          varying vec3 vView;
          void main() {
            // Fade out towards the silhouette and towards the floor.
            float facing = abs(dot(normalize(vNormal), normalize(vView)));
            float alpha = pow(facing, 1.6) * smoothstep(0.0, 0.85, vUv.y) * 0.2;
            gl_FragColor = vec4(uColor, alpha);
            #include <colorspace_fragment>
          }
        `,
      }),
    [],
  );

  return (
    <>
      <mesh position={position} quaternion={quaternion} material={material}>
        <cylinderGeometry args={[1.25, 1.9, length, 40, 1, true]} />
      </mesh>
      {/* Warm pool of light where the beam lands. */}
      <mesh
        position={[BEAM_TO.x, BEAM_TO.y, BEAM_TO.z]}
        rotation-x={-Math.PI / 2}
        scale={[1.8, 2.5, 1]}
      >
        <circleGeometry args={[1, 40]} />
        <meshBasicMaterial
          color={BEAM_COLOR}
          transparent
          opacity={0.1}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      {/* Dust motes floating in the light. */}
      <Sparkles
        count={45}
        position={[-2.3, 0.3, -1.4]}
        scale={[3.2, 2.6, 4.5]}
        size={5}
        speed={0.25}
        opacity={0.7}
        color={BEAM_COLOR}
      />
    </>
  );
}

// Wall props that swing on their mount when clicked: [node name, swing size, speed, damping].
const SWINGERS = [
  ["Sword", 0.45, 10, 1.7],
  ["Hat", 0.7, 7.5, 1.4],
];

// `onHoverChange(bool)` reports when the pointer is over something clickable.
function Room({ onHoverChange }) {
  const { scene } = useGLTF(URL);
  const clock = useThree((state) => state.clock);

  const { clouds, swingers } = useMemo(() => {
    toonify(scene);
    return {
      clouds: [1, 2, 3].map((i) => scene.getObjectByName(`Cloud_${i}`)),
      swingers: SWINGERS.map(([name, size, speed, damping]) => {
        const object = scene.getObjectByName(name);
        object.userData.home ??= object.rotation.z;
        return { object, size, speed, damping, start: -Infinity };
      }),
    };
  }, [scene]);

  useFrame((_, dt) => {
    clouds.forEach((cloud, i) => {
      cloud.position.x += (0.1 + i * 0.035) * dt;
      if (cloud.position.x > CLOUD_MAX_X) cloud.position.x = CLOUD_MIN_X;
    });

    // A poke sets the prop swinging like a pendulum until it settles.
    for (const { object, size, speed, damping, start } of swingers) {
      const time = clock.elapsedTime - start;
      const swing =
        time < 6
          ? size * Math.exp(-damping * time) * Math.sin(speed * time)
          : 0;
      object.rotation.z = object.userData.home + swing;
    }
  });

  return (
    <>
      <primitive object={scene} />
      {/* Rendered as their own primitives so only they, not the whole room, catch clicks. */}
      {swingers.map((swinger) => (
        <primitive
          key={swinger.object.name}
          object={swinger.object}
          onClick={(e) => {
            e.stopPropagation();
            swinger.start = clock.elapsedTime;
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            onHoverChange(true);
          }}
          onPointerOut={() => onHoverChange(false)}
        />
      ))}
      <Sunbeam />
    </>
  );
}

useGLTF.preload(URL);

export default Room;
