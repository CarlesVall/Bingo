import {
  createCells,
  createDefaultAppearance,
  createDefaultScoring,
  createEmptyBingo,
} from "./bingoFactory";
import {
  MAX_BINGO_SIZE,
  MIN_BINGO_SIZE,
  type AppearanceConfig,
  type Bingo,
  type ScoringConfig,
} from "./bingoTypes";

export const SHARE_HASH_KEY = "share";
export const SHARED_TEMPLATE_VERSION = 1;

type SharedAppearanceConfig = Omit<AppearanceConfig, "backgroundImageDataUrl">;

export type SharedBingoTemplate = {
  version: typeof SHARED_TEMPLATE_VERSION;
  title: string;
  size: number;
  scoring: ScoringConfig;
  appearance: SharedAppearanceConfig;
};

function encodeBase64Url(value: string) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

function decodeBase64Url(value: string) {
  const paddedValue = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), "=");
  const binary = atob(paddedValue.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));

  return new TextDecoder().decode(bytes);
}

function cloneScoring(scoring: ScoringConfig): ScoringConfig {
  return JSON.parse(JSON.stringify(scoring)) as ScoringConfig;
}

function cloneAppearance(appearance: SharedAppearanceConfig): SharedAppearanceConfig {
  return JSON.parse(JSON.stringify(appearance)) as SharedAppearanceConfig;
}

function sanitizeSize(size: number) {
  const numericSize = Number.isFinite(size) ? size : MIN_BINGO_SIZE;

  return Math.min(
    MAX_BINGO_SIZE,
    Math.max(MIN_BINGO_SIZE, Math.floor(numericSize)),
  );
}

function sanitizeScoring(scoring: ScoringConfig | undefined): ScoringConfig {
  const defaultScoring = createDefaultScoring();
  const scoreTypes =
    scoring?.scoreTypes
      ?.filter((scoreType) => scoreType.id && scoreType.name && scoreType.icon)
      .map((scoreType) => ({ ...scoreType })) ?? [];

  if (scoreTypes.length === 0) {
    return defaultScoring;
  }

  function sanitizeRule(rule: Record<string, number> | undefined) {
    return Object.fromEntries(
      scoreTypes.map((scoreType) => {
        const value = rule?.[scoreType.id];
        return [
          scoreType.id,
          typeof value === "number" && Number.isFinite(value) ? value : 0,
        ];
      }),
    );
  }

  return {
    scoreTypes,
    rules: {
      markedCell: sanitizeRule(scoring?.rules?.markedCell),
      completedLine: sanitizeRule(scoring?.rules?.completedLine),
      completedBingo: sanitizeRule(scoring?.rules?.completedBingo),
      wildcardUsed: sanitizeRule(scoring?.rules?.wildcardUsed),
    },
    includeDiagonals: Boolean(scoring?.includeDiagonals),
  };
}

function sanitizeTemplate(candidate: SharedBingoTemplate): SharedBingoTemplate {
  const defaultAppearance = createDefaultAppearance();
  const appearance = cloneAppearance({
    backgroundColor:
      candidate.appearance?.backgroundColor ?? defaultAppearance.backgroundColor,
    boardColor: candidate.appearance?.boardColor ?? defaultAppearance.boardColor,
    cellColor: candidate.appearance?.cellColor ?? defaultAppearance.cellColor,
    cellTextColor:
      candidate.appearance?.cellTextColor ?? defaultAppearance.cellTextColor,
    borderColor: candidate.appearance?.borderColor ?? defaultAppearance.borderColor,
    markColor: candidate.appearance?.markColor ?? defaultAppearance.markColor,
    titleColor: candidate.appearance?.titleColor ?? defaultAppearance.titleColor,
    fontFamily: candidate.appearance?.fontFamily ?? defaultAppearance.fontFamily,
    cellStyle: candidate.appearance?.cellStyle ?? defaultAppearance.cellStyle,
  });

  return {
    version: SHARED_TEMPLATE_VERSION,
    title: typeof candidate.title === "string" ? candidate.title : "",
    size: sanitizeSize(candidate.size),
    scoring: sanitizeScoring(candidate.scoring),
    appearance,
  };
}

export function createSharedBingoTemplate(bingo: Bingo): SharedBingoTemplate {
  const { backgroundImageDataUrl: _backgroundImageDataUrl, ...appearance } =
    bingo.appearance;

  return sanitizeTemplate({
    version: SHARED_TEMPLATE_VERSION,
    title: bingo.title,
    size: bingo.size,
    scoring: cloneScoring(bingo.scoring),
    appearance: cloneAppearance(appearance),
  });
}

export function encodeSharedBingoTemplate(template: SharedBingoTemplate) {
  return encodeBase64Url(JSON.stringify(sanitizeTemplate(template)));
}

export function decodeSharedBingoTemplate(value: string) {
  try {
    const parsed = JSON.parse(decodeBase64Url(value)) as SharedBingoTemplate;

    if (parsed.version !== SHARED_TEMPLATE_VERSION) {
      return null;
    }

    return sanitizeTemplate(parsed);
  } catch {
    return null;
  }
}

export function createBingoFromSharedTemplate(template: SharedBingoTemplate): Bingo {
  const sanitizedTemplate = sanitizeTemplate(template);
  const now = new Date().toISOString();
  const emptyBingo = createEmptyBingo(sanitizedTemplate.size);

  return {
    ...emptyBingo,
    title: sanitizedTemplate.title,
    size: sanitizedTemplate.size,
    cells: createCells(sanitizedTemplate.size),
    wildcard: {
      contentType: "text",
      text: "",
    },
    scoring: cloneScoring(sanitizedTemplate.scoring),
    appearance: cloneAppearance(sanitizedTemplate.appearance),
    createdAt: now,
    updatedAt: now,
  };
}

export function getSharedTemplateFromHash(hash: string) {
  const parameters = new URLSearchParams(hash.replace(/^#/, ""));
  const encodedTemplate = parameters.get(SHARE_HASH_KEY);

  if (!encodedTemplate) {
    return null;
  }

  return decodeSharedBingoTemplate(encodedTemplate);
}

export function createShareHash(bingo: Bingo) {
  return `#${SHARE_HASH_KEY}=${encodeSharedBingoTemplate(
    createSharedBingoTemplate(bingo),
  )}`;
}
