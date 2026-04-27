import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";

interface BoxGlowLayerProps {
  boardRef: RefObject<HTMLDivElement | null>;
}

type Rgb = readonly [number, number, number];

const thermalStops: readonly { color: Rgb; stop: number }[] = [
  { stop: 0, color: [0, 0, 0] },
  { stop: 0.18, color: [4, 21, 112] },
  { stop: 0.38, color: [15, 87, 255] },
  { stop: 0.54, color: [64, 211, 255] },
  { stop: 0.68, color: [231, 226, 61] },
  { stop: 0.84, color: [255, 105, 18] },
  { stop: 1, color: [255, 242, 196] },
];

const HEAT_FIELD_FPS = 24;
const HEAT_FIELD_SCALE = 0.58;
const createBoxRects = () => Array.from({ length: 9 }, () => new THREE.Vector4(0, 0, 0, 0));

const updateBoxRects = (board: HTMLDivElement, boxRects: THREE.Vector4[], dpr: number) => {
  const boardRect = board.getBoundingClientRect();
  const boxes = [...board.querySelectorAll<HTMLElement>("[data-mandal-box]")];

  boxRects.forEach((rect) => rect.set(0, 0, 0, 0));

  boxes.forEach((box, index) => {
    const rect = box.getBoundingClientRect();
    const centerX = (rect.left - boardRect.left + rect.width / 2) * dpr;
    const centerY = (rect.top - boardRect.top + rect.height / 2) * dpr;
    const halfWidth = (rect.width / 2) * dpr;
    const halfHeight = (rect.height / 2) * dpr;

    boxRects[index]?.set(centerX, centerY, halfWidth, halfHeight);
  });
};

const interpolateColor = (from: Rgb, to: Rgb, progress: number): Rgb => [
  from[0] + (to[0] - from[0]) * progress,
  from[1] + (to[1] - from[1]) * progress,
  from[2] + (to[2] - from[2]) * progress,
];

