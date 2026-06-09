import { ImagePlus, Type } from "lucide-react";
import type { CSSProperties } from "react";
import type { Bingo, BingoCell, WildcardCell } from "../domain/bingoTypes";
import { imageFileToDataUrl } from "../utils/images";

type EditableBingoBoardProps = {
  bingo: Bingo;
  minSize: number;
  maxSize: number;
  onSizeChange: (nextSize: number) => void;
  onChange: (bingo: Bingo) => void;
};

function applyCellPatch(
  bingo: Bingo,
  cellId: string,
  patch: Partial<BingoCell>,
  onChange: (bingo: Bingo) => void,
) {
  onChange({
    ...bingo,
    cells: bingo.cells.map((cell) =>
      cell.id === cellId ? { ...cell, ...patch } : cell,
    ),
  });
}

function applyWildcardPatch(
  bingo: Bingo,
  patch: Partial<WildcardCell>,
  onChange: (bingo: Bingo) => void,
) {
  onChange({
    ...bingo,
    wildcard: { ...bingo.wildcard, ...patch },
  });
}

export function EditableBingoBoard({
  bingo,
  minSize,
  maxSize,
  onSizeChange,
  onChange,
}: EditableBingoBoardProps) {
  const boardStyle = {
    "--bingo-size": bingo.size,
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
      ? `linear-gradient(rgba(255,255,255,.82), rgba(255,255,255,.82)), url(${bingo.appearance.backgroundImageDataUrl})`
      : undefined,
  } as CSSProperties;

  async function onCellFileChange(
    cellId: string,
    file: File | undefined,
  ): Promise<void> {
    if (!file) {
      return;
    }
    const imageDataUrl = await imageFileToDataUrl(file);
    applyCellPatch(
      bingo,
      cellId,
      { contentType: "image", imageDataUrl },
      onChange,
    );
  }

  async function onWildcardFileChange(file: File | undefined): Promise<void> {
    if (!file) {
      return;
    }
    const imageDataUrl = await imageFileToDataUrl(file);
    applyWildcardPatch(bingo, { contentType: "image", imageDataUrl }, onChange);
  }

  return (
    <section className="editable-bingo-stage bingo-board-shell" style={boardStyle}>
      <div className="editable-bingo-top">
        <div className="wildcard-corner">
          <header>
            <strong>Comodin</strong>
            <div className="mini-segmented">
              <button
                type="button"
                className={bingo.wildcard.contentType === "text" ? "active" : ""}
                onClick={() =>
                  applyWildcardPatch(
                    bingo,
                    { contentType: "text", imageDataUrl: undefined },
                    onChange,
                  )
                }
                aria-label="Comodin texto"
                title="Texto"
              >
                <Type size={14} />
              </button>
              <label className="mini-upload" title="Subir imagen">
                <ImagePlus size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    onWildcardFileChange(event.target.files?.[0])
                  }
                />
              </label>
            </div>
          </header>
          {bingo.wildcard.contentType === "image" ? (
            <>
              {bingo.wildcard.imageDataUrl ? (
                <img
                  src={bingo.wildcard.imageDataUrl}
                  alt={bingo.wildcard.altText || "Casilla comodin"}
                />
              ) : (
                <p>Sube una imagen</p>
              )}
              <input
                type="text"
                value={bingo.wildcard.altText ?? ""}
                onChange={(event) =>
                  applyWildcardPatch(
                    bingo,
                    { altText: event.target.value },
                    onChange,
                  )
                }
                placeholder="Texto alternativo"
              />
            </>
          ) : (
            <textarea
              value={bingo.wildcard.text ?? ""}
              onChange={(event) =>
                applyWildcardPatch(
                  bingo,
                  { contentType: "text", text: event.target.value },
                  onChange,
                )
              }
              placeholder="Casilla comodin"
            />
          )}
        </div>

        <label className="title-inline-editor">
          <span>Titulo del bingo</span>
          <input
            type="text"
            value={bingo.title}
            onChange={(event) =>
              onChange({
                ...bingo,
                title: event.target.value,
              })
            }
            placeholder="Escribe el titulo dentro del bingo"
          />
          <div className="title-inline-size">
            <span>Tamano</span>
            <input
              type="number"
              min={minSize}
              max={maxSize}
              value={bingo.size}
              onChange={(event) => onSizeChange(Number(event.target.value))}
            />
          </div>
        </label>
      </div>

      <div
        className="editable-bingo-grid bingo-board"
        data-style={bingo.appearance.cellStyle}
        style={{
          gridTemplateColumns: `repeat(${bingo.size}, minmax(0, 1fr))`,
        }}
      >
        {bingo.cells.map((cell) => (
          <article key={cell.id} className="editable-bingo-cell bingo-cell">
            <div className="editable-cell-tools">
              <button
                type="button"
                className={cell.contentType === "text" ? "active" : ""}
                onClick={() =>
                  applyCellPatch(
                    bingo,
                    cell.id,
                    { contentType: "text", imageDataUrl: undefined },
                    onChange,
                  )
                }
                title="Texto"
                aria-label="Texto"
              >
                <Type size={14} />
              </button>
              <label className="mini-upload" title="Subir imagen">
                <ImagePlus size={14} />
                <input
                  type="file"
                  accept="image/*"
                  onChange={(event) =>
                    onCellFileChange(cell.id, event.target.files?.[0])
                  }
                />
              </label>
            </div>

            {cell.contentType === "image" ? (
              <>
                {cell.imageDataUrl ? (
                  <img
                    src={cell.imageDataUrl}
                    alt={cell.altText || `Casilla ${cell.row + 1}-${cell.col + 1}`}
                  />
                ) : (
                  <p className="cell-image-empty">Imagen</p>
                )}
                <input
                  type="text"
                  value={cell.altText ?? ""}
                  onChange={(event) =>
                    applyCellPatch(
                      bingo,
                      cell.id,
                      { altText: event.target.value },
                      onChange,
                    )
                  }
                  placeholder="Alt"
                />
              </>
            ) : (
              <textarea
                value={cell.text ?? ""}
                onChange={(event) =>
                  applyCellPatch(
                    bingo,
                    cell.id,
                    { contentType: "text", text: event.target.value },
                    onChange,
                  )
                }
                placeholder={`${cell.row + 1}.${cell.col + 1}`}
              />
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
