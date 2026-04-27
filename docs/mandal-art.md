---
marp: true
theme: custom
paginate: true
---

<!-- _class: lead -->

# Mandal-Art

열화상 플라즈마 무드의 인터랙티브 목표 설계 웹

---

## 레퍼런스

![bg right:42% contain](../../apple.gif)

루트의 `apple.gif`가 목표 디자인의 기준이다.

- 완전한 블랙 배경
- 중앙의 거대한 단일 심볼
- 딥 블루에서 옐로우, 오렌지, 레드로 이어지는 열화상 팔레트
- 외곽을 감싸는 강한 블루 블룸
- 형태가 움직이기보다 **열감과 광량이 순환**

만다라트도 카드 UI처럼 보이면 안 된다.
보드 전체가 하나의 **발광하는 열 지도**처럼 보여야 한다.

---

## 디자인 방향

**Thermal Plasma Mandal-Art**

만다라트는 생산성 앱이 아니라, 목표를 시각화하는 의식적인 화면으로 만든다.

- 화면은 거의 검은색으로 비운다.
- 9x9 보드는 중앙의 유일한 피사체가 된다.
- 각 셀은 독립 카드가 아니라, 하나의 거대한 발광 심볼을 이루는 픽셀처럼 보인다.
- 작성된 내용이 많아질수록 차가운 블루에서 뜨거운 옐로우/오렌지로 올라간다.
- 선택한 영역은 열이 몰리는 것처럼 밝아진다.

> 목표는 "예쁜 표"가 아니라 "살아있는 목표 열화상"이다.

---

## GIF에서 가져올 것

| 요소 | 해석 | 만다라트 적용 |
|---|---|---|
| 블랙 배경 | 피사체만 보이게 함 | 주변 UI 최소화 |
| 단일 심볼 | 화면의 주인공이 명확함 | 9x9 보드를 화면 중앙에 크게 |
| 열화상 컬러 | 상태 변화가 직관적임 | 작성률과 포커스를 온도로 표현 |
| 블루 블룸 | 차갑지만 고급스러운 광원 | 전체 보드 외곽 halo |
| 오렌지 코어 | 강한 에너지 포인트 | 중심 목표, 선택 셀, 완료 셀 |
| 느린 순환 | 안정적인 몰입감 | shimmer, wave, heat flow |

---

## 핵심 경험

| 순간 | 사용자 행동 | 화면 반응 |
|---|---|---|
| 시작 | 중앙 목표 입력 | 중심 셀이 오렌지 코어처럼 점화 |
| 확장 | 8개 핵심 키워드 입력 | 주변 8개 블록에 열이 번짐 |
| 세부화 | 하위 칸 작성 | 블루 셀이 시안, 옐로우, 오렌지로 가열 |
| 탐색 | 셀 또는 블록 선택 | 선택 영역으로 열 파동이 모임 |
| 완성 | 81칸 작성 완료 | 전체 보드가 하나의 플라즈마 심볼처럼 발광 |

---

## 화면 구성

```text
┌──────────────────────────────────────────────────────────┐
│ minimal header: title / theme / export                   │
│                                                          │
│                                                          │
│              ┌──────────────────────────┐                │
│              │                          │                │
│              │      9 x 9 heat board     │                │
│              │                          │                │
│              └──────────────────────────┘                │
│                                                          │
│          progress as temperature, not as a bar            │
└──────────────────────────────────────────────────────────┘
```

- 보드가 첫 화면의 70% 이상을 차지한다.
- 헤더와 하단 UI는 얇고 차갑게 둔다.
- 버튼은 많지 않게, 밝기도 낮게.
- 사용자의 시선은 항상 중앙 보드로 돌아와야 한다.

---

## 보드의 시각 구조

9x9 보드는 "셀 81개"보다 "하나의 빛나는 덩어리"로 보여야 한다.

```text
outer halo     : deep electric blue
grid edges     : cyan glow
filled cells   : yellow / orange heat
focused cell   : red-orange core
empty cells    : dark navy / near black
center goal    : hottest point
```

각 셀의 경계선은 선명한 표 라인이 아니라, 열 경계처럼 부드럽게 번진다.

---

## 만다라트 구조

중앙 3x3은 전체 목표의 요약판이다.

```text
┌──────┬──────┬──────┐
│ 핵심1 │ 핵심2 │ 핵심3 │
├──────┼──────┼──────┤
│ 핵심4 │ 목표  │ 핵심5 │
├──────┼──────┼──────┤
│ 핵심6 │ 핵심7 │ 핵심8 │
└──────┴──────┴──────┘
```

각 핵심 키워드는 바깥쪽 3x3 블록의 중심이 된다.

