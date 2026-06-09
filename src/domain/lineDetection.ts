import type { Bingo } from "./bingoTypes";

export type LineDefinition = {
  id: string;
  label: string;
  cellIds: string[];
};

export function getLineDefinitions(bingo: Bingo): LineDefinition[] {
  const lines: LineDefinition[] = [];

  for (let row = 0; row < bingo.size; row += 1) {
    lines.push({
      id: `row-${row}`,
      label: `Fila ${row + 1}`,
      cellIds: bingo.cells
        .filter((cell) => cell.row === row)
        .sort((a, b) => a.col - b.col)
        .map((cell) => cell.id),
    });
  }

  for (let col = 0; col < bingo.size; col += 1) {
    lines.push({
      id: `col-${col}`,
      label: `Columna ${col + 1}`,
      cellIds: bingo.cells
        .filter((cell) => cell.col === col)
        .sort((a, b) => a.row - b.row)
        .map((cell) => cell.id),
    });
  }

  if (bingo.scoring.includeDiagonals) {
    lines.push({
      id: "diag-main",
      label: "Diagonal principal",
      cellIds: bingo.cells
        .filter((cell) => cell.row === cell.col)
        .sort((a, b) => a.row - b.row)
        .map((cell) => cell.id),
    });

    lines.push({
      id: "diag-anti",
      label: "Diagonal inversa",
      cellIds: bingo.cells
        .filter((cell) => cell.row + cell.col === bingo.size - 1)
        .sort((a, b) => a.row - b.row)
        .map((cell) => cell.id),
    });
  }

  return lines;
}

export function getEffectiveMarkedSet(
  markedCellIds: string[],
  wildcardAppliedToCellId?: string | null,
) {
  const markedSet = new Set(markedCellIds);

  if (wildcardAppliedToCellId) {
    markedSet.add(wildcardAppliedToCellId);
  }

  return markedSet;
}

export function getCompletedLines(
  bingo: Bingo,
  markedCellIds: string[],
  wildcardAppliedToCellId?: string | null,
) {
  const markedSet = getEffectiveMarkedSet(markedCellIds, wildcardAppliedToCellId);

  return getLineDefinitions(bingo).filter((line) =>
    line.cellIds.every((cellId) => markedSet.has(cellId)),
  );
}

export function isBingoComplete(
  bingo: Bingo,
  markedCellIds: string[],
  wildcardAppliedToCellId?: string | null,
) {
  const markedSet = getEffectiveMarkedSet(markedCellIds, wildcardAppliedToCellId);

  return bingo.cells.every((cell) => markedSet.has(cell.id));
}
