import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { toPng } from "html-to-image";
import { BoxGlowLayer } from "./BoxGlowLayer";
import { ThermalBackground } from "./ThermalBackground";

const STORAGE_KEY = "ou-mandal-art:cells:v1";
const EMPTY_CELLS = Array.from({ length: 81 }, () => "");

const centralKeywordPairs = [
  { centerIndex: 30, boardIndex: 0 },
  { centerIndex: 31, boardIndex: 1 },
  { centerIndex: 32, boardIndex: 2 },
  { centerIndex: 39, boardIndex: 3 },
  { centerIndex: 41, boardIndex: 5 },
  { centerIndex: 48, boardIndex: 6 },
  { centerIndex: 49, boardIndex: 7 },
  { centerIndex: 50, boardIndex: 8 },
] as const;

const centerToBoardIndex = new Map<number, number>(
  centralKeywordPairs.map(({ centerIndex, boardIndex }) => [centerIndex, getBoardCenterIndex(boardIndex)])
);

const boardToCenterIndex = new Map<number, number>(
  centralKeywordPairs.map(({ centerIndex, boardIndex }) => [getBoardCenterIndex(boardIndex), centerIndex])
);

function getBoardCenterIndex(boardIndex: number) {
  const row = Math.floor(boardIndex / 3) * 3 + 1;
  const col = (boardIndex % 3) * 3 + 1;
  return row * 9 + col;
}

function getInitialCells() {
  if (typeof window === "undefined") return EMPTY_CELLS;

  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (!saved) return EMPTY_CELLS;

    const parsed = JSON.parse(saved);
    if (!Array.isArray(parsed)) return EMPTY_CELLS;

    return EMPTY_CELLS.map((_, index) => (typeof parsed[index] === "string" ? parsed[index] : ""));
  } catch {
    return EMPTY_CELLS;
  }
}

function getCellRole(index: number) {
  if (index === 40) return "goal";
  if (centerToBoardIndex.has(index) || boardToCenterIndex.has(index)) return "keyword";
  return "action";
}

function getPlaceholder(index: number) {
  const role = getCellRole(index);
  if (role === "goal") return "목표";
  if (role === "keyword") return "핵심";
  return "실행";
}

function getBoardClass(index: number) {
  const classes = ["mandal-cell"];

  classes.push(`is-${getCellRole(index)}`);

  return classes.join(" ");
}

function getBoxCellIndices(boardIndex: number) {
  const boardRow = Math.floor(boardIndex / 3) * 3;
  const boardCol = (boardIndex % 3) * 3;

  return Array.from({ length: 9 }, (_, localIndex) => {
    const localRow = Math.floor(localIndex / 3);
    const localCol = localIndex % 3;
    return (boardRow + localRow) * 9 + boardCol + localCol;
  });
}

function syncMirroredCell(cells: string[], index: number, value: string) {
  const next = [...cells];
  const mirroredFromCenter = centerToBoardIndex.get(index);
  const mirroredFromBoard = boardToCenterIndex.get(index);

  next[index] = value;

  if (typeof mirroredFromCenter === "number") {
    next[mirroredFromCenter] = value;
  }

  if (typeof mirroredFromBoard === "number") {
    next[mirroredFromBoard] = value;
  }

  return next;
}

export function MandalArtPage() {
  const exportRef = useRef<HTMLDivElement>(null);
  const boardRef = useRef<HTMLDivElement>(null);
  const [cells, setCells] = useState(getInitialCells);
  const [selectedIndex, setSelectedIndex] = useState(40);

  const filledCount = useMemo(() => cells.filter((cell) => cell.trim().length > 0).length, [cells]);
  const heat = Math.round((filledCount / cells.length) * 100);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(cells));
  }, [cells]);

  const updateCell = (index: number, value: string) => {
    setCells((current) => syncMirroredCell(current, index, value));
  };

  const reset = () => {
    if (!window.confirm("작성한 만다라트를 모두 비울까요?")) return;
    setCells(EMPTY_CELLS);
    setSelectedIndex(40);
  };

  const exportImage = async () => {
    const node = exportRef.current;
    if (!node) return;

    const dataUrl = await toPng(node, {
      backgroundColor: "#02030a",
      cacheBust: true,
      pixelRatio: 2,
    });
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = "mandal-art.png";
    link.click();
  };

  return (
    <section className="mandal-page">
      <ThermalBackground />
      <div className="showcase-copy mandal-copy" aria-hidden="true">
        <span>Thermal Objective</span>
        <h1>Mandal-Art</h1>
      </div>

      <nav className="mandal-actions" aria-label="Mandal-Art actions">
        <a className="route-pill" href={`${import.meta.env.BASE_URL}3d`}>
          3D
        </a>
        <button type="button" className="route-pill" onClick={exportImage}>
          PNG
        </button>
        <button type="button" className="route-pill" onClick={reset}>
          Reset
        </button>
      </nav>

      <div className="mandal-workspace">
        <div ref={exportRef} className="mandal-export">
          <div ref={boardRef} className="mandal-board" style={{ "--heat": `${heat}%` } as CSSProperties}>
            <BoxGlowLayer boardRef={boardRef} />
            {Array.from({ length: 9 }, (_, boardIndex) => (
              <div key={boardIndex} className="mandal-box" data-mandal-box={boardIndex}>
                {getBoxCellIndices(boardIndex).map((index) => {
                  const value = cells[index];

                  return (
                    <label
                      key={index}
                      className={`${getBoardClass(index)} ${selectedIndex === index ? "is-selected" : ""} ${
                        value.trim() ? "is-filled" : ""
                      }`}
                    >
                      <textarea
                        aria-label={`Mandal-Art cell ${index + 1}`}
                        maxLength={44}
                        onChange={(event) => updateCell(index, event.target.value)}
                        onFocus={() => setSelectedIndex(index)}
                        placeholder={getPlaceholder(index)}
                        value={value}
                      />
                    </label>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mandal-status" aria-live="polite">
        <span>{filledCount}</span>
        <span>/81</span>
        <span>{heat}%</span>
      </div>
    </section>
  );
}
