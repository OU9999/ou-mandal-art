import { useEffect, useMemo, useState } from "react";
import { EMPTY_CELLS, STORAGE_KEY, getInitialCells, syncMirroredCell } from "../_lib/mandal-grid";

interface MandalCellsValue {
  cells: string[];
  selectedIndex: number;
  filledCount: number;
  heat: number;
  setSelectedIndex: (index: number) => void;
  updateCell: (index: number, value: string) => void;
  reset: () => void;
}

const useMandalCells = (): MandalCellsValue => {
  const [cells, setCells] = useState(getInitialCells);
  const [selectedIndex, setSelectedIndex] = useState(40);

  const filledCount = useMemo(() => cells.filter((cell) => cell.trim().length > 0).length, [cells]);
  const heat = Math.round((filledCount / cells.length) * 100);

  /**
   * cells 상태가 변경될 때마다 localStorage 에 직렬화하여 저장한다.
   * 다음 마운트 시 getInitialCells 가 같은 키로 복원한다.
   */
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

  return {
    cells,
    selectedIndex,
    filledCount,
    heat,
    setSelectedIndex,
    updateCell,
    reset,
  };
};

export { useMandalCells };
export type { MandalCellsValue };
