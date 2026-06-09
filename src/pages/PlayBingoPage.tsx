import { ArrowLeft, CheckCircle2, Flag, RotateCcw } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { BingoBoard } from "../components/BingoBoard";
import { FinalScoreModal } from "../components/FinalScoreModal";
import type { Bingo, BingoCell, FinalScore } from "../domain/bingoTypes";
import { getCompletedLines, isBingoComplete } from "../domain/lineDetection";

type PlayBingoPageProps = {
  bingo: Bingo;
  onBack: () => void;
  onSaveSession: (
    bingo: Bingo,
    markedCellIds: string[],
    wildcardAppliedToCellId: string | null,
    finalScore: FinalScore,
  ) => Promise<void>;
};

type PersistedPlayState = {
  markedCellIds: string[];
  wildcardAppliedToCellId: string | null;
};

type WildcardGhostPosition = {
  x: number;
  y: number;
};

function readPersistedState(
  storageKey: string,
  validCellIds: Set<string>,
): PersistedPlayState {
  const stored = localStorage.getItem(storageKey);
  if (!stored) {
    return { markedCellIds: [], wildcardAppliedToCellId: null };
  }

  try {
    const parsed = JSON.parse(stored) as string[] | PersistedPlayState;
    if (Array.isArray(parsed)) {
      return {
        markedCellIds: parsed.filter((cellId) => validCellIds.has(cellId)),
        wildcardAppliedToCellId: null,
      };
    }

    const wildcardCellId =
      parsed.wildcardAppliedToCellId &&
      validCellIds.has(parsed.wildcardAppliedToCellId)
        ? parsed.wildcardAppliedToCellId
        : null;

    return {
      markedCellIds: parsed.markedCellIds.filter((cellId) =>
        validCellIds.has(cellId),
      ),
      wildcardAppliedToCellId: wildcardCellId,
    };
  } catch {
    return { markedCellIds: [], wildcardAppliedToCellId: null };
  }
}

