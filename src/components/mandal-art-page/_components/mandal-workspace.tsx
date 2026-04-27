import type { ReactNode } from "react";

interface MandalWorkspaceProps {
  children: ReactNode;
}

const MandalWorkspace = ({ children }: MandalWorkspaceProps) => (
  <div className="mandal-workspace">{children}</div>
);

export { MandalWorkspace };
