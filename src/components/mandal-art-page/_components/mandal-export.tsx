import type { ReactNode, Ref } from "react";

interface MandalExportProps {
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}

const MandalExport = ({ ref, children }: MandalExportProps) => (
  <div ref={ref} className="mandal-export">
    {children}
  </div>
);

export { MandalExport };
