import type { ReactNode } from "react";
import { MandalCellsContext } from "../_hooks/mandal-cells-context";
import { useMandalCells } from "../_hooks/use-mandal-cells";

interface MandalCellsProviderProps {
  children: ReactNode;
}

const MandalCellsProvider = ({ children }: MandalCellsProviderProps) => {
  const value = useMandalCells();
  return <MandalCellsContext.Provider value={value}>{children}</MandalCellsContext.Provider>;
};

export { MandalCellsProvider };
