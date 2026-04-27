import type { ReactNode } from "react";

interface MandalSidebarProps {
  children: ReactNode;
}

const MandalSidebar = ({ children }: MandalSidebarProps) => (
  <aside className="mandal-sidebar">{children}</aside>
);

export { MandalSidebar };
