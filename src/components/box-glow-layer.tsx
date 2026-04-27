import { useEffect, type RefObject } from "react";
import * as THREE from "three";

type GlowRing = {
  baseOpacity: number;
  boardIndex: number;
  material: THREE.MeshBasicMaterial;
};

type BoxGlowLayerProps = {
  boardRef: RefObject<HTMLDivElement | null>;
};

const thermalStops = [
  { stop: 0, color: new THREE.Color("#061653") },
  { stop: 0.35, color: new THREE.Color("#1a58ff") },
  { stop: 0.55, color: new THREE.Color("#72d6ff") },
  { stop: 0.75, color: new THREE.Color("#f5df4d") },
  { stop: 0.9, color: new THREE.Color("#ff8f2f") },
  { stop: 1, color: new THREE.Color("#fff0ba") },
];

const tempColor = new THREE.Color();

function setThermalColor(target: THREE.Color, heat: number) {
  const t = Math.min(1, Math.max(0, heat));

  for (let index = 1; index < thermalStops.length; index += 1) {
    const prev = thermalStops[index - 1];
    const next = thermalStops[index];

    if (t <= next.stop) {
      const localT = (t - prev.stop) / (next.stop - prev.stop);
      return target.copy(prev.color).lerp(next.color, localT);
    }
  }

  return target.copy(thermalStops[thermalStops.length - 1].color);
}

function roundedRectPath(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  const path = new THREE.Path();

  path.moveTo(x + r, y);
  path.lineTo(x + width - r, y);
  path.quadraticCurveTo(x + width, y, x + width, y + r);
  path.lineTo(x + width, y + height - r);
  path.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  path.lineTo(x + r, y + height);
  path.quadraticCurveTo(x, y + height, x, y + height - r);
  path.lineTo(x, y + r);
  path.quadraticCurveTo(x, y, x + r, y);

  return path;
}

function roundedRectShape(x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  const shape = new THREE.Shape();

  shape.moveTo(x + r, y);
  shape.lineTo(x + width - r, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + r);
  shape.lineTo(x + width, y + height - r);
  shape.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  shape.lineTo(x + r, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - r);
  shape.lineTo(x, y + r);
  shape.quadraticCurveTo(x, y, x + r, y);

  return shape;
}

function createBorderRingGeometry(rect: DOMRect, boardRect: DOMRect, layer: number) {
  const x = rect.left - boardRect.left;
  const y = boardRect.height - (rect.top - boardRect.top) - rect.height;
  const width = rect.width;
  const height = rect.height;
  const thickness = [2.5, 8, 18][layer];
  const radius = Math.min(width, height) * 0.08;
  const outer = roundedRectShape(
    x - thickness,
    y - thickness,
    width + thickness * 2,
    height + thickness * 2,
    radius + thickness
  );
  const inner = roundedRectPath(
    x + thickness,
    y + thickness,
    Math.max(1, width - thickness * 2),
    Math.max(1, height - thickness * 2),
    Math.max(1, radius - thickness * 0.4)
  );

  outer.holes.push(inner);
  return new THREE.ShapeGeometry(outer, 18);
}

function disposeScene(group: THREE.Group) {
  group.traverse((object) => {
    if (object instanceof THREE.Mesh) {
      object.geometry.dispose();
      object.material.dispose();
    }
  });
  group.clear();
}

export function BoxGlowLayer({ boardRef }: BoxGlowLayerProps) {
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;

    const canvas = board.querySelector<HTMLCanvasElement>(".box-glow-layer");
    if (!canvas) return;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      canvas,
      preserveDrawingBuffer: true,
      powerPreference: "high-performance",
    });
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(0, 1, 1, 0, -10, 10);
    const group = new THREE.Group();
    const rings: GlowRing[] = [];

    scene.add(group);

    const rebuild = () => {
      const boardRect = board.getBoundingClientRect();
      const width = Math.max(1, boardRect.width);
      const height = Math.max(1, boardRect.height);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.7);

      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);

      camera.left = 0;
      camera.right = width;
      camera.top = height;
      camera.bottom = 0;
      camera.updateProjectionMatrix();

      disposeScene(group);
      rings.length = 0;

      const boxes = [...board.querySelectorAll<HTMLElement>("[data-mandal-box]")];

      for (const box of boxes) {
        const boardIndex = Number(box.dataset.mandalBox ?? 0);
        const rect = box.getBoundingClientRect();

        [0, 1, 2].forEach((layer) => {
          const material = new THREE.MeshBasicMaterial({
            blending: THREE.AdditiveBlending,
            color: "#3a8dff",
            depthWrite: false,
            opacity: [0.72, 0.23, 0.1][layer],
            transparent: true,
          });
          const mesh = new THREE.Mesh(createBorderRingGeometry(rect, boardRect, layer), material);
          mesh.renderOrder = 10 + layer;
          group.add(mesh);
          rings.push({
            baseOpacity: [0.72, 0.23, 0.1][layer],
            boardIndex,
            material,
          });
        });
      }
    };

    let raf = 0;
    const clock = new THREE.Clock();
    const render = () => {
      const elapsed = clock.getElapsedTime();

      for (const ring of rings) {
        const isCenter = ring.boardIndex === 4;
        const pulse = Math.sin(elapsed * 0.72 + ring.boardIndex * 0.68) * 0.5 + 0.5;
        const heat = isCenter ? 0.58 + pulse * 0.35 : 0.18 + pulse * 0.34;

        setThermalColor(tempColor, heat);
        ring.material.color.copy(tempColor);
        ring.material.opacity = ring.baseOpacity * (0.58 + pulse * 0.55) * (isCenter ? 1.24 : 1);
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };

    const resizeObserver = new ResizeObserver(rebuild);
    resizeObserver.observe(board);
    rebuild();
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      disposeScene(group);
      renderer.dispose();
    };
  }, [boardRef]);

  return <canvas className="box-glow-layer" aria-hidden="true" />;
}
