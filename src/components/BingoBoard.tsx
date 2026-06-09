import type { CSSProperties, PointerEvent } from "react";
import type { Bingo, BingoCell } from "../domain/bingoTypes";
import { getLineDefinitions } from "../domain/lineDetection";

type BingoBoardProps = {
  bingo: Bingo;
  markedCellIds?: string[];
  completedLineIds?: string[];
  flashLineIds?: string[];
  wildcardAppliedToCellId?: string | null;
  wildcardDragOverCellId?: string | null;
  wildcardDropPulseCellId?: string | null;
  interactive?: boolean;
  compact?: boolean;
  onWildcardDragStart?: () => void;
  onWildcardDragEnd?: () => void;
  onWildcardPointerStart?: (event: PointerEvent<HTMLElement>) => void;
  canDropWildcardOnCell?: (cell: BingoCell) => boolean;
  onWildcardDragEnterCell?: (cell: BingoCell) => void;
  onWildcardDropOnCell?: (cell: BingoCell) => void;
  onWildcardDragLeaveBoard?: () => void;
  onCellClick?: (cell: BingoCell) => void;
};

function renderCellContent(cell: BingoCell) {
  if (cell.contentType === "image" && cell.imageDataUrl) {
    return (
      <img
        src={cell.imageDataUrl}
        alt={cell.altText || `Casilla ${cell.row + 1}-${cell.col + 1}`}
      />
    );
  }

  return <span>{cell.text}</span>;
}

