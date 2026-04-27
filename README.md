# ou-mandal-art

열화상 플라즈마 무드의 인터랙티브 만다라트 웹.

검은 배경 위에서 발광하는 Apple 이벤트 GIF 톤을 기준으로,
9x9 만다라트 보드를 하나의 거대한 빛나는 오브젝트로 표현한다.

## 기준 디자인

- 완전한 블랙 배경
- 9개 미니 보드의 외곽에만 blue halo
- 선택 셀/중심 셀에 얇은 amber rim
- 내부 셀은 거의 완전한 black 유지
- idle 시 외곽 rim light만 천천히 순환

## 스택

- Vite + React + TypeScript
- WebGL + GLSL (1-pass SDF shader)
- Framer Motion (DOM 오버레이/UI 한정)
- localStorage 자동 저장

## 문서

- [docs/mandal-art.md](docs/mandal-art.md) — 디자인·구현 명세
- [docs/webgl-thermal-mandal.html](docs/webgl-thermal-mandal.html) — 셰이더 프로토타입
- `docs/ref.gif`, `docs/ref.png` — 레퍼런스
