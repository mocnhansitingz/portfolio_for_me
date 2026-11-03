import { useEffect, useState } from "react";
import * as THREE from "three";

const PIXEL_FONT = '"Press Start 2P", monospace';
const SCREEN_BG = "#C9F2DE";
const SCREEN_INK = "#1C3B33";

// Canvas text needs the web font to be loaded before drawing.
export function useFontReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    document.fonts
      .load(`16px ${PIXEL_FONT}`)
      .catch(() => {})
      .then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

function toTexture(canvas) {
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

function wrap(ctx, text, maxWidth) {
  const lines = [];
  let line = "";
  for (const word of text.split(" ")) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}

// Shrinks the font until the text fits on a single line.
function fitFont(ctx, text, maxWidth, size) {
  do {
    ctx.font = `${size}px ${PIXEL_FONT}`;
    size -= 2;
  } while (ctx.measureText(text).width > maxWidth && size > 8);
}

export function makeLabelTexture(title) {
  const canvas = document.createElement("canvas");
  canvas.width = 544;
  canvas.height = 96;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#2B1B12";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  fitFont(ctx, title.toUpperCase(), canvas.width - 40, 38);
  ctx.fillText(title.toUpperCase(), canvas.width / 2, canvas.height / 2 + 4);
  return toTexture(canvas);
}

export function makeScreenTexture(project) {
  const canvas = document.createElement("canvas");
  const w = (canvas.width = 760);
  const h = (canvas.height = 495);
  const ctx = canvas.getContext("2d");

  ctx.fillStyle = SCREEN_BG;
  ctx.fillRect(0, 0, w, h);

  ctx.fillStyle = project.color;
  ctx.fillRect(0, 0, w, 72);
  ctx.fillRect(0, h - 20, w, 20);

  ctx.fillStyle = SCREEN_INK;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.font = `20px ${PIXEL_FONT}`;
  ctx.fillText("▶ NOW PLAYING", 32, 38);

  ctx.textAlign = "center";
  ctx.font = `44px ${PIXEL_FONT}`;
  const lines = wrap(ctx, project.title.toUpperCase(), w - 80).slice(0, 3);
  const lineHeight = 64;
  const top = 72 + (h - 72 - 90) / 2 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, i) => ctx.fillText(line, w / 2, top + i * lineHeight));

  const tags = (project.tags ?? []).join(" · ").toUpperCase();
  fitFont(ctx, tags, w - 80, 20);
  ctx.fillText(tags, w / 2, h - 62);

  // Faint scanlines for a handheld-console feel.
  ctx.fillStyle = "rgba(28, 59, 51, 0.07)";
  for (let y = 0; y < h; y += 6) ctx.fillRect(0, y, w, 2);

  return toTexture(canvas);
}
