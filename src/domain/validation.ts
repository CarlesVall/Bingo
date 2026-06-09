import {
  MAX_BINGO_SIZE,
  MIN_BINGO_SIZE,
  type Bingo,
  type ScoreRuleKey,
} from "./bingoTypes";

export type ValidationResult = {
  isValid: boolean;
  errors: string[];
  warnings: string[];
};

function hasCellContent(content: {
  contentType: "text" | "image";
  text?: string;
  imageDataUrl?: string;
}) {
  if (content.contentType === "text") {
    return Boolean(content.text?.trim());
  }

  return Boolean(content.imageDataUrl);
}

export function validateBingo(bingo: Bingo): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!bingo.title.trim()) {
    errors.push("El titulo es obligatorio.");
  }

  if (bingo.size < MIN_BINGO_SIZE || bingo.size > MAX_BINGO_SIZE) {
    errors.push(`El tamano debe estar entre ${MIN_BINGO_SIZE} y ${MAX_BINGO_SIZE}.`);
  }

  if (bingo.cells.length !== bingo.size * bingo.size) {
    errors.push("La cuadricula no coincide con el tamano elegido.");
  }

  const emptyCells = bingo.cells.filter((cell) => !hasCellContent(cell));
  if (emptyCells.length > 0) {
    errors.push("Todas las casillas deben tener texto o imagen.");
  }

  if (bingo.wildcard.enabled !== false && !hasCellContent(bingo.wildcard)) {
    errors.push("La casilla comodin debe tener texto o imagen.");
  }

  if (bingo.scoring.enabled !== false) {
    if (bingo.scoring.scoreTypes.length === 0) {
      errors.push("Debe existir al menos un tipo de puntuacion.");
    }

    for (const scoreType of bingo.scoring.scoreTypes) {
      if (!scoreType.name.trim()) {
        errors.push("Cada tipo de puntuacion necesita nombre.");
      }

      if (!scoreType.icon.trim()) {
        errors.push("Cada tipo de puntuacion necesita icono.");
      }
    }

    const names = bingo.scoring.scoreTypes.map((scoreType) =>
      scoreType.name.trim().toLowerCase(),
    );
    if (new Set(names).size !== names.length) {
      warnings.push("Hay nombres de puntuacion duplicados.");
    }

    const ruleKeys: ScoreRuleKey[] = [
      "markedCell",
      "completedLine",
      "completedBingo",
      "wildcardUsed",
    ];

    for (const ruleKey of ruleKeys) {
      for (const scoreType of bingo.scoring.scoreTypes) {
        const value = bingo.scoring.rules[ruleKey][scoreType.id];
        if (!Number.isFinite(value)) {
          errors.push("Los valores de puntuacion deben ser numeros validos.");
        }
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}