- 중앙 목표 1개
- 핵심 키워드 8개
- 실행 아이디어 72개
- 총 81칸

---

## 온도 시스템

셀의 상태를 색온도로 표현한다.

| 상태 | 온도 | 색상 |
|---|---:|---|
| 비어 있음 | 0 | `#02040A`, `#050921` |
| hover | 1 | `#09247C`, `#1240B8` |
| 작성됨 | 2 | `#1E59D2`, `#06B6D4` |
| 핵심 키워드 | 3 | `#FDE047`, `#FACC15` |
| 선택됨 | 4 | `#F97316`, `#EF4444` |
| 중심 목표 | 5 | `#FFF7B2`, `#FFB020`, `#F43F1E` |

진행률은 숫자보다 보드의 평균 온도로 먼저 느껴져야 한다.

---

## 팔레트

```ts
const thermalPalette = {
  black: "#000000",
  void: "#02040A",
  coldNavy: "#050921",
  deepBlue: "#09247C",
  electricBlue: "#1240B8",
  plasmaBlue: "#1E59D2",
  cyan: "#06B6D4",
  paleHeat: "#BFF7FF",
  yellow: "#FDE047",
  amber: "#FACC15",
  orange: "#F97316",
  redCore: "#EF4444",
  whiteCore: "#FFF7B2",
};
```

포인트는 무지개가 아니라 **열화상 그라데이션**이다.
색은 다양하지만 순서가 있어야 한다.

---

## 셀 디자인

셀은 카드처럼 떠 있으면 안 된다.

```css
.cell {
  background:
    radial-gradient(circle at 50% 52%, var(--heat-core), transparent 58%),
    linear-gradient(180deg, var(--heat-top), var(--heat-bottom));
  border: 1px solid rgba(88, 166, 255, 0.18);
  box-shadow:
    inset 0 0 18px rgba(90, 180, 255, 0.2),
    0 0 calc(18px + var(--heat) * 12px) rgba(var(--heat-rgb), 0.36);
  filter: saturate(1.15) blur(0);
}
```

- `border-radius`는 작게 유지한다.
- glassmorphism보다 glow와 heat map이 우선이다.
- 표 라인은 약하게, 광원은 강하게.

---

## 보드 효과

```css
.board {
  background:
    radial-gradient(circle at 50% 46%, rgba(20, 64, 184, 0.32), transparent 48%),
    radial-gradient(circle at 50% 58%, rgba(249, 115, 22, 0.18), transparent 36%),
    #000;
  box-shadow:
    0 0 80px rgba(37, 99, 235, 0.42),
    0 0 180px rgba(6, 182, 212, 0.18);
}
```

보드 밖으로 새는 블루 halo가 중요하다.
이 halo가 있어야 GIF 같은 "검은 화면 속 빛나는 물체"가 된다.

---

## 열 흐름 애니메이션

프레임 이동은 크게 만들지 않는다.
대신 색과 광량이 천천히 흐른다.

| 상황 | 애니메이션 |
|---|---|
| idle | 보드 전체의 heat gradient가 천천히 좌우 이동 |
| hover | 셀 내부에 짧은 yellow bloom |
| focus | 주변 셀이 냉각되고 선택 셀만 red-orange로 상승 |
| 입력 저장 | 선택 셀에서 주변으로 heat ripple |
| 진행률 증가 | 작성된 셀 주변 halo가 조금 커짐 |
| 완료 | 중심에서 바깥으로 blue → yellow → orange wave |

---

## GIF 프레임 해석

`apple.gif`의 51프레임은 크게 4구간으로 볼 수 있다.

| 구간 | 프레임 | 특징 |
|---|---|---|
| 냉각된 상단, 뜨거운 하단 | 00-08 | 하단 오렌지 코어, 외곽 블루 halo |
| 열이 위로 상승 | 09-18 | 잎과 상단 윤곽이 옐로우/오렌지로 가열 |
| 전체 고열 상태 | 19-25 | 내부가 밝아지고 중앙에 블루 밴드 유지 |
| 다시 냉각 후 반복 | 26-50 | 상단이 식고 하단 열띠가 남으며 루프 |

만다라트의 idle loop도 이 구조를 따른다.
하단/중심에서 시작한 열이 위로 번지고, 다시 블루로 식는 순환.

---

## 인터랙션

### 셀 편집

- 클릭하면 해당 셀이 확대되지 않고 **가열**된다.
- 입력 중에는 커서 주변에 작은 blue pulse가 생긴다.
- 저장되면 셀 중심에서 yellow bloom이 퍼진다.

### 블록 포커스

- 선택 블록은 온도가 올라간다.
- 나머지 블록은 딥 블루로 냉각된다.
- 전체 그리드 모양은 유지한다.

### 전체 보기

