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

const getBoardCenterIndex = (boardIndex: number) => {
  const row = Math.floor(boardIndex / 3) * 3 + 1;
  const col = (boardIndex % 3) * 3 + 1;
  return row * 9 + col;
};

const centerToBoardIndex = new Map<number, number>(
  centralKeywordPairs.map(({ centerIndex, boardIndex }) => [centerIndex, getBoardCenterIndex(boardIndex)])
);

const boardToCenterIndex = new Map<number, number>(
  centralKeywordPairs.map(({ centerIndex, boardIndex }) => [getBoardCenterIndex(boardIndex), centerIndex])
);

const getInitialCells = () => {
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
};

type CellRole = "goal" | "keyword" | "action";

const getCellRole = (index: number): CellRole => {
  if (index === 40) return "goal";
  if (centerToBoardIndex.has(index) || boardToCenterIndex.has(index)) return "keyword";
  return "action";
};

const keywordPlaceholderMap = new Map<number, string>();
centralKeywordPairs.forEach(({ centerIndex, boardIndex }, order) => {
  const label = `목표 ${order + 1}`;
  keywordPlaceholderMap.set(centerIndex, label);
  keywordPlaceholderMap.set(getBoardCenterIndex(boardIndex), label);
});

const getPlaceholder = (index: number) => {
  if (index === 40) return "최종 목표";
  return keywordPlaceholderMap.get(index) ?? "";
};

const getBoardClass = (index: number) => `mandal-cell is-${getCellRole(index)}`;

const getBoxCellIndices = (boardIndex: number) => {
  const boardRow = Math.floor(boardIndex / 3) * 3;
  const boardCol = (boardIndex % 3) * 3;

  return Array.from({ length: 9 }, (_, localIndex) => {
    const localRow = Math.floor(localIndex / 3);
    const localCol = localIndex % 3;
    return (boardRow + localRow) * 9 + boardCol + localCol;
  });
};

const syncMirroredCell = (cells: string[], index: number, value: string) => {
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
};

export {
  STORAGE_KEY,
  EMPTY_CELLS,
  getInitialCells,
  getCellRole,
  getPlaceholder,
  getBoardClass,
  getBoxCellIndices,
  syncMirroredCell,
};
export type { CellRole };
