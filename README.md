# ou-mandal-art

열화상 플라즈마 무드의 만다라트 웹.

검은 배경 위에서 발광하는 Apple 이벤트 GIF 톤을 기준으로,
실제로 작성 가능한 9x9 만다라트 보드와 Three.js 열화상 백그라운드를 결합한다.

`/3d`에는 81개 타일을 실제 3D 오브젝트로 표현한 쇼케이스 버전을 둔다.

## 기준 디자인

- 완전한 블랙 배경
- 루트 페이지는 작성 가능한 9x9 Web UI
- 중심 목표와 8개 핵심 키워드는 만다라트 구조에 맞게 자동 미러링
- `docs/ref.gif`, `docs/ref.png` 톤의 blue halo, amber heat, slow thermal drift
- `/3d`는 별도 Three.js 쇼케이스 페이지

## 스택

- Vite + React + TypeScript
- Three.js + WebGL thermal background
- React controlled textarea grid
- html-to-image PNG export
- localStorage 자동 저장

## 문서

- [docs/mandal-art.md](docs/mandal-art.md) — 디자인·구현 명세
- [docs/webgl-thermal-mandal.html](docs/webgl-thermal-mandal.html) — 셰이더 프로토타입
- `docs/ref.gif`, `docs/ref.png` — 레퍼런스
