import { useMandalCellsContext } from "../_hooks/mandal-cells-context";

const MandalStatus = () => {
  const { filledCount, heat } = useMandalCellsContext();

  return (
    <aside className="mandal-status" aria-live="polite" role="status">
      <span>{filledCount}</span>
      <span>/81</span>
      <span>{heat}%</span>
    </aside>
  );
};

export { MandalStatus };
