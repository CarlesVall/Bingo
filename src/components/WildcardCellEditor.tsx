import type { WildcardCell } from "../domain/bingoTypes";
import { CellContentEditor } from "./CellContentEditor";

type WildcardCellEditorProps = {
  value: WildcardCell;
  onChange: (value: WildcardCell) => void;
};

export function WildcardCellEditor({
  value,
  onChange,
}: WildcardCellEditorProps) {
  return (
    <div className="wildcard-editor">
      <CellContentEditor label="Casilla comodin" value={value} onChange={onChange} />
    </div>
  );
}
