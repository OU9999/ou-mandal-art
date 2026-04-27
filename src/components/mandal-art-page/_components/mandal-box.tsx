import { getBoxCellIndices } from "../_lib/mandal-grid";
import { MandalCell } from "./mandal-cell";

interface MandalBoxProps {
  boardIndex: number;
}

const MandalBox = ({ boardIndex }: MandalBoxProps) => (
  <div className="mandal-box" data-mandal-box={boardIndex}>
    {getBoxCellIndices(boardIndex).map((cellIndex) => (
      <MandalCell key={cellIndex} cellIndex={cellIndex} />
    ))}
  </div>
);

export { MandalBox };
