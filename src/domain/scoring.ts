import type { Bingo, FinalScore, ScoreValueMap } from "./bingoTypes";
import { getCompletedLines, isBingoComplete } from "./lineDetection";

function emptyScoreMap(bingo: Bingo): ScoreValueMap {
  return Object.fromEntries(
    bingo.scoring.scoreTypes.map((scoreType) => [scoreType.id, 0]),
  );
}

function multiplyRule(rule: ScoreValueMap, bingo: Bingo, count: number) {
  return Object.fromEntries(
    bingo.scoring.scoreTypes.map((scoreType) => [
      scoreType.id,
      (rule[scoreType.id] ?? 0) * count,
    ]),
  );
}

function sumScoreMaps(bingo: Bingo, maps: ScoreValueMap[]) {
  const total = emptyScoreMap(bingo);

  for (const map of maps) {
    for (const scoreType of bingo.scoring.scoreTypes) {
      total[scoreType.id] += map[scoreType.id] ?? 0;
    }
  }

  return total;
}

export function calculateFinalScore(
  bingo: Bingo,
  markedCellIds: string[],
  wildcardAppliedToCellId?: string | null,
): FinalScore {
  const effectiveMarkedCount =
    markedCellIds.length + (wildcardAppliedToCellId ? 1 : 0);
  const completedLines = getCompletedLines(
    bingo,
    markedCellIds,
    wildcardAppliedToCellId,
  );
  const hasBingo = isBingoComplete(
    bingo,
    markedCellIds,
    wildcardAppliedToCellId,
  );

  const markedCells = multiplyRule(
    bingo.scoring.rules.markedCell,
    bingo,
    effectiveMarkedCount,
  );
  const completedLineScore = multiplyRule(
    bingo.scoring.rules.completedLine,
    bingo,
    completedLines.length,
  );
  const completedBingo = multiplyRule(
    bingo.scoring.rules.completedBingo,
    bingo,
    hasBingo ? 1 : 0,
  );
  const wildcardUsed = multiplyRule(
    bingo.scoring.rules.wildcardUsed,
    bingo,
    wildcardAppliedToCellId ? 1 : 0,
  );

  return {
    byScoreType: sumScoreMaps(bingo, [
      markedCells,
      completedLineScore,
      completedBingo,
      wildcardUsed,
    ]),
    breakdown: {
      markedCells,
      completedLines: completedLineScore,
      completedBingo,
      wildcardUsed,
    },
  };
}

export function scoreAsNumber(score: FinalScore) {
  return Object.values(score.byScoreType).reduce((total, value) => total + value, 0);
}

export function findBestWildcardTarget(
  bingo: Bingo,
  markedCellIds: string[],
) {
  const markedSet = new Set(markedCellIds);
  const candidates = bingo.cells.filter((cell) => !markedSet.has(cell.id));

  if (candidates.length === 0) {
    return null;
  }

  return candidates.reduce((bestCell, cell) => {
    const bestScore = scoreAsNumber(
      calculateFinalScore(bingo, markedCellIds, bestCell.id),
    );
    const currentScore = scoreAsNumber(
      calculateFinalScore(bingo, markedCellIds, cell.id),
    );

    return currentScore > bestScore ? cell : bestCell;
  }, candidates[0]);
}
