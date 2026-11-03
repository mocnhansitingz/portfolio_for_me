import { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import { modelUrl, toonify } from "./toonify";
import { makeScreenTexture, useFontReady } from "./textures";
import { SNAKE_CANVAS } from "../../game/snake";

const URL = modelUrl("bmo");

// BMO sits turned to the side so its lettered flank shows, and faces forward while a project plays.
const REST_TURN = 0.55;
// Local z of the front face; anything in front of it can be a button hit.
const FRONT_Z = 0.32;
// Arm rotation (around the shoulder) that lifts a resting arm up for a wave.
const ARM_RAISED = 2.2;

const BLINK_INTERVAL = 3.4;
const BLINK_DURATION = 0.13;
const IDLE_WAVE_INTERVAL = 11;
const IDLE_WAVE_DURATION = 1.8;
const PRESS_DURATION = 0.18;
const PRESS_DEPTH = 0.022;
const DPAD_TILT = 0.2;

// Pressable buttons: hit radius on the front face and the reaction each one triggers.
// The d-pad picks its reaction from the arm that was pressed.
const BUTTONS = {
  BMO_Btn_Dpad: { radius: 0.17 },
  BMO_Btn_Triangle: { radius: 0.105, reaction: "surprise" },
  BMO_Btn_Green: { radius: 0.075, reaction: "happy" },
  BMO_Btn_Red: { radius: 0.115, reaction: "spin" },
  BMO_Btn_Blue: { radius: 0.07, reaction: "wink" },
  BMO_Btn_Dash1: { radius: 0.075, reaction: "sleepy" },
  BMO_Btn_Dash2: { radius: 0.075, reaction: "shy" },
};

const REACTION_SECONDS = {
  left: 0.9,
  right: 0.9,
  up: 0.9,
  down: 0.9,
  surprise: 1.2,
  happy: 1.7,
  spin: 1.5,
  wink: 1.4,
  sleepy: 2.4,
  shy: 2.0,
};

const damp = THREE.MathUtils.damp;
const clamp = THREE.MathUtils.clamp;
const easeInOut = (x) => x * x * (3 - 2 * x);
// 0 -> 1 -> 0 over `seconds`, then stays at 0.
const arc = (time, seconds) => Math.sin(Math.PI * clamp(time / seconds, 0, 1));

// How BMO looks and moves `time` seconds into a reaction. `mouth: null` keeps the default.
function reactionPose(type, time) {
  const pose = {
    eyes: "normal", // "normal" | "happy" | "closed" | "wink"
    mouth: null, // "smile" | "open" | "o"
    blush: false,
    eyeX: 0,
    eyeY: 0,
    eyeScale: 1,
    leanX: 0,
    leanZ: 0,
    hop: 0,
    spin: 0,
    armL: 0,
    armR: 0,
  };

  switch (type) {
    case "left":
      pose.eyeX = -0.06;
      pose.leanZ = 0.13;
      break;
    case "right":
      pose.eyeX = 0.06;
      pose.leanZ = -0.13;
      break;
    case "up":
      pose.eyeY = 0.045;
      pose.hop = arc(time, 0.5) * 0.08;
      break;
    case "down":
      pose.eyeY = -0.045;
      pose.leanX = 0.14;
      break;
    case "surprise":
      pose.mouth = "o";
      pose.eyeScale = 1.35;
      pose.hop = arc(time, 0.45) * 0.2;
      pose.armL = pose.armR = 0.7;
      break;
    case "happy":
      pose.eyes = "happy";
      pose.mouth = "open";
      pose.hop = Math.abs(Math.sin(time * 10)) * 0.05;
      pose.armL = ARM_RAISED + Math.sin(time * 12) * 0.2;
      pose.armR = ARM_RAISED - Math.sin(time * 12) * 0.2;
      break;
    case "spin": {
      const spinning = time < 0.9;
      pose.spin = Math.PI * 2 * easeInOut(clamp(time / 0.9, 0, 1));
      pose.mouth = spinning ? "o" : "open";
      pose.eyes = spinning ? "normal" : "happy";
      pose.armL = pose.armR = spinning ? 1.2 : 0;
      break;
    }
    case "wink":
      pose.eyes = "wink";
      pose.mouth = "smile";
      pose.armR = ARM_RAISED + Math.sin(time * 14) * 0.22;
      break;
    case "sleepy":
      pose.eyes = "closed";
      pose.mouth = "o";
      pose.leanX = arc(time, REACTION_SECONDS.sleepy) * 0.12;
      break;
    case "shy":
      pose.blush = true;
      pose.mouth = "smile";
      pose.eyeX = -0.03;
      pose.eyeY = -0.03;
      pose.leanZ = Math.sin(time * 6) * 0.04;
      break;
  }
  return pose;
}

// `project` is the cassette currently loaded into BMO, or null while idle.
// `game` is the running mini game when that cassette is a game; it takes over the screen and d-pad.
// `lookAt` is the [x, z] table spot BMO is curious about, `excited` opens its mouth,
// `focused` turns it to face the camera. `onHoverChange(bool)` reports button hover.
function Bmo({ project, game, lookAt, excited, focused, onHoverChange }) {
  const { scene } = useGLTF(URL);
  const clock = useThree((state) => state.clock);
  const group = useRef();
  const fontReady = useFontReady();

  const turn = useRef(REST_TURN);
  const reaction = useRef({ type: null, start: 0 });
  const press = useRef({ name: null, start: 0, direction: null });
  const hovered = useRef(null);

  const parts = useMemo(() => {
    toonify(scene);
    const get = (name) => scene.getObjectByName(name);
    const remember = (o) => {
      o.userData.home ??= o.position.clone();
      return o;
    };
    return {
      eyes: ["BMO_EyeL", "BMO_EyeR"].map((n) => remember(get(n))),
      happyEyes: ["BMO_EyeHappyL", "BMO_EyeHappyR"].map(get),
      blush: ["BMO_BlushL", "BMO_BlushR"].map(get),
      smile: get("BMO_Mouth"),
      openMouth: get("BMO_MouthOpen"),
      roundMouth: get("BMO_MouthO"),
      armL: get("BMO_ArmL"),
      armR: get("BMO_ArmR"),
      buttons: Object.fromEntries(
        Object.keys(BUTTONS).map((name) => [name, remember(get(name))]),
      ),
    };
  }, [scene]);

  const screenTexture = useMemo(
    () => (project && !game && fontReady ? makeScreenTexture(project) : null),
    [project, game, fontReady],
  );
  useEffect(() => () => screenTexture?.dispose(), [screenTexture]);

  // The game paints into its own canvas, re-uploaded whenever a frame changes.
  const gameScreen = useMemo(() => {
    if (!game || !fontReady) return null;
    const canvas = document.createElement("canvas");
    canvas.width = SNAKE_CANVAS.width;
    canvas.height = SNAKE_CANVAS.height;
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    const ctx = canvas.getContext("2d");
    game.draw(ctx);
    return { ctx, texture };
  }, [game, fontReady]);
  useEffect(() => () => gameScreen?.texture.dispose(), [gameScreen]);

  // Finds the button under the pointer, and for the d-pad which arm was hit.
  const pickButton = (e) => {
    const p = group.current.worldToLocal(e.point.clone());
    if (p.z < FRONT_Z - 0.03) return null;

    let name = null;
    let best = 1;
    for (const [key, { radius }] of Object.entries(BUTTONS)) {
      const home = parts.buttons[key].userData.home;
      const score = Math.hypot(p.x - home.x, p.y - home.y) / radius;
      if (score < best) {
        name = key;
        best = score;
      }
    }
    if (!name) return null;

    let direction = null;
    if (name === "BMO_Btn_Dpad") {
      const home = parts.buttons[name].userData.home;
      const dx = p.x - home.x;
      const dy = p.y - home.y;
      if (Math.abs(dx) > Math.abs(dy)) direction = dx > 0 ? "right" : "left";
      else direction = dy > 0 ? "up" : "down";
    }
    return { name, direction };
  };

  const setHovered = (name) => {
    if (hovered.current === name) return;
    hovered.current = name;
    onHoverChange(name !== null);
  };

  const pressButton = ({ name, direction }) => {
    const now = clock.elapsedTime;
    press.current = { name, start: now, direction };
    if (game) {
      // While a game runs the buttons play it instead of tickling BMO.
      if (direction) game.turn(direction);
      else game.press();
      return;
    }
    reaction.current = {
      type: direction ?? BUTTONS[name].reaction,
      start: now,
    };
  };

  useFrame((_, dt) => {
    const t = clock.elapsedTime;
    const g = group.current;
    const face = !project;

    const active = reaction.current;
    let reactionTime = 0;
    if (active.type) {
      reactionTime = t - active.start;
      if (reactionTime > REACTION_SECONDS[active.type]) active.type = null;
    }
    const reacting = active.type !== null;
    const pose = reactionPose(active.type, reactionTime);

    if (gameScreen && game.update(dt)) {
      game.draw(gameScreen.ctx);
      gameScreen.texture.needsUpdate = true;
    }

    // Body: turn towards whatever is interesting, sway, lean and hop.
    const turnTarget = focused
      ? 0
      : REST_TURN + (lookAt ? clamp(lookAt[0] * 0.1, -0.2, 0.2) : 0);
    turn.current = damp(turn.current, turnTarget, 5, dt);
    g.rotation.y = turn.current + pose.spin;
    g.rotation.z = damp(
      g.rotation.z,
      // No idle sway during a game, so the screen holds still.
      (game ? 0 : Math.sin(t * 1.3) * 0.02) + pose.leanZ,
      10,
      dt,
    );
    g.rotation.x = damp(g.rotation.x, pose.leanX, 10, dt);
    const joy = excited && face ? Math.abs(Math.sin(t * 7)) * 0.035 : 0;
    g.position.y = damp(g.position.y, pose.hop + joy, 18, dt);

    // Eyes: follow the hovered cassette (in BMO's own frame), blink, or do what the reaction says.
    let lookX = pose.eyeX;
    let lookY = pose.eyeY;
    if (lookAt && !reacting) {
      const localX =
        lookAt[0] * Math.cos(turn.current) - lookAt[1] * Math.sin(turn.current);
      lookX = clamp(localX * 0.035, -0.05, 0.05);
      lookY = -0.03;
    }
    const blinking = t % BLINK_INTERVAL < BLINK_DURATION;
    parts.eyes.forEach((eye, i) => {
      const home = eye.userData.home;
      const shut =
        blinking || pose.eyes === "closed" || (pose.eyes === "wink" && i === 1);
      eye.visible = face && pose.eyes !== "happy";
      eye.position.x = damp(eye.position.x, home.x + lookX, 12, dt);
      eye.position.y = damp(eye.position.y, home.y + lookY, 12, dt);
      eye.scale.set(pose.eyeScale, shut ? 0.12 : pose.eyeScale, 1);
    });
    parts.happyEyes.forEach((eye) => {
      eye.visible = face && pose.eyes === "happy";
    });
    parts.blush.forEach((cheek) => {
      cheek.visible = face && pose.blush;
    });

    const mouth = pose.mouth ?? (excited ? "open" : "smile");
    parts.smile.visible = face && mouth === "smile";
    parts.openMouth.visible = face && mouth === "open";
    parts.roundMouth.visible = face && mouth === "o";

    // Arms rest on the table; the right one waves hello now and then or when excited.
    let armL = pose.armL;
    let armR = pose.armR;
    if (!reacting && face) {
      const idleWave = t % IDLE_WAVE_INTERVAL < IDLE_WAVE_DURATION;
      if (excited) armR = ARM_RAISED + Math.sin(t * 11) * 0.22;
      else if (idleWave) armR = ARM_RAISED + Math.sin(t * 9) * 0.22;
    }
    parts.armL.rotation.z = damp(parts.armL.rotation.z, -armL, 10, dt);
    parts.armR.rotation.z = damp(parts.armR.rotation.z, armR, 10, dt);

    // Buttons sink in when pressed (the d-pad rocks) and swell a little under the pointer.
    const pressed = press.current;
    const pressing = t - pressed.start < PRESS_DURATION;
    for (const [name, button] of Object.entries(parts.buttons)) {
      const down = pressing && pressed.name === name;
      const rocking = down ? pressed.direction : null;
      const depth = down && !rocking ? PRESS_DEPTH : 0;
      button.position.z = damp(
        button.position.z,
        button.userData.home.z - depth,
        30,
        dt,
      );
      button.rotation.x = damp(
        button.rotation.x,
        rocking === "up" ? -DPAD_TILT : rocking === "down" ? DPAD_TILT : 0,
        30,
        dt,
      );
      button.rotation.y = damp(
        button.rotation.y,
        rocking === "right" ? DPAD_TILT : rocking === "left" ? -DPAD_TILT : 0,
        30,
        dt,
      );
      button.scale.setScalar(
        damp(button.scale.x, hovered.current === name ? 1.1 : 1, 15, dt),
      );
    }
  });

  return (
    <group ref={group} rotation-y={REST_TURN}>
      <primitive
        object={scene}
        onPointerMove={(e) => {
          e.stopPropagation();
          setHovered(pickButton(e)?.name ?? null);
        }}
        onPointerOut={() => setHovered(null)}
        onPointerDown={(e) => {
          e.stopPropagation();
          const hit = pickButton(e);
          if (hit) pressButton(hit);
        }}
        onClick={(e) => e.stopPropagation()}
      />
      {(gameScreen || screenTexture) && (
        <mesh position={[0, 1.0325, 0.352]}>
          <planeGeometry args={[0.76, 0.495]} />
          <meshBasicMaterial map={gameScreen?.texture ?? screenTexture} />
        </mesh>
      )}
    </group>
  );
}

useGLTF.preload(URL);

export default Bmo;
