import {
  MAX_BINGO_SIZE,
  MIN_BINGO_SIZE,
  type AppearanceConfig,
  type Bingo,
  type BingoCell,
  type ScoringConfig,
} from "./bingoTypes";

export function createId() {
  return crypto.randomUUID();
}

export function clampBingoSize(size: number) {
  return Math.min(MAX_BINGO_SIZE, Math.max(MIN_BINGO_SIZE, size));
}

export function createCells(size: number, existingCells: BingoCell[] = []) {
  const cells: BingoCell[] = [];

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const existing = existingCells.find(
        (cell) => cell.row === row && cell.col === col,
      );
      cells.push(
        existing ?? {
          id: createId(),
          row,
          col,
          contentType: "text",
          text: "",
        },
      );
    }
  }

  return cells;
}

export function createDefaultAppearance(): AppearanceConfig {
  return {
    backgroundColor: "#f6f7fb",
    boardColor: "#ffffff",
    cellColor: "#ffffff",
    cellTextColor: "#20242a",
    borderColor: "#1f8a70",
    markColor: "#ef6f61",
    titleColor: "#20242a",
    fontFamily: "Inter, system-ui, sans-serif",
    cellStyle: "classic",
  };
}

export function createDefaultScoring(): ScoringConfig {
  const scoreTypeId = createId();

  return {
    enabled: true,
    scoreTypes: [
      {
        id: scoreTypeId,
        name: "Puntos",
        icon: "pts",
      },
    ],
    rules: {
      markedCell: { [scoreTypeId]: 1 },
      completedLine: { [scoreTypeId]: 5 },
      completedBingo: { [scoreTypeId]: 25 },
      wildcardUsed: { [scoreTypeId]: 0 },
    },
    includeDiagonals: true,
  };
}

export function createEmptyBingo(size = 3): Bingo {
  const safeSize = clampBingoSize(size);
  const now = new Date().toISOString();

  return {
    id: createId(),
    title: "",
    size: safeSize,
    cells: createCells(safeSize),
    wildcard: {
      contentType: "text",
      text: "",
    },
    scoring: createDefaultScoring(),
    appearance: createDefaultAppearance(),
    createdAt: now,
    updatedAt: now,
  };
}

export function resizeBingo(bingo: Bingo, nextSize: number): Bingo {
  const safeSize = clampBingoSize(nextSize);

  return {
    ...bingo,
    size: safeSize,
    cells: createCells(safeSize, bingo.cells),
  };
}

export function duplicateBingo(bingo: Bingo): Bingo {
  const now = new Date().toISOString();
  const scoreTypeIdMap = new Map<string, string>();
  const scoreTypes = bingo.scoring.scoreTypes.map((scoreType) => {
    const nextId = createId();
    scoreTypeIdMap.set(scoreType.id, nextId);
    return {
      ...scoreType,
      id: nextId,
    };
  });

  function remapRule(rule: Record<string, number>) {
    return Object.fromEntries(
      Object.entries(rule).map(([scoreTypeId, value]) => [
        scoreTypeIdMap.get(scoreTypeId) ?? scoreTypeId,
        value,
      ]),
    );
  }

  return {
    ...JSON.parse(JSON.stringify(bingo)),
    id: createId(),
    title: `Copia de ${bingo.title}`,
    cells: bingo.cells.map((cell) => ({ ...cell, id: createId() })),
    scoring: {
      ...bingo.scoring,
      enabled: bingo.scoring.enabled !== false,
      scoreTypes,
      rules: {
        markedCell: remapRule(bingo.scoring.rules.markedCell),
        completedLine: remapRule(bingo.scoring.rules.completedLine),
        completedBingo: remapRule(bingo.scoring.rules.completedBingo),
        wildcardUsed: remapRule(bingo.scoring.rules.wildcardUsed),
      },
    },
    createdAt: now,
    updatedAt: now,
  };
}
