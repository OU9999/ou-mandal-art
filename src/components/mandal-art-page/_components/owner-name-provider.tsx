import type { ReactNode } from "react";
import { OwnerNameContext } from "../_hooks/owner-name-context";
import { useOwnerName } from "../_hooks/use-owner-name";

interface OwnerNameProviderProps {
  children: ReactNode;
}

const OwnerNameProvider = ({ children }: OwnerNameProviderProps) => {
  const value = useOwnerName();
  return <OwnerNameContext.Provider value={value}>{children}</OwnerNameContext.Provider>;
};

export { OwnerNameProvider };
