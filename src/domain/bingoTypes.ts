export const MIN_BINGO_SIZE = 3;
export const MAX_BINGO_SIZE = 8;

export type ContentType = "text" | "image";

export type Bingo = {
  id: string;
  title: string;
  size: number;
  cells: BingoCell[];
  wildcard: WildcardCell;
  scoring: ScoringConfig;
  appearance: AppearanceConfig;
  createdAt: string;
  updatedAt: string;
};

export type BingoCell = {
  id: string;
  row: number;
  col: number;
  contentType: ContentType;
  text?: string;
  imageDataUrl?: string;
  altText?: string;
};

export type WildcardCell = {
  contentType: ContentType;
  text?: string;
  imageDataUrl?: string;
  altText?: string;
};

export type ScoreType = {
  id: string;
  name: string;
  icon: string;
};

export type ScoreValueMap = Record<string, number>;

export type ScoringConfig = {
  enabled: boolean;
  scoreTypes: ScoreType[];
  rules: {
    markedCell: ScoreValueMap;
    completedLine: ScoreValueMap;
    completedBingo: ScoreValueMap;
    wildcardUsed: ScoreValueMap;
  };
  includeDiagonals: boolean;
};

export type ScoreRuleKey = keyof ScoringConfig["rules"];

export type AppearanceConfig = {
  backgroundColor: string;
  boardColor: string;
  cellColor: string;
  cellTextColor: string;
  borderColor: string;
  markColor: string;
  titleColor: string;
  fontFamily: string;
  cellStyle:
    | "classic"
    | "soft"
    | "bold"
    | "minimal"
    | "rounded"
    | "ticket"
    | "neon"
    | "paper"
    | "stamp";
  backgroundImageDataUrl?: string;
};

export type BingoSession = {
  id: string;
  bingoId: string;
  startedAt: string;
  endedAt?: string;
  markedCellIds: string[];
  completedLineIds: string[];
  bingoCompletedAt?: string;
  wildcardAppliedToCellId?: string;
  finalScore?: FinalScore;
};

export type FinalScore = {
  byScoreType: Record<string, number>;
  breakdown: {
    markedCells: Record<string, number>;
    completedLines: Record<string, number>;
    completedBingo: Record<string, number>;
    wildcardUsed: Record<string, number>;
  };
};
