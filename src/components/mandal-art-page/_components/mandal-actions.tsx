import { useMandalCellsContext } from "../_hooks/mandal-cells-context";

interface MandalActionsProps {
  onExport: () => void;
}

const MandalActions = ({ onExport }: MandalActionsProps) => {
  const { reset } = useMandalCellsContext();

  return (
    <nav className="mandal-actions" aria-label="Mandal-Art actions">
      <a className="route-pill" href={`${import.meta.env.BASE_URL}3d`}>
        3D
      </a>
      <button type="button" className="route-pill" onClick={onExport}>
        PNG
      </button>
      <button type="button" className="route-pill" onClick={reset}>
        Reset
      </button>
    </nav>
  );
};

export { MandalActions };
