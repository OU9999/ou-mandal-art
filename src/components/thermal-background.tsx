import { useEffect, useRef } from "react";
import * as THREE from "three";

const vertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`;

const fragmentShader = `
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;

varying vec2 vUv;

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amp = 0.5;

  for (int i = 0; i < 5; i++) {
    value += amp * noise(p);
    p *= 2.03;
    amp *= 0.5;
  }

  return value;
}

float superellipse(vec2 p, vec2 radius, float power) {
  vec2 q = abs(p / radius);
  return pow(pow(q.x, power) + pow(q.y, power), 1.0 / power) - 1.0;
}

vec3 thermalRamp(float t) {
  t = clamp(t, 0.0, 1.0);

  vec3 c = mix(vec3(0.0, 0.0, 0.0), vec3(0.02, 0.04, 0.22), smoothstep(0.00, 0.12, t));
  c = mix(c, vec3(0.02, 0.10, 0.78), smoothstep(0.11, 0.28, t));
  c = mix(c, vec3(0.02, 0.45, 0.92), smoothstep(0.27, 0.43, t));
  c = mix(c, vec3(0.30, 0.80, 0.90), smoothstep(0.42, 0.54, t));
  c = mix(c, vec3(0.95, 0.86, 0.18), smoothstep(0.52, 0.68, t));
  c = mix(c, vec3(1.00, 0.47, 0.08), smoothstep(0.66, 0.84, t));
  c = mix(c, vec3(1.00, 0.92, 0.66), smoothstep(0.84, 1.0, t));

  return c;
}

float thermalGlyph(vec2 p) {
  vec2 q = p + vec2(0.0, -0.02);
  float panel = superellipse(q, vec2(0.74, 0.74), 5.8);
  float bevel = superellipse(q - vec2(0.0, 0.03), vec2(0.66, 0.66), 7.2);

  return mix(panel, bevel, 0.18);
}

void main() {
  vec2 uv = vUv;
  vec2 p = uv * 2.0 - 1.0;
  p.x *= uResolution.x / uResolution.y;
  p -= vec2(uPointer.x * 0.055, uPointer.y * 0.035);

  float t = uTime;
  float drift = fbm(vec2(p.x * 1.6 + t * 0.10, p.y * 2.2 - t * 0.16));
  float bands = sin((p.y + drift * 0.34) * 7.0 - t * 1.25) * 0.5 + 0.5;
  float slowBand = sin((p.y - p.x * 0.22) * 3.4 + t * 0.46) * 0.5 + 0.5;

  vec2 glyphP = p;
  glyphP.y += 0.03;
  float d = thermalGlyph(glyphP);
  float shape = 1.0 - smoothstep(-0.018, 0.028, d);
  float edge = exp(-abs(d) * 9.0);
  float outer = exp(-max(d, 0.0) * 3.4);
  float farOuter = exp(-max(d, 0.0) * 1.35);

  float innerVertical = smoothstep(0.92, -0.82, glyphP.y);
  float heat = innerVertical * 0.55 + bands * 0.28 + slowBand * 0.18 + drift * 0.18;
  heat += edge * 0.42;
  heat = clamp(heat, 0.0, 1.0);

  vec3 glyphColor = thermalRamp(heat);
  vec3 coolHalo = thermalRamp(0.18 + bands * 0.18);
  vec3 color = vec3(0.0);

  color += coolHalo * farOuter * 0.11;
  color += thermalRamp(0.30) * outer * 0.20;
  color += glyphColor * shape * 0.44;
  color += glyphColor * edge * 0.34;

  float boardPulse = 0.0;
  for (int y = 0; y < 3; y++) {
    for (int x = 0; x < 3; x++) {
      vec2 center = vec2(float(x) - 1.0, float(1 - y)) * vec2(0.46, 0.34);
      vec2 q = p - center;
      q.x *= 1.12;
      float cell = superellipse(q, vec2(0.17, 0.13), 4.0);
      float pulse = sin(t * 0.72 + float(x + y * 3) * 0.64) * 0.5 + 0.5;
      boardPulse += exp(-abs(cell) * 12.0) * (0.18 + pulse * 0.22);
    }
  }

  color += thermalRamp(0.24 + bands * 0.42) * boardPulse * 0.16;

  float vignette = length(p / vec2(1.3, 1.0));
  color *= 1.0 - smoothstep(0.58, 1.28, vignette) * 0.74;
  color += vec3(0.02, 0.06, 0.18) * exp(-vignette * 4.8) * 0.2;

  float alpha = clamp(shape * 0.26 + edge * 0.22 + outer * 0.18 + farOuter * 0.08 + boardPulse * 0.08, 0.0, 0.82);
  gl_FragColor = vec4(color, alpha);
}
`;

const ThermalBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  /**
   * Initializes the Three.js shader canvas and tears down WebGL resources when
   * the background unmounts.
   */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let renderer: THREE.WebGLRenderer;

    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        canvas,
        powerPreference: "high-performance",
      });
    } catch {
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const pointer = new THREE.Vector2(0, 0);
    const targetPointer = new THREE.Vector2(0, 0);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      vertexShader,
      fragmentShader,
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uPointer: { value: pointer },
      },
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    const resize = () => {
      const width = Math.max(1, canvas.clientWidth);
      const height = Math.max(1, canvas.clientHeight);
      const dpr = Math.min(window.devicePixelRatio || 1, 1.7);

      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      material.uniforms.uResolution.value.set(width * dpr, height * dpr);
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetPointer.set(
        (event.clientX / Math.max(1, window.innerWidth)) * 2 - 1,
        -((event.clientY / Math.max(1, window.innerHeight)) * 2 - 1)
      );
    };

    let raf = 0;
    const clock = new THREE.Clock();
    const render = () => {
      pointer.lerp(targetPointer, 0.04);
      material.uniforms.uTime.value = clock.getElapsedTime();
      renderer.render(scene, camera);
      raf = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointermove", handlePointerMove);
    raf = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointermove", handlePointerMove);
      mesh.geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} className="thermal-background" aria-hidden="true" />;
};

export { ThermalBackground };
