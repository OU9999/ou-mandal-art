import type { CSSProperties, ReactNode, Ref } from "react";
import { useMandalCellsContext } from "../_hooks/mandal-cells-context";

interface MandalBoardProps {
  ref?: Ref<HTMLDivElement>;
  children: ReactNode;
}

const MandalBoard = ({ ref, children }: MandalBoardProps) => {
  const { heat } = useMandalCellsContext();
  const heatStyle = { "--heat": `${heat}%` } as CSSProperties;

  return (
    <div ref={ref} className="mandal-board" style={heatStyle}>
      {children}
    </div>
  );
};

export { MandalBoard };
