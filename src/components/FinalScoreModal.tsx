import { Check, RotateCcw, Save } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  calculateFinalScore,
  findBestWildcardTarget,
  isScoringEnabled,
} from "../domain/scoring";
import type { Bingo, FinalScore } from "../domain/bingoTypes";
import { getCompletedLines, isBingoComplete } from "../domain/lineDetection";
import { BingoBoard } from "./BingoBoard";

type FinalScoreModalProps = {
  bingo: Bingo;
  markedCellIds: string[];
  initialWildcardAppliedToCellId?: string | null;
  manualWildcardMode?: boolean;
  onBackToGame: () => void;
  onSaveResult: (
    wildcardAppliedToCellId: string | null,
    finalScore: FinalScore,
  ) => Promise<void>;
};

const breakdownLabels = {
  markedCells: "Casillas",
  completedLines: "Lineas",
  completedBingo: "Bingo",
  wildcardUsed: "Comodin",
} as const;

export function FinalScoreModal({
  bingo,
  markedCellIds,
  initialWildcardAppliedToCellId = null,
  manualWildcardMode = false,
  onBackToGame,
  onSaveResult,
}: FinalScoreModalProps) {
  const recommendedCell = useMemo(
    () => findBestWildcardTarget(bingo, markedCellIds),
    [bingo, markedCellIds],
  );
  const [wildcardCellId, setWildcardCellId] = useState<string | null>(
    initialWildcardAppliedToCellId ??
      (manualWildcardMode ? null : (recommendedCell?.id ?? null)),
  );
  const [isSaving, setIsSaving] = useState(false);
  const scoringEnabled = isScoringEnabled(bingo);
  const markedSet = useMemo(() => new Set(markedCellIds), [markedCellIds]);
  const unmarkedCells = bingo.cells.filter((cell) => !markedSet.has(cell.id));
  const finalScore = useMemo(
    () => calculateFinalScore(bingo, markedCellIds, wildcardCellId),
    [bingo, markedCellIds, wildcardCellId],
  );
  const completedLines = useMemo(
    () => getCompletedLines(bingo, markedCellIds, wildcardCellId),
    [bingo, markedCellIds, wildcardCellId],
  );
  const hasBingo = isBingoComplete(bingo, markedCellIds, wildcardCellId);

  useEffect(() => {
    if (initialWildcardAppliedToCellId) {
      setWildcardCellId(initialWildcardAppliedToCellId);
      return;
    }
    if (manualWildcardMode) {
      setWildcardCellId(null);
      return;
    }
    setWildcardCellId(recommendedCell?.id ?? null);
  }, [initialWildcardAppliedToCellId, manualWildcardMode, recommendedCell?.id]);

  async function handleSave() {
    setIsSaving(true);
    try {
      await onSaveResult(wildcardCellId, finalScore);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="final-modal" role="dialog" aria-modal="true">
        <header className="modal-header">
          <div>
            <h2>Resumen final</h2>
            <p>
              {completedLines.length} lineas completadas
              {hasBingo ? " y bingo completo" : ""}
            </p>
          </div>
          <button type="button" onClick={onBackToGame} title="Volver a partida">
            <RotateCcw size={18} />
          </button>
        </header>

        <div className="final-content">
          <div className="final-board">
            <BingoBoard
              bingo={bingo}
              markedCellIds={markedCellIds}
              completedLineIds={completedLines.map((line) => line.id)}
              wildcardAppliedToCellId={wildcardCellId}
              compact
            />
          </div>

          <div className="final-details">
            {manualWildcardMode ? (
              <div className="manual-wildcard-summary">
                <span>Comodin en partida</span>
                <strong>
                  {wildcardCellId
                    ? (() => {
                        const cell = bingo.cells.find(
                          (candidate) => candidate.id === wildcardCellId,
                        );
                        if (!cell) {
                          return "Aplicado";
                        }
                        return `Fila ${cell.row + 1}, columna ${cell.col + 1}`;
                      })()
                    : "No usado"}
                </strong>
                {wildcardCellId ? null : unmarkedCells.length === 0 ? (
                  <p>No quedan casillas libres para usar comodin.</p>
                ) : (
                  <p>Puedes colocarlo en la partida arrastrandolo sobre una casilla.</p>
                )}
              </div>
            ) : (
              <label>
                <span>Aplicar comodin</span>
                <select
                  value={wildcardCellId ?? ""}
                  onChange={(event) => setWildcardCellId(event.target.value || null)}
                  disabled={unmarkedCells.length === 0}
                >
                  <option value="">No usar comodin</option>
                  {unmarkedCells.map((cell) => (
                    <option key={cell.id} value={cell.id}>
                      Fila {cell.row + 1}, columna {cell.col + 1}
                      {cell.id === recommendedCell?.id ? " - recomendado" : ""}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {scoringEnabled ? (
              <>
                <div className="score-summary">
                  <h3>Totales</h3>
                  {bingo.scoring.scoreTypes.map((scoreType) => (
                    <div className="score-total" key={scoreType.id}>
                      <span className="score-icon">{scoreType.icon}</span>
                      <span>{scoreType.name}</span>
                      <strong>{finalScore.byScoreType[scoreType.id] ?? 0}</strong>
                    </div>
                  ))}
                </div>

                <div className="score-breakdown">
                  <h3>Desglose</h3>
                  {Object.entries(finalScore.breakdown).map(([key, scoreMap]) => (
                    <div className="breakdown-row" key={key}>
                      <span>{breakdownLabels[key as keyof typeof breakdownLabels]}</span>
                      <span>
                        {bingo.scoring.scoreTypes
                          .map((scoreType) => `${scoreType.icon} ${scoreMap[scoreType.id] ?? 0}`)
                          .join(" / ")}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="scoreless-summary">
                <h3>Resultado</h3>
                <div className="breakdown-row">
                  <span>Casillas</span>
                  <strong>{markedCellIds.length}/{bingo.cells.length}</strong>
                </div>
                <div className="breakdown-row">
                  <span>Lineas</span>
                  <strong>{completedLines.length}</strong>
                </div>
                <div className="breakdown-row">
                  <span>Bingo</span>
                  <strong>{hasBingo ? "Completo" : "Pendiente"}</strong>
                </div>
              </div>
            )}

            <button
              type="button"
              className="primary wide"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <Check size={18} /> : <Save size={18} />}
              {isSaving ? "Guardando" : "Guardar resultado"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
