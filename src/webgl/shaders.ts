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

vec4 miniBoard(vec2 p, float boardSize, float index) {
  float radius = boardSize * 0.09;
  float d = sdRoundBox(p, vec2(boardSize * 0.5), radius);
  float outside = max(d, 0.0);
  float edge = exp(-abs(d) / (2.2 * u_dpr));
  float nearOutside = smoothstep(-2.0 * u_dpr, 7.0 * u_dpr, d);

  float angle = atan(p.y, p.x);
  float cycle = u_time * 0.105 + index * 0.035;
  float hotA = ringPulse(angle, TAU * cycle + index * 0.37, 0.34);
  float hotB = ringPulse(angle, TAU * (cycle + 0.46) - index * 0.19, 0.24);
  float hot = clamp(hotA * 0.9 + hotB * 0.42, 0.0, 1.0);

  vec3 blueGlow = mix(BLUE, SKY, 0.28 + 0.42 * ringPulse(angle, TAU * (cycle + 0.18), 0.9));
  vec3 hotGlow = refPalette(0.72 + hot * 0.28);
  vec3 rimColor = mix(blueGlow, hotGlow, smoothstep(0.22, 0.88, hot));

  float haloWide = exp(-outside / (39.0 * u_dpr)) * nearOutside;
  float haloMid = exp(-outside / (18.0 * u_dpr)) * nearOutside;
  float outerOnly = smoothstep(-1.0 * u_dpr, 5.5 * u_dpr, d);

  vec3 color = BLACK;
  float alpha = 0.0;

  color += BLUE * haloWide * 0.55;
  color += ROYAL * haloMid * 0.62;
  color += rimColor * edge * (0.38 + hot * 1.2) * outerOnly;
  alpha = max(alpha, clamp(haloWide * 0.72 + haloMid * 0.58 + edge * 0.86, 0.0, 1.0));

  if (d < 0.0) {
    float boardFill = 1.0 - smoothstep(-2.0 * u_dpr, 0.0, d);
    vec3 inside = mix(VOID, BLACK, 0.86);
    float cells = cellMask(p, boardSize);
    inside += DEEP_NAVY * cells * 0.18;
    color = mix(color, inside, boardFill);
    alpha = max(alpha, boardFill);
  }

  float center = centerCellRim(p, boardSize);
  color += AMBER * center * step(index, 4.5) * step(3.5, index) * 0.52;
  alpha = max(alpha, center * step(index, 4.5) * step(3.5, index) * 0.7);

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
