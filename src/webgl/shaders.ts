export const vertexShaderSource = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export const fragmentShaderSource = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_dpr;

const float PI = 3.141592653589793;
const float TAU = 6.283185307179586;

vec3 BLACK = vec3(0.0, 0.0, 0.0);
vec3 VOID = vec3(0.0078, 0.0078, 0.0118);
vec3 NAVY = vec3(0.0706, 0.0706, 0.1843);
vec3 DEEP_NAVY = vec3(0.0863, 0.0863, 0.3098);
vec3 BLUE = vec3(0.1490, 0.1647, 0.6235);
vec3 ROYAL = vec3(0.2196, 0.3490, 0.8275);
vec3 SKY = vec3(0.3569, 0.5725, 0.8706);
vec3 ICE = vec3(0.4980, 0.7569, 0.9922);
vec3 CYAN_MUTE = vec3(0.3922, 0.5961, 0.6314);
vec3 AMBER = vec3(0.8627, 0.6471, 0.1686);
vec3 YELLOW = vec3(0.8118, 0.7569, 0.2588);
vec3 ORANGE = vec3(0.8431, 0.4353, 0.1294);

float sdRoundBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float ringPulse(float x, float center, float width) {
  float d = atan(sin(x - center), cos(x - center));
  return exp(-(d * d) / (2.0 * width * width));
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float valueNoise(vec2 p) {
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
  float v = 0.0;
  float a = 0.5;
  for (int i = 0; i < 4; i++) {
    v += a * valueNoise(p);
    p *= 2.05;
    a *= 0.5;
  }
  return v;
}

vec3 refPalette(float t) {
  t = fract(t);
  if (t < 0.28) return mix(BLUE, ROYAL, smoothstep(0.0, 0.28, t));
  if (t < 0.46) return mix(ROYAL, SKY, smoothstep(0.28, 0.46, t));
  if (t < 0.58) return mix(SKY, ICE, smoothstep(0.46, 0.58, t));
  if (t < 0.68) return mix(ICE, CYAN_MUTE, smoothstep(0.58, 0.68, t));
  if (t < 0.79) return mix(CYAN_MUTE, YELLOW, smoothstep(0.68, 0.79, t));
  if (t < 0.91) return mix(YELLOW, AMBER, smoothstep(0.79, 0.91, t));
  return mix(AMBER, ORANGE, smoothstep(0.91, 1.0, t));
}

float cellMask(vec2 p, float boardSize) {
  float pad = boardSize * 0.105;
  float gap = boardSize * 0.032;
  float cell = (boardSize - pad * 2.0 - gap * 2.0) / 3.0;
  float best = 9999.0;

  for (int y = 0; y < 3; y++) {
    for (int x = 0; x < 3; x++) {
      vec2 c = vec2(
        -boardSize * 0.5 + pad + cell * 0.5 + float(x) * (cell + gap),
        -boardSize * 0.5 + pad + cell * 0.5 + float(y) * (cell + gap)
      );
      float d = sdRoundBox(p - c, vec2(cell * 0.5), boardSize * 0.022);
      best = min(best, abs(d));
    }
  }

  return 1.0 - smoothstep(0.0, 1.3 * u_dpr, best);
}

float centerCellRim(vec2 p, float boardSize) {
  float pad = boardSize * 0.105;
  float gap = boardSize * 0.032;
  float cell = (boardSize - pad * 2.0 - gap * 2.0) / 3.0;
  float d = sdRoundBox(p, vec2(cell * 0.5), boardSize * 0.024);
  return exp(-abs(d) / (1.35 * u_dpr));
}

vec3 thermalRamp(float t) {
  t = clamp(t, 0.0, 1.0);
  vec3 c = mix(vec3(0.004, 0.005, 0.018), DEEP_NAVY, smoothstep(0.00, 0.14, t));
  c = mix(c, BLUE,        smoothstep(0.12, 0.28, t));
  c = mix(c, ROYAL,       smoothstep(0.26, 0.40, t));
  c = mix(c, SKY,         smoothstep(0.38, 0.52, t));
  c = mix(c, ICE,         smoothstep(0.50, 0.60, t));
  c = mix(c, YELLOW,      smoothstep(0.58, 0.72, t));
  c = mix(c, AMBER,       smoothstep(0.70, 0.82, t));
  c = mix(c, ORANGE,      smoothstep(0.80, 0.92, t));
  c = mix(c, vec3(1.0, 0.92, 0.7), smoothstep(0.92, 1.0, t));
  return c;
}

float boardHeat(vec2 nb, float index) {
  float globalPhase = u_time * 0.18 + index * 0.11;

  float bandPhase = fract(globalPhase);
  float heatY = mix(-1.1, 1.1, bandPhase);
  float band = exp(-pow((nb.y - heatY) * 1.55, 2.0));

  float baseHot = smoothstep(0.85, -0.95, nb.y) * 0.55;

  float warp = fbm(nb * 1.7 + vec2(u_time * 0.18, -u_time * 0.32) + index * 3.7);
  float ripple = fbm(nb * 3.4 + vec2(-u_time * 0.27, u_time * 0.19));

  float lobe = exp(-pow((nb.y + 0.35 - sin(u_time * 0.4 + index) * 0.18) * 1.2, 2.0))
             * (0.45 + 0.4 * sin(u_time * 0.6 + index * 1.7));

  float heat = band * 0.95 + baseHot + lobe * 0.35;
  heat += (warp - 0.5) * 0.32;
  heat += (ripple - 0.5) * 0.16;

  float ebb = 0.5 + 0.5 * sin(u_time * 0.32 + index * 0.9);
  heat *= mix(0.85, 1.18, ebb);

  return clamp(heat, 0.0, 1.0);
}

// Apple ref-style vertical thermal: stratified bands, slowly rising
// 0 = cold (top), 1 = hot (bottom). Map to thermalRamp.
float verticalThermal(vec2 p, float boardSize, float index) {
  float halfSize = boardSize * 0.5;
  float ny = p.y / halfSize;

  // slow vertical drift of the thermal mapping (heat rises)
  float drift = u_time * 0.08 + index * 0.13;
  float yShift = ny + drift * 0.6;

  // base stratified gradient: bottom hot, top cool (inverted because +y is up in shader space, which is screen-down — we'll flip)
  // Actually p.y > 0 = upper half (screen-down in WebGL fragCoord). We treat -y as "bottom of board".
  // To match ref (hot at visual bottom), we want larger heat where ny is more negative.
  float bottomHot = smoothstep(1.0, -1.1, ny) * 0.78;

  // mid blue band — fixed visual stripe like Apple ref
  float midBand = exp(-pow(ny * 2.4, 2.0)) * 0.18;

  // rising hot pulse: a bright band that travels up over time
  float pulsePhase = fract(drift);
  float pulseY = mix(-1.2, 1.2, pulsePhase);
  float pulseEnv = sin(pulsePhase * PI); // fade in/out at extremes
  float pulse = exp(-pow((ny - pulseY) * 2.0, 2.0)) * 0.55 * pulseEnv;

  // gentle horizontal wobble so bands aren't perfectly straight
  float wob = (fbm(vec2(ny * 3.5 + index, u_time * 0.25)) - 0.5) * 0.18;

  // breathing
  float ebb = 0.5 + 0.5 * sin(u_time * 0.28 + index * 0.7);

  float heat = bottomHot + pulse - midBand + wob;
  heat *= mix(0.9, 1.12, ebb);

  return clamp(heat, 0.0, 1.0);
}

// Per-cell thermal rim: vertical thermal mapped onto each cell's local frame.
// Returns vec3 color contribution and signed distance to the cell.
struct CellResult {
  vec3 color;
  float dist;
};

CellResult cellThermalRim(vec2 cellLocal, float cellSize, float cellIndex, float boardIndex) {
  float cornerR = cellSize * 0.10;
  float d = sdRoundBox(cellLocal, vec2(cellSize * 0.5), cornerR);

  vec2 nb = cellLocal / (cellSize * 0.5);
  float ny = clamp(nb.y, -1.3, 1.3);

  // each cell phased differently for organic, non-synced motion
  float drift = u_time * 0.11 + boardIndex * 0.17 + cellIndex * 0.31;

  float bottomHot = smoothstep(1.0, -1.1, ny) * 0.7;
  float midBand   = exp(-pow(ny * 2.4, 2.0)) * 0.16;
  float pulsePhase = fract(drift);
  float pulseY = mix(-1.3, 1.3, pulsePhase);
  float pulseEnv = sin(pulsePhase * PI);
  float pulse = exp(-pow((ny - pulseY) * 2.1, 2.0)) * 0.55 * pulseEnv;

  float ebb = 0.5 + 0.5 * sin(u_time * 0.34 + cellIndex * 1.3 + boardIndex * 0.7);
  float heat = clamp(bottomHot + pulse - midBand, 0.0, 1.0);
  heat *= mix(0.85, 1.18, ebb);

  vec3 thermal = thermalRamp(heat);

  // narrow rim ring at boundary
  float rim = exp(-abs(d) / (1.5 * u_dpr));
  // outward bloom only (positive d)
  float outsideD = max(d, 0.0);
  float bloom = exp(-outsideD / (5.5 * u_dpr));
  float bloomFar = exp(-outsideD / (14.0 * u_dpr));

  vec3 col = thermal * rim * (0.95 + heat * 1.1);
  col += thermal * bloom * (0.35 + heat * 0.35);
  col += thermal * bloomFar * 0.18;

  return CellResult(col, d);
}

vec4 miniBoard(vec2 p, float boardSize, float index) {
  float radius = boardSize * 0.09;
  float d = sdRoundBox(p, vec2(boardSize * 0.5), radius);
  float outside = max(d, 0.0);
  float insideAmt = max(-d, 0.0);

  // Outer mini-board halo (vertical thermal)
  float outerHeat = verticalThermal(p, boardSize, index);
  vec3 outerColor = thermalRamp(outerHeat);

  float outerRim = exp(-abs(d) / (1.8 * u_dpr));
  float bloomNear = exp(-outside / (8.0 * u_dpr));
  float bloomFar = exp(-outside / (38.0 * u_dpr));
  float innerFade = exp(-insideAmt / (3.0 * u_dpr));
  float outsideMask = smoothstep(-0.5 * u_dpr, 1.5 * u_dpr, d);

  vec3 color = BLACK;
  float alpha = 0.0;

  color += outerColor * bloomFar * outsideMask * (0.4 + outerHeat * 0.35);
  color += outerColor * bloomNear * outsideMask * (0.75 + outerHeat * 0.55);
  color += outerColor * outerRim * (0.85 + outerHeat * 1.1);
  color += outerColor * innerFade * 0.45;
  alpha = max(alpha, clamp(bloomFar * 0.5 + bloomNear * 0.65 + outerRim * 0.9, 0.0, 1.0));

  // Per-cell thermal rims (each of the 9 cells inside this mini-board)
  float pad = boardSize * 0.105;
  float gap = boardSize * 0.032;
  float cellSize = (boardSize - pad * 2.0 - gap * 2.0) / 3.0;

  vec3 cellAccum = BLACK;
  float minCellD = 9999.0;

  for (int cy = 0; cy < 3; cy++) {
    for (int cx = 0; cx < 3; cx++) {
      vec2 cellCenter = vec2(
        -boardSize * 0.5 + pad + cellSize * 0.5 + float(cx) * (cellSize + gap),
        -boardSize * 0.5 + pad + cellSize * 0.5 + float(cy) * (cellSize + gap)
      );
      float cIdx = float(cy * 3 + cx);
      CellResult cr = cellThermalRim(p - cellCenter, cellSize, cIdx, index);
      cellAccum += cr.color;
      minCellD = min(minCellD, cr.dist);
    }
  }

  // interior of board: black base + cell rim glows; mask black inside each cell
  if (d < 0.0) {
    float boardFill = 1.0 - smoothstep(-2.0 * u_dpr, 0.0, d);
    vec3 boardInside = mix(VOID, BLACK, 0.86);
    // keep cell-interior dark — cellAccum is dominated by rim/bloom near boundary, so interior is naturally dim
    // but ensure deep interior of any cell stays close to black
    float deepInside = smoothstep(0.0, -3.0 * u_dpr, minCellD);
    vec3 insideColor = boardInside + cellAccum * (1.0 - deepInside * 0.7);
    color = mix(color, insideColor, boardFill);
    alpha = max(alpha, boardFill);
  } else {
    // outside the board, cell rims also leak as soft halo through the rounded rect
    color += cellAccum * 0.15 * outsideMask;
  }

  float center = centerCellRim(p, boardSize);
  color += AMBER * center * step(index, 4.5) * step(3.5, index) * 0.4;
  alpha = max(alpha, center * step(index, 4.5) * step(3.5, index) * 0.6);

  return vec4(color, alpha);
}

void main() {
  vec2 frag = gl_FragCoord.xy;
  vec2 center = u_resolution * 0.5 + vec2(0.0, u_resolution.y * 0.02);

  float boardSize = min(u_resolution.y * 0.205, u_resolution.x * 0.118);
  float gap = boardSize * 0.39;
  float stride = boardSize + gap;
  vec2 origin = center - vec2(stride, stride);

  vec3 color = BLACK;
  float alpha = 0.0;

  float vignette = length((frag - u_resolution * 0.5) / u_resolution.y);
  color += BLUE * 0.035 * exp(-vignette * 4.8);

  for (int by = 0; by < 3; by++) {
    for (int bx = 0; bx < 3; bx++) {
      float idx = float(by * 3 + bx);
      vec2 boardCenter = origin + vec2(float(bx), float(by)) * stride;
      vec4 layer = miniBoard(frag - boardCenter, boardSize, idx);
      color = color + layer.rgb * (1.0 - alpha * 0.18);
      alpha = max(alpha, layer.a);
    }
  }

  color = pow(color, vec3(0.92));
  color = min(color, vec3(1.0));
  gl_FragColor = vec4(color, 1.0);
}
`;