const thermalColor = (heat: number, alpha: number) => {
  const t = Math.min(1, Math.max(0, heat));

  for (let index = 1; index < thermalStops.length; index += 1) {
    const prev = thermalStops[index - 1];
    const next = thermalStops[index];

    if (t <= next.stop) {
      const progress = (t - prev.stop) / (next.stop - prev.stop);
      const [r, g, b] = interpolateColor(prev.color, next.color, progress);

      return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${alpha})`;
    }
  }

  const [r, g, b] = thermalStops[thermalStops.length - 1].color;

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const r = Math.min(radius, width / 2, height / 2);

  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
};

const drawThermalBlob = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  rotation: number,
  heat: number
) => {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(1.22, 0.72);

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
  gradient.addColorStop(0, thermalColor(0.9, 0.34));
  gradient.addColorStop(0.22, thermalColor(Math.min(1, heat + 0.12), 0.32));
  gradient.addColorStop(0.46, thermalColor(0.58, 0.22));
  gradient.addColorStop(0.72, thermalColor(0.32, 0.2));
  gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
};

const strokeRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  drawRoundedRect(ctx, x, y, width, height, radius);
  ctx.stroke();
};

const drawBoxHeat = (
  ctx: CanvasRenderingContext2D,
  rect: THREE.Vector4,
  boxIndex: number,
  dpr: number,
  time: number
) => {
  if (rect.z <= 0 || rect.w <= 0) return;

  const width = rect.z * 2;
  const height = rect.w * 2;
  const x = rect.x - rect.z;
  const y = rect.y - rect.w;
  const radius = Math.min(rect.z, rect.w) * 0.13;
  const seed = boxIndex * 1.83;
  const centerBoost = boxIndex === 4 ? 1.22 : 1;

  ctx.save();
  ctx.globalCompositeOperation = "screen";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  ctx.filter = `blur(${11 * dpr}px)`;
  ctx.lineWidth = 34 * dpr;
  ctx.strokeStyle = thermalColor(0.25, 0.07 * centerBoost);
  strokeRoundedRect(ctx, x, y, width, height, radius);

  ctx.filter = `blur(${5.5 * dpr}px)`;
  ctx.lineWidth = 16 * dpr;
  ctx.strokeStyle = thermalColor(0.48, 0.09 * centerBoost);
  strokeRoundedRect(ctx, x, y, width, height, radius);

  ctx.filter = "none";
  for (let side = 0; side < 4; side += 1) {
    const count = 3;

    for (let index = 0; index < count; index += 1) {
      const progress = (index + 0.5) / count;
      const phase = time * (0.72 + side * 0.09) + seed * 2.8 + index * 1.91;
      const pulse = Math.sin(phase) * 0.5 + 0.5;
      const flicker = Math.sin(phase * 1.7 + boxIndex) * 0.5 + 0.5;
      const tangentJitter = (flicker - 0.5) * 16 * dpr;
      const distance = (7 + pulse * 24 + Math.pow(flicker, 3) * 32) * dpr;
      const blobRadius = (12 + pulse * 18 + flicker * 13) * dpr * centerBoost;
      const heat = 0.72 + pulse * 0.22 + (boxIndex === 4 ? 0.06 : 0);

      let blobX = x + width * progress;
      let blobY = y;
      let normalX = 0;
      let normalY = -1;
      let rotation = 0;

      if (side === 1) {
        blobX = x + width;
        blobY = y + height * progress;
        normalX = 1;
        normalY = 0;
        rotation = Math.PI / 2;
      } else if (side === 2) {
        blobX = x + width * (1 - progress);
        blobY = y + height;
        normalX = 0;
        normalY = 1;
        rotation = Math.PI;
      } else if (side === 3) {
        blobX = x;
        blobY = y + height * (1 - progress);
        normalX = -1;
        normalY = 0;
        rotation = -Math.PI / 2;
      }

      blobX += normalX * distance + (side % 2 === 0 ? tangentJitter : 0);
      blobY += normalY * distance + (side % 2 === 1 ? tangentJitter : 0);

      drawThermalBlob(ctx, blobX, blobY, blobRadius, rotation + (pulse - 0.5) * 0.7, heat);
    }
  }

  ctx.filter = `blur(${2.2 * dpr}px)`;
  ctx.lineWidth = 5 * dpr;
  ctx.strokeStyle = thermalColor(0.84, 0.28 * centerBoost);
  strokeRoundedRect(ctx, x, y, width, height, radius);

  ctx.filter = "none";
  ctx.lineWidth = 1 * dpr;
  ctx.strokeStyle = thermalColor(0.92, 0.28 * centerBoost);
  strokeRoundedRect(ctx, x, y, width, height, radius);
  ctx.restore();
};

const eraseBoxInteriors = (ctx: CanvasRenderingContext2D, boxRects: THREE.Vector4[], dpr: number) => {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.filter = "none";
  ctx.fillStyle = "#000";

  boxRects.forEach((rect) => {
    if (rect.z <= 0 || rect.w <= 0) return;

    const inset = 12 * dpr;
    const x = rect.x - rect.z + inset;
    const y = rect.y - rect.w + inset;
    const width = rect.z * 2 - inset * 2;
    const height = rect.w * 2 - inset * 2;

    drawRoundedRect(ctx, x, y, width, height, Math.min(rect.z, rect.w) * 0.1);
    ctx.fill();
  });

  ctx.restore();
};

const paintHeatField = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  boxRects: THREE.Vector4[],
  dpr: number,
  time: number
) => {
  ctx.clearRect(0, 0, width, height);

  boxRects.forEach((rect, index) => drawBoxHeat(ctx, rect, index, dpr, time));
  eraseBoxInteriors(ctx, boxRects, dpr);
};

const BoxGlowLayer = ({ boardRef }: BoxGlowLayerProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Renders a Three.js texture layer from the live DOM box geometry, then masks
   * interiors so the animated heat behaves like an eclipse around real divs.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const board = boardRef.current ?? (canvas.parentElement instanceof HTMLDivElement ? canvas.parentElement : null);
    if (!board) return;

    const textureCanvas = document.createElement("canvas");
    const textureContext = textureCanvas.getContext("2d");
    if (!textureContext) return;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      preserveDrawingBuffer: true,
      premultipliedAlpha: false,
      powerPreference: "high-performance",
    });
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.magFilter = THREE.LinearFilter;
    texture.minFilter = THREE.LinearFilter;

    const material = new THREE.MeshBasicMaterial({
      blending: THREE.NormalBlending,
      depthWrite: false,
      map: texture,
      transparent: true,
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    const boxRects = createBoxRects();

    scene.add(mesh);

    let dpr = 1;
    let width = 1;
    let height = 1;

    const rebuild = () => {
      width = Math.max(1, board.clientWidth);
      height = Math.max(1, board.clientHeight);
      dpr = Math.max(0.45, Math.min(window.devicePixelRatio || 1, 1.45) * HEAT_FIELD_SCALE);

      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.25));
      renderer.setSize(width, height, false);
      textureCanvas.width = Math.round(width * dpr);
      textureCanvas.height = Math.round(height * dpr);
      updateBoxRects(board, boxRects, dpr);
    };

    let raf = 0;
    let lastRender = 0;
    const clock = new THREE.Clock();
    const render = (timestamp = 0) => {
      if (timestamp - lastRender >= 1000 / HEAT_FIELD_FPS) {
        paintHeatField(textureContext, textureCanvas.width, textureCanvas.height, boxRects, dpr, clock.getElapsedTime());
        texture.needsUpdate = true;
        renderer.render(scene, camera);
        lastRender = timestamp;
      }

      raf = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(rebuild);
    resizeObserver.observe(board);
    rebuild();
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      mesh.geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, [boardRef]);

  return <canvas ref={canvasRef} className="box-glow-layer" aria-hidden="true" />;
};

export { BoxGlowLayer };
