import { useMandalCellsContext } from "../_hooks/mandal-cells-context";

interface MandalActionsProps {
  onExport: () => void;
}

const MandalActions = ({ onExport }: MandalActionsProps) => {
  const { reset } = useMandalCellsContext();

  return (
    <nav className="mandal-actions" aria-label="Mandal-Art actions">
      <button type="button" className="route-pill" onClick={onExport}>
        Make Image
      </button>
      <button type="button" className="route-pill" onClick={reset}>
        Reset
      </button>
    </nav>
  );
};

export { MandalActions };