export function PlayBingoPage({
  bingo,
  onBack,
  onSaveSession,
}: PlayBingoPageProps) {
  const storageKey = `bingo-session-${bingo.id}`;
  const validCellIds = useMemo(
    () => new Set(bingo.cells.map((cell) => cell.id)),
    [bingo.cells],
  );
  const initialState = useMemo(
    () => readPersistedState(storageKey, validCellIds),
    [storageKey, validCellIds],
  );
  const [markedCellIds, setMarkedCellIds] = useState<string[]>(
    initialState.markedCellIds,
  );
  const [wildcardAppliedToCellId, setWildcardAppliedToCellId] = useState<
    string | null
  >(initialState.wildcardAppliedToCellId);
  const [flashLineIds, setFlashLineIds] = useState<string[]>([]);
  const [showBingoBurst, setShowBingoBurst] = useState(false);
  const [showFinalScore, setShowFinalScore] = useState(false);
  const [isDraggingWildcard, setIsDraggingWildcard] = useState(false);
  const [wildcardDragOverCellId, setWildcardDragOverCellId] = useState<
    string | null
  >(null);
  const [wildcardDropPulseCellId, setWildcardDropPulseCellId] = useState<
    string | null
  >(null);
  const [wildcardGhostPosition, setWildcardGhostPosition] =
    useState<WildcardGhostPosition | null>(null);
  const wildcardPointerId = useRef<number | null>(null);
  const wildcardMoveHandler = useRef<((event: PointerEvent) => void) | null>(
    null,
  );
  const wildcardUpHandler = useRef<((event: PointerEvent) => void) | null>(null);
  const wildcardCancelHandler = useRef<((event: PointerEvent) => void) | null>(
    null,
  );
  const wildcardPulseTimeout = useRef<number | null>(null);
  const previousLineIds = useRef<string[]>([]);
  const previousBingoComplete = useRef(false);
  const markedSet = useMemo(() => new Set(markedCellIds), [markedCellIds]);

  const completedLines = useMemo(
    () => getCompletedLines(bingo, markedCellIds, wildcardAppliedToCellId),
    [bingo, markedCellIds, wildcardAppliedToCellId],
  );
  const bingoComplete = useMemo(
    () => isBingoComplete(bingo, markedCellIds, wildcardAppliedToCellId),
    [bingo, markedCellIds, wildcardAppliedToCellId],
  );
  const effectiveMarkedCount =
    markedCellIds.length +
    (wildcardAppliedToCellId && !markedSet.has(wildcardAppliedToCellId) ? 1 : 0);
  const wildcardStyle = {
    "--cell-bg": bingo.appearance.cellColor,
    "--cell-text": bingo.appearance.cellTextColor,
    "--cell-border": bingo.appearance.borderColor,
    "--bingo-font": bingo.appearance.fontFamily,
  } as CSSProperties;

  useEffect(() => {
    const payload: PersistedPlayState = {
      markedCellIds,
      wildcardAppliedToCellId,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
  }, [markedCellIds, wildcardAppliedToCellId, storageKey]);

  useEffect(() => {
    if (wildcardAppliedToCellId && markedSet.has(wildcardAppliedToCellId)) {
      setWildcardAppliedToCellId(null);
    }
  }, [markedSet, wildcardAppliedToCellId]);

  useEffect(() => {
    const nextLineIds = completedLines.map((line) => line.id);
    const newLineIds = nextLineIds.filter(
      (lineId) => !previousLineIds.current.includes(lineId),
    );

    if (newLineIds.length > 0) {
      setFlashLineIds(newLineIds);
      window.setTimeout(() => setFlashLineIds([]), 1100);
    }

    previousLineIds.current = nextLineIds;
  }, [completedLines]);

  useEffect(() => {
    if (bingoComplete && !previousBingoComplete.current) {
      setShowBingoBurst(true);
      window.setTimeout(() => setShowBingoBurst(false), 1600);
    }

    previousBingoComplete.current = bingoComplete;
  }, [bingoComplete]);

  function toggleCell(cell: BingoCell) {
    setMarkedCellIds((current) => {
      const nextMarked = current.includes(cell.id)
        ? current.filter((cellId) => cellId !== cell.id)
        : [...current, cell.id];

      if (wildcardAppliedToCellId && nextMarked.includes(wildcardAppliedToCellId)) {
        setWildcardAppliedToCellId(null);
      }

      return nextMarked;
    });
  }

  function canDropWildcardOnCell(cell: BingoCell) {
    return !markedSet.has(cell.id);
  }

  function startWildcardDrag() {
    setIsDraggingWildcard(true);
  }

  function endWildcardDrag() {
    setIsDraggingWildcard(false);
    setWildcardDragOverCellId(null);
    setWildcardGhostPosition(null);
  }

  function pulseWildcardDrop(cellId: string) {
    if (wildcardPulseTimeout.current) {
      window.clearTimeout(wildcardPulseTimeout.current);
    }

    setWildcardDropPulseCellId(cellId);
    wildcardPulseTimeout.current = window.setTimeout(
      () => setWildcardDropPulseCellId(null),
      650,
    );
  }

  function handleWildcardDropOnCell(cell: BingoCell) {
    if (!isDraggingWildcard || !canDropWildcardOnCell(cell)) {
      return;
    }
    setWildcardAppliedToCellId(cell.id);
    pulseWildcardDrop(cell.id);
    endWildcardDrag();
  }

  function getCellFromPoint(clientX: number, clientY: number) {
    const element = document.elementFromPoint(clientX, clientY);
    const cellElement = element?.closest<HTMLElement>("[data-bingo-cell-id]");
    const cellId = cellElement?.dataset.bingoCellId;

    if (!cellId) {
      return null;
    }

    return bingo.cells.find((cell) => cell.id === cellId) ?? null;
  }

  function moveWildcardPointerDrag(event: PointerEvent) {
    if (event.pointerId !== wildcardPointerId.current) {
      return;
    }

    setWildcardGhostPosition({ x: event.clientX, y: event.clientY });
    const cell = getCellFromPoint(event.clientX, event.clientY);
    if (cell && canDropWildcardOnCell(cell)) {
      setWildcardDragOverCellId(cell.id);
      return;
    }

    setWildcardDragOverCellId(null);
  }

  function stopWildcardPointerDrag() {
    if (wildcardMoveHandler.current) {
      window.removeEventListener("pointermove", wildcardMoveHandler.current);
    }
    if (wildcardUpHandler.current) {
      window.removeEventListener("pointerup", wildcardUpHandler.current);
    }
    if (wildcardCancelHandler.current) {
      window.removeEventListener(
        "pointercancel",
        wildcardCancelHandler.current,
      );
    }

    wildcardMoveHandler.current = null;
    wildcardUpHandler.current = null;
    wildcardCancelHandler.current = null;
    wildcardPointerId.current = null;
    endWildcardDrag();
  }

  function finishWildcardPointerDrag(event: PointerEvent) {
    if (event.pointerId !== wildcardPointerId.current) {
      return;
    }

    const cell = getCellFromPoint(event.clientX, event.clientY);
    if (cell && canDropWildcardOnCell(cell)) {
      setWildcardAppliedToCellId(cell.id);
      pulseWildcardDrop(cell.id);
    }

    stopWildcardPointerDrag();
  }

  function cancelWildcardPointerDrag(event: PointerEvent) {
    if (event.pointerId !== wildcardPointerId.current) {
      return;
    }

    stopWildcardPointerDrag();
  }

  function startWildcardPointerDrag(event: ReactPointerEvent<HTMLElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.preventDefault();
    wildcardPointerId.current = event.pointerId;
    setIsDraggingWildcard(true);
    setWildcardGhostPosition({ x: event.clientX, y: event.clientY });

    const cell = getCellFromPoint(event.clientX, event.clientY);
    setWildcardDragOverCellId(
      cell && canDropWildcardOnCell(cell) ? cell.id : null,
    );

    wildcardMoveHandler.current = moveWildcardPointerDrag;
    wildcardUpHandler.current = finishWildcardPointerDrag;
    wildcardCancelHandler.current = cancelWildcardPointerDrag;

    window.addEventListener("pointermove", wildcardMoveHandler.current);
    window.addEventListener("pointerup", wildcardUpHandler.current);
    window.addEventListener("pointercancel", wildcardCancelHandler.current);
  }

  useEffect(() => {
    return () => {
      if (wildcardMoveHandler.current) {
        window.removeEventListener("pointermove", wildcardMoveHandler.current);
      }
      if (wildcardUpHandler.current) {
        window.removeEventListener("pointerup", wildcardUpHandler.current);
      }
      if (wildcardCancelHandler.current) {
        window.removeEventListener(
          "pointercancel",
          wildcardCancelHandler.current,
        );
      }
      if (wildcardPulseTimeout.current) {
        window.clearTimeout(wildcardPulseTimeout.current);
      }
    };
  }, []);

  function resetSession() {
    if (window.confirm("Reiniciar las marcas de esta partida?")) {
      setMarkedCellIds([]);
      setWildcardAppliedToCellId(null);
      setShowFinalScore(false);
      localStorage.removeItem(storageKey);
    }
  }

  async function handleSaveResult(
    selectedWildcardCellId: string | null,
    finalScore: FinalScore,
  ) {
    setWildcardAppliedToCellId(selectedWildcardCellId);
    const payload: PersistedPlayState = {
      markedCellIds,
      wildcardAppliedToCellId: selectedWildcardCellId,
    };
    localStorage.setItem(storageKey, JSON.stringify(payload));
    await onSaveSession(bingo, markedCellIds, selectedWildcardCellId, finalScore);
  }

  return (
    <section className="play-page">
      <div className="play-board-row">
        <div className="play-board-wrap center-focus">
          {showBingoBurst ? <div className="bingo-burst">BINGO</div> : null}
          <BingoBoard
            bingo={bingo}
            markedCellIds={markedCellIds}
            completedLineIds={completedLines.map((line) => line.id)}
            flashLineIds={flashLineIds}
            wildcardAppliedToCellId={wildcardAppliedToCellId}
            wildcardDragOverCellId={wildcardDragOverCellId}
            wildcardDropPulseCellId={wildcardDropPulseCellId}
            interactive
            onWildcardDragStart={startWildcardDrag}
            onWildcardDragEnd={endWildcardDrag}
            onWildcardPointerStart={startWildcardPointerDrag}
            canDropWildcardOnCell={canDropWildcardOnCell}
            onWildcardDragEnterCell={(cell) => {
              if (!isDraggingWildcard) {
                return;
              }
              setWildcardDragOverCellId(cell.id);
            }}
            onWildcardDropOnCell={handleWildcardDropOnCell}
            onWildcardDragLeaveBoard={() => setWildcardDragOverCellId(null)}
            onCellClick={toggleCell}
          />
        </div>

        <aside className="wildcard-dock" style={wildcardStyle}>
          <h2>Comodin</h2>
          <div
            className={`wildcard-preview small draggable ${
              wildcardAppliedToCellId ? "faded" : ""
            }`}
            draggable
            onPointerDown={startWildcardPointerDrag}
            onDragStart={(event) => {
              event.dataTransfer.setData("text/plain", "wildcard");
              event.dataTransfer.effectAllowed = "move";
              startWildcardDrag();
            }}
            onDragEnd={endWildcardDrag}
          >
            {bingo.wildcard.contentType === "image" && bingo.wildcard.imageDataUrl ? (
              <img
                src={bingo.wildcard.imageDataUrl}
                alt={bingo.wildcard.altText || "Casilla comodin"}
              />
            ) : (
              <span>{bingo.wildcard.text || "Comodin"}</span>
            )}
          </div>
          <button
            type="button"
            className="ghost"
            onClick={() => setWildcardAppliedToCellId(null)}
            disabled={!wildcardAppliedToCellId}
          >
            Quitar comodin
          </button>
        </aside>
      </div>

      <section className="play-controls">
        <div className="play-stats">
          <span>
            <CheckCircle2 size={16} />
            {effectiveMarkedCount}/{bingo.cells.length}
          </span>
          <span>
            <Flag size={16} />
            {completedLines.length} lineas
          </span>
          <span className={bingoComplete ? "complete" : ""}>
            Bingo {bingoComplete ? "completo" : "pendiente"}
          </span>
        </div>

        <div className="wildcard-play-inline compact">
          <h2>Comodin</h2>
          <p>
            Arrastralo al tablero para colocarlo en una casilla libre. Puedes moverlo
            tantas veces como quieras.
          </p>
        </div>

        <div className="action-row">
          <button type="button" className="ghost" onClick={onBack}>
            <ArrowLeft size={18} />
            Volver
          </button>
          <button type="button" className="ghost" onClick={resetSession}>
            <RotateCcw size={18} />
            Reiniciar
          </button>
          <button type="button" className="primary" onClick={() => setShowFinalScore(true)}>
            <Flag size={18} />
            Finalizar
          </button>
        </div>
      </section>

      <div className="play-help-text">
        El comodin queda desactivado en su origen al colocarlo y se mantiene guardado en
        la partida para cuando vuelvas a este bingo.
      </div>

      {showFinalScore ? (
        <FinalScoreModal
          bingo={bingo}
          markedCellIds={markedCellIds}
          initialWildcardAppliedToCellId={wildcardAppliedToCellId}
          manualWildcardMode
          onBackToGame={() => setShowFinalScore(false)}
          onSaveResult={handleSaveResult}
        />
      ) : null}

      {wildcardGhostPosition ? (
        <div
          className="wildcard-drag-ghost"
          style={{
            ...wildcardStyle,
            left: wildcardGhostPosition.x,
            top: wildcardGhostPosition.y,
          }}
          aria-hidden="true"
        >
          {bingo.wildcard.contentType === "image" &&
          bingo.wildcard.imageDataUrl ? (
            <img src={bingo.wildcard.imageDataUrl} alt="" />
          ) : (
            <span>{bingo.wildcard.text || "Comodin"}</span>
          )}
        </div>
      ) : null}
    </section>
  );
}
