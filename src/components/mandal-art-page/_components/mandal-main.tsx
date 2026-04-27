import type { ReactNode } from "react";

interface MandalMainProps {
  children: ReactNode;
}

const MandalMain = ({ children }: MandalMainProps) => (
  <main className="mandal-main">{children}</main>
);

export { MandalMain };
