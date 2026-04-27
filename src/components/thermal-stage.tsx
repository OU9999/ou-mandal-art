import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

type Tile = {
  boardIndex: number;
  edge: THREE.LineSegments<THREE.EdgesGeometry, THREE.LineBasicMaterial>;
  globalIndex: number;
  glow: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>;
  homeZ: number;
  mesh: THREE.Mesh<THREE.ExtrudeGeometry, THREE.MeshPhysicalMaterial>;
  seed: number;
  top: THREE.Mesh<THREE.ShapeGeometry, THREE.MeshBasicMaterial>;
  x: number;
  y: number;
};

type Frame = {
  boardIndex: number;
  material: THREE.MeshBasicMaterial;
  seed: number;
};

const thermalStops = [
  { stop: 0, color: new THREE.Color("#02030b") },
  { stop: 0.18, color: new THREE.Color("#061653") },
  { stop: 0.32, color: new THREE.Color("#1138b3") },
  { stop: 0.48, color: new THREE.Color("#2a7cff") },
  { stop: 0.62, color: new THREE.Color("#8ddcff") },
  { stop: 0.76, color: new THREE.Color("#f7dd4c") },
  { stop: 0.9, color: new THREE.Color("#ff892f") },
  { stop: 1, color: new THREE.Color("#fff0b8") },
];

const baseSurface = new THREE.Color("#02030a");
const tempColor = new THREE.Color();

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function setThermalColor(target: THREE.Color, heat: number) {
  const t = clamp01(heat);

  for (let i = 1; i < thermalStops.length; i += 1) {
    const prev = thermalStops[i - 1];
    const next = thermalStops[i];

    if (t <= next.stop) {
      const localT = (t - prev.stop) / (next.stop - prev.stop);
      target.copy(prev.color).lerp(next.color, localT);
      return target;
    }
  }

  return target.copy(thermalStops[thermalStops.length - 1].color);
}

