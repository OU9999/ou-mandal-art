import { createContext, useContext } from "react";
import type { OwnerNameValue } from "./use-owner-name";

const OwnerNameContext = createContext<OwnerNameValue | null>(null);

const useOwnerNameContext = () => {
  const value = useContext(OwnerNameContext);
  if (!value) throw new Error("useOwnerNameContext must be used within OwnerNameProvider");
  return value;
};

export { OwnerNameContext, useOwnerNameContext };
