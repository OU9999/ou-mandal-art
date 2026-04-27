import { getBoardClass, getGoverningCenterIndex, getMirrorIndex, getPlaceholder } from "../_lib/mandal-grid";
import { useMandalCellsContext } from "../_hooks/mandal-cells-context";

interface MandalCellProps {
  cellIndex: number;
}

const MandalCell = ({ cellIndex }: MandalCellProps) => {
  const { cells, selectedIndex, setSelectedIndex, updateCell } = useMandalCellsContext();
  const value = cells[cellIndex];
  const isSelected = selectedIndex === cellIndex;
  const isFilled = value.trim().length > 0;

  const governingIndex = getGoverningCenterIndex(cellIndex);
  const isDisabled = governingIndex !== null && cells[governingIndex].trim().length === 0;

  const mirrorIndex = getMirrorIndex(cellIndex);
  const isLinkedSelected = !isSelected && mirrorIndex !== null && selectedIndex === mirrorIndex;

  const className = [
    getBoardClass(cellIndex),
    isSelected ? "is-selected" : "",
    isLinkedSelected ? "is-linked-selected" : "",
    isFilled ? "is-filled" : "",
    isDisabled ? "is-disabled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={className}>
      <textarea
        aria-label={`Mandal-Art cell ${cellIndex + 1}`}
        disabled={isDisabled}
        maxLength={44}
        onChange={(event) => updateCell(cellIndex, event.target.value)}
        onFocus={() => setSelectedIndex(cellIndex)}
        placeholder={getPlaceholder(cellIndex)}
        value={value}
      />
    </label>
  );
};

export { MandalCell };