function createRoundedRectShape(width: number, height: number, radius: number) {
  const x = -width / 2;
  const y = -height / 2;
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

function createTileGeometry(width: number, height: number, depth: number) {
  const geometry = new THREE.ExtrudeGeometry(createRoundedRectShape(width, height, 0.09), {
    bevelEnabled: true,
    bevelSegments: 5,
    bevelSize: 0.018,
    bevelThickness: 0.026,
    curveSegments: 14,
    depth,
    steps: 1,
  });

  geometry.center();
  return geometry;
}

function createGlowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createRadialGradient(
    size / 2,
    size / 2,
    0,
    size / 2,
    size / 2,
    size / 2
  );
  gradient.addColorStop(0, "rgba(255,255,255,0.74)");
  gradient.addColorStop(0.28, "rgba(255,255,255,0.28)");
  gradient.addColorStop(0.68, "rgba(255,255,255,0.06)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSweepTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext("2d");
  if (!context) return null;

  const gradient = context.createLinearGradient(0, 0, 0, size);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.35, "rgba(255,255,255,0.08)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.5)");
  gradient.addColorStop(0.65, "rgba(255,255,255,0.08)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");

  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function disposeMaterial(material: THREE.Material | THREE.Material[]) {
  if (Array.isArray(material)) {
    material.forEach((entry) => entry.dispose());
    return;
  }

  material.dispose();
}

export function ThermalStage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas,
        powerPreference: "high-performance",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      window.setTimeout(() => setError(message), 0);
      return;
    }

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000");
    scene.fog = new THREE.FogExp2("#02040c", 0.035);

    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.set(0, -0.12, 8.4);
    camera.lookAt(0, 0, 0);

    renderer.setClearColor("#000000", 1);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.03;

    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.74, 0.46, 0.18);
    const outputPass = new OutputPass();
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    composer.addPass(outputPass);

    const mandal = new THREE.Group();
    mandal.rotation.set(-0.58, 0.18, -0.01);
    scene.add(mandal);

    const glowTexture = createGlowTexture();
    const sweepTexture = createSweepTexture();
    const tiles: Tile[] = [];
    const frames: Frame[] = [];
    const interactiveMeshes: THREE.Object3D[] = [];

    const cellSize = 0.56;
    const cellPitch = 0.68;
    const blockGap = 0.24;
    const tileDepth = 0.07;
    const boardSpan = cellPitch * 2 + cellSize;
    const totalSpan = cellPitch * 8 + blockGap * 2 + cellSize;

    const tileGeometry = createTileGeometry(cellSize, cellSize, tileDepth);
    const topGeometry = new THREE.ShapeGeometry(createRoundedRectShape(cellSize * 0.9, cellSize * 0.9, 0.07), 14);
    const edgeGeometry = new THREE.EdgesGeometry(tileGeometry, 24);
    const glowGeometry = new THREE.PlaneGeometry(cellSize * 1.72, cellSize * 1.72);
    const frameBarGeometry = new THREE.BoxGeometry(1, 1, 0.025);
    const baseGeometry = createTileGeometry(totalSpan + 0.7, totalSpan + 0.7, 0.05);

    const basePlate = new THREE.Mesh(
      baseGeometry,
      new THREE.MeshPhysicalMaterial({
        clearcoat: 0.85,
        clearcoatRoughness: 0.36,
        color: "#010107",
        metalness: 0.55,
        roughness: 0.42,
      })
    );
    basePlate.position.z = -0.105;
    mandal.add(basePlate);

    if (glowTexture) {
      const haloGeometry = new THREE.PlaneGeometry(totalSpan * 1.65, totalSpan * 1.65);
      const halo = new THREE.Mesh(
        haloGeometry,
        new THREE.MeshBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: "#164dff",
          depthWrite: false,
          map: glowTexture,
          opacity: 0.38,
          transparent: true,
        })
      );
      halo.position.z = -0.16;
      mandal.add(halo);

      const coreHalo = new THREE.Mesh(
        new THREE.PlaneGeometry(totalSpan * 0.62, totalSpan * 0.62),
        new THREE.MeshBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: "#ff9d35",
          depthWrite: false,
          map: glowTexture,
          opacity: 0.18,
          transparent: true,
        })
      );
      coreHalo.position.z = -0.13;
      mandal.add(coreHalo);
    }

    const sweep = new THREE.Mesh(
      new THREE.PlaneGeometry(totalSpan * 1.18, totalSpan * 0.34),
      new THREE.MeshBasicMaterial({
        blending: THREE.AdditiveBlending,
        color: "#ffb34e",
        depthWrite: false,
        map: sweepTexture ?? undefined,
        opacity: 0.2,
        transparent: true,
      })
    );
    sweep.position.z = 0.18;
    mandal.add(sweep);

    for (let boardY = 0; boardY < 3; boardY += 1) {
      for (let boardX = 0; boardX < 3; boardX += 1) {
        const boardIndex = boardY * 3 + boardX;
        const boardCenterX = (boardX - 1) * (boardSpan + blockGap);
        const boardCenterY = (1 - boardY) * (boardSpan + blockGap);
        const frameMaterial = new THREE.MeshBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: "#2f7dff",
          depthWrite: false,
          opacity: 0.42,
          transparent: true,
        });
        const frameLength = boardSpan + 0.2;
        const frameThickness = 0.022;
        const frameSeed = boardIndex * 0.74 + 1.3;

        [
          { x: 0, y: frameLength / 2, sx: frameLength, sy: frameThickness },
          { x: 0, y: -frameLength / 2, sx: frameLength, sy: frameThickness },
          { x: -frameLength / 2, y: 0, sx: frameThickness, sy: frameLength },
          { x: frameLength / 2, y: 0, sx: frameThickness, sy: frameLength },
        ].forEach((bar) => {
          const mesh = new THREE.Mesh(frameBarGeometry, frameMaterial);
          mesh.position.set(boardCenterX + bar.x, boardCenterY + bar.y, 0.08);
          mesh.scale.set(bar.sx, bar.sy, 1);
          mandal.add(mesh);
        });

        frames.push({ boardIndex, material: frameMaterial, seed: frameSeed });
      }
    }

    for (let gy = 0; gy < 9; gy += 1) {
      for (let gx = 0; gx < 9; gx += 1) {
        const boardX = Math.floor(gx / 3);
        const boardY = Math.floor(gy / 3);
        const localX = gx % 3;
        const localY = gy % 3;
        const boardIndex = boardY * 3 + boardX;
        const globalIndex = gy * 9 + gx;
        const isCore = gx === 4 && gy === 4;
        const isBoardCore = localX === 1 && localY === 1;
        const x = (gx - 4) * cellPitch + (boardX - 1) * blockGap;
        const y = (4 - gy) * cellPitch + (1 - boardY) * blockGap;
        const distance = Math.hypot(gx - 4, gy - 4) / 5.65;
        const seed = globalIndex * 0.53 + boardIndex * 1.17;

        const material = new THREE.MeshPhysicalMaterial({
          clearcoat: 0.95,
          clearcoatRoughness: 0.22,
          color: baseSurface,
          emissive: "#071044",
          emissiveIntensity: isCore ? 0.85 : 0.24,
          metalness: 0.48,
          reflectivity: 0.62,
          roughness: 0.31,
        });

        const mesh = new THREE.Mesh(tileGeometry, material);
        const homeZ = isCore ? 0.052 : isBoardCore ? 0.034 : 0.018;
        mesh.position.set(x, y, homeZ);
        mesh.scale.setScalar(isCore ? 1.08 : isBoardCore ? 1.035 : 1);
        mesh.userData.globalIndex = globalIndex;
        mandal.add(mesh);
        interactiveMeshes.push(mesh);

        const topMaterial = new THREE.MeshBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: isCore ? "#fff0b8" : "#246dff",
          depthWrite: false,
          opacity: isCore ? 0.34 : 0.11,
          transparent: true,
        });
        const top = new THREE.Mesh(topGeometry, topMaterial);
        top.position.set(x, y, homeZ + tileDepth / 2 + 0.024);
        top.scale.setScalar(isCore ? 1.04 : 1);
        mandal.add(top);

        const edgeMaterial = new THREE.LineBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: isCore ? "#ffe18a" : "#3d83ff",
          depthWrite: false,
          opacity: isCore ? 0.88 : 0.42,
          transparent: true,
        });
        const edge = new THREE.LineSegments(edgeGeometry, edgeMaterial);
        edge.position.copy(mesh.position);
        edge.scale.copy(mesh.scale);
        mandal.add(edge);

        const glowMaterial = new THREE.MeshBasicMaterial({
          blending: THREE.AdditiveBlending,
          color: isCore ? "#ff9a35" : "#2368ff",
          depthWrite: false,
          map: glowTexture ?? undefined,
          opacity: isCore ? 0.3 : 0.12,
          transparent: true,
        });
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(x, y, homeZ - 0.045);
        glow.scale.setScalar(isCore ? 1.45 : isBoardCore ? 1.2 : 1);
        mandal.add(glow);

        tiles.push({
          boardIndex,
          edge,
          globalIndex,
          glow,
          homeZ,
          mesh,
          seed,
          top,
          x,
          y: y - distance * 0.02,
        });
      }
    }

    const particleCount = 520;
    const particlePositions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i += 1) {
      const radius = 3.6 + Math.random() * 7.2;
      const angle = Math.random() * Math.PI * 2;
      particlePositions[i * 3] = Math.cos(angle) * radius;
      particlePositions[i * 3 + 1] = Math.sin(angle) * radius * 0.72;
      particlePositions[i * 3 + 2] = -1.2 - Math.random() * 5.6;
    }

    const particleGeometry = new THREE.BufferGeometry();
    particleGeometry.setAttribute("position", new THREE.BufferAttribute(particlePositions, 3));
    const particles = new THREE.Points(
      particleGeometry,
      new THREE.PointsMaterial({
        blending: THREE.AdditiveBlending,
        color: "#4f8cff",
        depthWrite: false,
        opacity: 0.28,
        size: 0.018,
        transparent: true,
      })
    );
    scene.add(particles);

    const ambient = new THREE.AmbientLight("#345dff", 0.42);
    const keyLight = new THREE.DirectionalLight("#d8edff", 2.1);
    const rimLight = new THREE.PointLight("#1a5dff", 8.5, 18);
    const heatLight = new THREE.PointLight("#ff9d36", 5.2, 12);
    keyLight.position.set(2.6, -3.2, 5.4);
    rimLight.position.set(-3.2, 3.4, 4.2);
    heatLight.position.set(0, -1.4, 2.4);
    scene.add(ambient, keyLight, rimLight, heatLight);

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2(0, 0);
    const targetPointer = new THREE.Vector2(0, 0);
    let hoveredIndex = -1;
    let raf = 0;
    let width = 1;
    let height = 1;

    const resize = () => {
      const rect = stage.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      const dpr = Math.min(window.devicePixelRatio || 1, 1.85);

      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      composer.setPixelRatio(dpr);
      composer.setSize(width, height);
      bloomPass.setSize(width, height);

      camera.aspect = width / height;
      camera.fov = width < 640 ? 50 : width < 980 ? 47 : 44;
      camera.position.z = width < 640 ? 8.7 : 8.2;
      camera.updateProjectionMatrix();

      const scale = width < 640 ? Math.max(0.48, Math.min(0.56, width / 760)) : width < 980 ? 0.76 : 0.9;
      mandal.scale.setScalar(scale);
      mandal.position.x = width < 640 ? 0 : width < 980 ? 0.28 : 0.72;
      mandal.position.y = width < 640 ? -0.04 : 0;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);

      targetPointer.set(x, y);
      raycaster.setFromCamera(targetPointer, camera);

      const [hit] = raycaster.intersectObjects(interactiveMeshes, false);
      hoveredIndex = typeof hit?.object.userData.globalIndex === "number" ? hit.object.userData.globalIndex : -1;
    };

    const handlePointerLeave = () => {
      targetPointer.set(0, 0);
      hoveredIndex = -1;
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);

    const clock = new THREE.Clock();
    const render = () => {
      const elapsed = clock.getElapsedTime();
      pointer.lerp(targetPointer, 0.045);

      mandal.rotation.x = -0.58 + pointer.y * 0.055 + Math.sin(elapsed * 0.16) * 0.018;
      mandal.rotation.y = 0.18 + pointer.x * 0.075 + Math.sin(elapsed * 0.11) * 0.018;
      mandal.rotation.z = -0.01 + pointer.x * 0.014;
      particles.rotation.z = elapsed * 0.018;

      const sweepPhase = (elapsed * 0.18) % 1;
      sweep.position.y = THREE.MathUtils.lerp(-totalSpan * 0.58, totalSpan * 0.58, sweepPhase);
      sweep.material.opacity = 0.08 + Math.sin(sweepPhase * Math.PI) * 0.18;
      sweep.material.color.set(sweepPhase > 0.54 ? "#ffb34e" : "#5db7ff");

      heatLight.position.x = Math.sin(elapsed * 0.32) * 1.15;
      heatLight.position.y = Math.cos(elapsed * 0.28) * 1.25 - 0.35;
      rimLight.intensity = 7.2 + Math.sin(elapsed * 0.42) * 1.4;

      for (const frame of frames) {
        const pulse = 0.5 + Math.sin(elapsed * 0.72 + frame.seed) * 0.5;
        setThermalColor(tempColor, 0.28 + pulse * 0.38 + (frame.boardIndex === 4 ? 0.16 : 0));
        frame.material.color.copy(tempColor);
        frame.material.opacity = 0.26 + pulse * 0.28 + (frame.boardIndex === 4 ? 0.16 : 0);
      }

      for (const tile of tiles) {
        const centerBoost = tile.globalIndex === 40 ? 0.46 : 0;
        const keyBoost = tile.globalIndex !== 40 && tile.globalIndex % 10 === 0 ? 0.16 : 0;
        const hover = tile.globalIndex === hoveredIndex ? 1 : 0;
        const distance = Math.hypot(tile.x, tile.y) / 4.8;
        const verticalWave = Math.sin(elapsed * 1.15 + tile.y * 1.35 + tile.seed) * 0.5 + 0.5;
        const radialWave = Math.sin(elapsed * 0.74 - distance * 4.3 + tile.seed * 0.38) * 0.5 + 0.5;
        const boardHeat = tile.boardIndex === 4 ? 0.18 : 0;
        const heat = clamp01(
          0.13 +
            boardHeat +
            centerBoost +
            keyBoost +
            verticalWave * 0.18 +
            radialWave * 0.16 +
            hover * 0.44 -
            distance * 0.1
        );

        setThermalColor(tempColor, heat);

        tile.mesh.position.z = tile.homeZ + hover * 0.075 + Math.sin(elapsed * 0.92 + tile.seed) * 0.004;
        tile.mesh.material.color.copy(baseSurface).lerp(tempColor, 0.035 + heat * 0.04);
        tile.mesh.material.emissive.copy(tempColor).multiplyScalar(0.2 + heat * 0.55 + hover * 0.45);
        tile.mesh.material.emissiveIntensity = 0.42 + heat * 1.25 + hover * 0.7;

        tile.top.position.z = tile.mesh.position.z + tileDepth / 2 + 0.025;
        tile.top.material.color.copy(tempColor);
        tile.top.material.opacity = 0.045 + heat * 0.21 + hover * 0.24;

        tile.edge.position.z = tile.mesh.position.z;
        tile.edge.material.color.copy(tempColor);
        tile.edge.material.opacity = 0.24 + heat * 0.55 + hover * 0.28;

        tile.glow.position.z = tile.mesh.position.z - 0.055;
        tile.glow.material.color.copy(tempColor);
        tile.glow.material.opacity = 0.055 + heat * 0.22 + hover * 0.16;
      }

      bloomPass.strength = width < 640 ? 0.62 : 0.74;
      composer.render();
      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);

      composer.dispose();
      glowTexture?.dispose();
      sweepTexture?.dispose();
      tileGeometry.dispose();
      topGeometry.dispose();
      edgeGeometry.dispose();
      glowGeometry.dispose();
      frameBarGeometry.dispose();
      baseGeometry.dispose();
      particleGeometry.dispose();

      scene.traverse((object) => {
        if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Points) {
          disposeMaterial(object.material);
        }
      });

      renderer.dispose();
    };
  }, []);

  return (
    <section ref={stageRef} className="showcase-stage" aria-label="Mandal-Art 3D showcase">
      <canvas ref={canvasRef} className="thermal-stage" />
      <div className="showcase-copy" aria-hidden="true">
        <span>Thermal Objective</span>
        <h1>Mandal-Art</h1>
      </div>
      <a className="route-pill showcase-route" href={import.meta.env.BASE_URL}>
        Board
      </a>
      <div className="showcase-signature" aria-hidden="true">
        <span>Object</span>
        <span>01</span>
      </div>
      {error && <div className="thermal-fallback">{error}</div>}
    </section>
  );
}
