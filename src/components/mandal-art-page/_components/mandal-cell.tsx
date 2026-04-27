import { getBoardClass, getPlaceholder } from "../_lib/mandal-grid";
import { useMandalCellsContext } from "../_hooks/mandal-cells-context";

interface MandalCellProps {
  cellIndex: number;
}

const MandalCell = ({ cellIndex }: MandalCellProps) => {
  const { cells, selectedIndex, setSelectedIndex, updateCell } = useMandalCellsContext();
  const value = cells[cellIndex];
  const isSelected = selectedIndex === cellIndex;
  const isFilled = value.trim().length > 0;

  const className = [
    getBoardClass(cellIndex),
    isSelected ? "is-selected" : "",
    isFilled ? "is-filled" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <label className={className}>
      <textarea
        aria-label={`Mandal-Art cell ${cellIndex + 1}`}
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