- 보드 전체가 천천히 호흡하듯 밝아졌다 어두워진다.
- 완성도가 높을수록 오렌지 영역이 많아진다.

---

## MVP 기능

| 기능 | 범위 | 우선순위 |
|---|---|---|
| WebGL thermal stage | R3F quad + thermal LUT + bloom | High |
| 셀 입력 | DOM 오버레이 텍스트 입력, 자동 저장 | High |
| Heat field | 81칸 heat 값을 데이터 텍스처로 셰이더에 전달 | High |
| 셀 클릭 impulse | 클릭 좌표에 heat ripple 주입 | High |
| 블록 포커스 | uFocusBlock으로 비선택 영역 냉각 | High |
| 진행률 | 숫자 + uAmbient 가열 | Medium |
| 프리셋 | 빈 보드, 자기계발, 프로젝트, 건강 | Medium |
| PNG export | 캔버스 + DOM 합성 저장 | Low |

제외할 것:

- 계정 / 로그인
- 협업 편집
- 복잡한 태그
- AI 추천
- 캘린더 / 알림

---

## 데이터 모델

```ts
type HeatLevel = 0 | 1 | 2 | 3 | 4 | 5;

type MandalCell = {
  id: string;
  text: string;
  role: "goal" | "theme" | "action";
  row: number;
  col: number;
  blockIndex: number;
  heat: HeatLevel;
};

type MandalBoard = {
  title: string;
  cells: MandalCell[];
  activeCellId?: string;
  activeBlockIndex?: number;
  progress: number;
};
```

`heat`는 저장값이라기보다 렌더링 시 계산해도 된다.

---

## Heat 계산

```ts
function getCellHeat(cell: MandalCell, state: BoardState): HeatLevel {
  if (cell.role === "goal") return 5;
  if (cell.id === state.activeCellId) return 4;
  if (cell.role === "theme" && cell.text.trim()) return 3;
  if (cell.text.trim()) return 2;
  if (cell.blockIndex === state.activeBlockIndex) return 1;
  return 0;
}
```

중요한 점:

- 중심 목표는 항상 가장 뜨겁다.
- 선택 셀은 일시적으로 중심만큼 뜨거워질 수 있다.
- 빈 셀도 완전히 죽이지 않고 딥 블루 광량을 남긴다.

---

## 컴포넌트

```text
App
└─ MandalArtPage
   ├─ MandalLayout
   ├─ MandalSidebar
   ├─ MandalMain
   ├─ MandalBoard
   │  ├─ MandalBox x 9
   │  │  └─ MandalCell x 9
   │  └─ BoxGlowLayer
   └─ MandalExport
```

기존 생산성 UI처럼 패널을 많이 만들지 않는다.
필요한 조작은 보드 근처에 얇게 붙인다.

---

## 모바일 전략

모바일에서 9x9 전체를 입력용으로 쓰면 어렵다.

- 첫 화면은 전체 보드를 "감상 모드"로 보여준다.
- 탭하면 해당 3x3 블록으로 진입한다.
- 블록 진입 시에도 열화상 무드는 유지한다.
- 하단에는 현재 블록명과 전체 보기 버튼만 둔다.
- 키보드가 올라와도 선택 셀의 glow가 보이게 한다.

모바일은 "전체 열 지도"와 "블록 단위 작성"을 분리한다.

---

## WebGL 렌더 파이프라인

만다라트의 발광은 CSS glow나 Framer Motion으로 흉내낼 수 없다.
Apple 레퍼런스에 가까워지려면 셰이더가 **보드 외곽까지의 거리**를 계산하고, 그 거리값에만 빛을 얹어야 한다.

### 목표

- 내부 셀 = 거의 완전한 black
- 보드 외곽 = 두껍고 부드러운 blue halo
- 선택 셀/중심 셀 = 아주 얇은 amber rim
- 애니메이션 = 보드 자체가 아니라 외곽 rim light만 천천히 이동
- 9개 미니 보드 = 서로 떨어진 독립 오브젝트

### 스택

```
React + WebGL fragment shader
```

처음부터 Three.js 풀스택으로 갈 필요는 없다.
**풀스크린 quad 1장 + fragment shader** 로 충분하다.

프로토타입:

```text
docs/mandal-art/webgl-thermal-mandal.html
```

### 셰이더 구조

```glsl
// 1. 각 미니 보드를 rounded-rect SDF로 정의
float d = sdRoundBox(p, boardSize, radius);

// 2. d < 0 이면 내부: 거의 black
if (d < 0.0) color = vec3(0.0);

// 3. d > 0 이면 외부: blue halo
float halo = exp(-max(d, 0.0) / glowRadius);

// 4. abs(d)가 작으면 edge rim
float rim = exp(-abs(d) / rimWidth);
```

