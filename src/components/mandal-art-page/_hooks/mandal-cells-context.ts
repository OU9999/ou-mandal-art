import { createContext, useContext } from "react";
import type { MandalCellsValue } from "./use-mandal-cells";

const MandalCellsContext = createContext<MandalCellsValue | null>(null);

const useMandalCellsContext = () => {
  const value = useContext(MandalCellsContext);
  if (!value) throw new Error("useMandalCellsContext must be used within MandalCellsProvider");
  return value;
};

export { MandalCellsContext, useMandalCellsContext };
