import type { ReactNode } from "react";

interface MandalLayoutProps {
  children: ReactNode;
}

const MandalLayout = ({ children }: MandalLayoutProps) => (
  <section className="mandal-page">{children}</section>
);

export { MandalLayout };