export function BingoBoard({
  bingo,
  markedCellIds = [],
  completedLineIds = [],
  flashLineIds = [],
  wildcardAppliedToCellId = null,
  wildcardDragOverCellId = null,
  wildcardDropPulseCellId = null,
  interactive = false,
  compact = false,
  onWildcardDragStart,
  onWildcardDragEnd,
  onWildcardPointerStart,
  canDropWildcardOnCell,
  onWildcardDragEnterCell,
  onWildcardDropOnCell,
  onWildcardDragLeaveBoard,
  onCellClick,
}: BingoBoardProps) {
  const markedSet = new Set(markedCellIds);
  const completedLineSet = new Set(completedLineIds);
  const flashLineSet = new Set(flashLineIds);
  const lines = getLineDefinitions(bingo);
  const boardMaxSize = compact
    ? Math.min(360, 170 + bingo.size * 22)
    : Math.min(940, Math.max(560, 360 + bingo.size * 75));
  const cellFontMax =
    bingo.size <= 3 ? "1.16rem" : bingo.size >= 7 ? "0.82rem" : "1.02rem";

  const boardStyle = {
    "--bingo-size": bingo.size,
    "--board-max-size": `${boardMaxSize}px`,
    "--cell-font-max": cellFontMax,
    "--bingo-bg": bingo.appearance.backgroundColor,
    "--board-bg":
      bingo.appearance.cellColor === "transparent"
        ? "transparent"
        : bingo.appearance.boardColor,
    "--cell-bg": bingo.appearance.cellColor,
    "--cell-text": bingo.appearance.cellTextColor,
    "--cell-border": bingo.appearance.borderColor,
    "--mark-color": bingo.appearance.markColor,
    "--title-color": bingo.appearance.titleColor,
    "--bingo-font": bingo.appearance.fontFamily,
    backgroundImage: bingo.appearance.backgroundImageDataUrl
      ? `linear-gradient(rgba(255,255,255,.76), rgba(255,255,255,.76)), url(${bingo.appearance.backgroundImageDataUrl})`
      : undefined,
  } as CSSProperties;

  return (
    <section
      className={`bingo-board-shell size-${bingo.size} ${compact ? "compact" : ""}`}
      style={boardStyle}
      onDragLeave={(event) => {
        if (event.currentTarget === event.target) {
          onWildcardDragLeaveBoard?.();
        }
      }}
    >
      <h2>{bingo.title || "Bingo sin titulo"}</h2>
      <div
        className="bingo-board"
        data-style={bingo.appearance.cellStyle}
        style={{
          gridTemplateColumns: `repeat(${bingo.size}, minmax(0, 1fr))`,
        }}
      >
        {bingo.cells.map((cell) => {
          const isMarked = markedSet.has(cell.id);
          const isWildcardTarget = wildcardAppliedToCellId === cell.id;
          const cellLineIds = lines
            .filter((line) => line.cellIds.includes(cell.id))
            .map((line) => line.id);
          const isCompletedLine = cellLineIds.some((lineId) =>
            completedLineSet.has(lineId),
          );
          const shouldFlash = cellLineIds.some((lineId) =>
            flashLineSet.has(lineId),
          );
          const className = [
            "bingo-cell",
            cell.contentType === "image" && cell.imageDataUrl ? "has-image" : "",
            isMarked ? "marked" : "",
            isCompletedLine ? "line-complete" : "",
            shouldFlash ? "line-flash" : "",
            isWildcardTarget ? "wildcard-target" : "",
            wildcardDragOverCellId === cell.id ? "wildcard-drop-target" : "",
            wildcardDropPulseCellId === cell.id ? "wildcard-drop-pulse" : "",
          ]
            .filter(Boolean)
            .join(" ");
          const canDropWildcard = canDropWildcardOnCell?.(cell) ?? false;

          if (interactive) {
            return (
              <button
                key={cell.id}
                type="button"
                className={className}
                data-bingo-cell-id={cell.id}
                onClick={() => onCellClick?.(cell)}
                aria-pressed={isMarked}
                onDragOver={(event) => {
                  if (!canDropWildcard) {
                    return;
                  }
                  event.preventDefault();
                  onWildcardDragEnterCell?.(cell);
                }}
                onDrop={(event) => {
                  if (!canDropWildcard) {
                    return;
                  }
                  event.preventDefault();
                  onWildcardDropOnCell?.(cell);
                }}
              >
                {renderCellContent(cell)}
                {isWildcardTarget ? (
                  <div className="wildcard-overlay" aria-hidden="true">
                    {bingo.wildcard.contentType === "image" &&
                    bingo.wildcard.imageDataUrl ? (
                      <img
                        src={bingo.wildcard.imageDataUrl}
                        alt=""
                        className={`wildcard-overlay-image ${
                          interactive ? "draggable" : ""
                        }`}
                        draggable={interactive}
                        onPointerDown={(event) => {
                          if (!interactive) {
                            return;
                          }
                          event.stopPropagation();
                          onWildcardPointerStart?.(event);
                        }}
                        onClick={(event) => event.stopPropagation()}
                        onDragStart={(event) => {
                          if (!interactive) {
                            return;
                          }
                          event.dataTransfer.setData("text/plain", "wildcard");
                          event.dataTransfer.effectAllowed = "move";
                          onWildcardDragStart?.();
                        }}
                        onDragEnd={() => {
                          if (!interactive) {
                            return;
                          }
                          onWildcardDragEnd?.();
                        }}
                      />
                    ) : (
                      <span
                        className={`wildcard-overlay-text ${
                          interactive ? "draggable" : ""
                        }`}
                        draggable={interactive}
                        onPointerDown={(event) => {
                          if (!interactive) {
                            return;
                          }
                          event.stopPropagation();
                          onWildcardPointerStart?.(event);
                        }}
                        onClick={(event) => event.stopPropagation()}
                        onDragStart={(event) => {
                          if (!interactive) {
                            return;
                          }
                          event.dataTransfer.setData("text/plain", "wildcard");
                          event.dataTransfer.effectAllowed = "move";
                          onWildcardDragStart?.();
                        }}
                        onDragEnd={() => {
                          if (!interactive) {
                            return;
                          }
                          onWildcardDragEnd?.();
                        }}
                      >
                        {bingo.wildcard.text || "Comodin"}
                      </span>
                    )}
                  </div>
                ) : null}
              </button>
            );
          }

          return (
            <div key={cell.id} className={className}>
              {renderCellContent(cell)}
              {isWildcardTarget ? (
                <div className="wildcard-overlay" aria-hidden="true">
                  {bingo.wildcard.contentType === "image" &&
                  bingo.wildcard.imageDataUrl ? (
                    <img
                      src={bingo.wildcard.imageDataUrl}
                      alt=""
                      className="wildcard-overlay-image"
                    />
                  ) : (
                    <span className="wildcard-overlay-text">
                      {bingo.wildcard.text || "Comodin"}
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