### 디자인 경험 디테일

| 기법 | 역할 |
|---|---|
| Rounded-rect SDF | 보드 외곽과 내부를 정확히 분리 |
| Distance-based halo | 내부를 건드리지 않고 외곽에만 glow 적용 |
| Reference LUT | `ref.gif`에서 뽑은 blue/amber/orange 팔레트 고정 |
| Rim animation | 외곽 amber light만 천천히 이동 |
| Optional bloom pass | 더 사진 같은 번짐이 필요할 때만 추가 |

### 인터랙션 → uniform

- 시간 → `uTime` → 외곽 rim light 이동
- 선택 셀 → `uActiveCell` → 해당 셀에 얇은 amber rim
- 선택 블록 → `uActiveBlock` → 해당 미니 보드의 halo 강화
- 작성률 → `uProgress` → 전체 halo 강도만 소폭 증가

### 성능

- 1-pass SDF shader는 가볍다.
- bloom pass를 추가하면 모바일에서 비용이 커진다.
- 먼저 1-pass로 외곽 glow를 맞춘 뒤, 부족할 때만 post bloom을 붙인다.
- `filter` 애니메이션과 섞지 않는다. 모든 발광은 셰이더에서 처리

### 단계별 구현 순서

1. 9개 미니 보드를 SDF로 그린다.
2. 내부는 `#000000`에 가깝게 고정한다.
3. 외곽 distance에만 blue halo를 얹는다.
4. edge 근처에만 amber/orange rim을 얹는다.
5. `uTime`으로 rim 위치를 천천히 이동시킨다.
6. DOM 오버레이로 셀 입력을 얹는다.
7. 필요할 때만 post bloom을 추가한다.

각 단계마다 빌드 가능한 상태를 유지한다.

---

## 구현 스택

- Vite
- React
- TypeScript
- WebGL + GLSL
- Framer Motion (DOM 오버레이/UI 한정)
- html-to-image
- CSS variables

상태 관리는 우선 `useState`와 `localStorage`로 충분하다.
복잡한 상태 라이브러리는 아직 필요 없다.

---

## 구현 프롬프트

```text
인터랙티브 만다라트 웹 앱을 만들어라.
디자인 기준은 검은 배경 위에서 열화상 플라즈마처럼 발광하는 Apple 이벤트 스타일 GIF다.

React + TypeScript + Vite 기반.
9x9 만다라트 보드를 만들고 중앙 목표, 8개 핵심 키워드, 72개 실행 아이디어를 편집할 수 있게 한다.
셀 내용은 localStorage에 자동 저장한다.

보드는 카드 UI나 컬러풀한 heat map이 아니라 검은 만다라트 오브젝트처럼 보여야 한다.
셀 내부는 대부분 #000000 또는 #020203으로 유지하고,
화려한 색은 미니 보드의 외곽 halo와 일부 선택 rim에만 적용한다.

전체 배경은 완전한 블랙.
보드 외곽에는 ref.gif 팔레트 기반의 electric blue halo와 amber/orange rim을 적용한다.
idle 상태에서는 보드 형태가 아니라 외곽 rim light만 천천히 이동한다.
입력 저장 시 선택 셀에 얇은 amber rim을 잠깐 보여준다.

기능은 단순하게 유지하고, 열화상 플라즈마 시각 완성도를 우선한다.
```

---

## 성공 기준

- 첫 화면에서 보드가 하나의 강한 발광 오브젝트처럼 보인다.
- 카드형 대시보드 느낌이 나지 않는다.
- 작성률이 높아질수록 보드의 평균 온도가 올라간다.
- 선택한 셀과 블록이 설명 없이 눈에 들어온다.
- 완성된 만다라트를 이미지로 저장하고 싶어진다.

---

## 다음 작업

1. 9개 미니 보드의 SDF shader 구현
2. 내부 셀은 black/near-black으로 고정
3. 외곽 distance에만 blue halo 적용
4. 선택 셀/중심 셀에 얇은 amber rim 적용
5. `uTime`으로 외곽 rim light 이동
6. DOM 오버레이로 셀 입력 UI + localStorage 자동 저장
7. `uActiveCell`, `uActiveBlock`, `uProgress` uniform 연동
8. 필요할 때만 post bloom 추가
9. html-to-image 또는 canvas capture로 PNG export 추가

각 단계마다 빌드 가능한 상태를 유지한다.
처음부터 기능을 늘리지 않는다.
목표는 "잘 되는 앱"보다 먼저 "계속 보고 싶은 보드"다.

처음부터 기능을 늘리지 않는다.
목표는 "잘 되는 앱"보다 먼저 "계속 보고 싶은 보드"다.
