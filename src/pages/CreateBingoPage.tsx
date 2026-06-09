import { RotateCcw, Save, X } from "lucide-react";
import { useState } from "react";
import { AppearanceEditor } from "../components/AppearanceEditor";
import { EditableBingoBoard } from "../components/EditableBingoBoard";
import { ScoreTypeEditor } from "../components/ScoreTypeEditor";
import { createEmptyBingo, resizeBingo } from "../domain/bingoFactory";
import {
  MAX_BINGO_SIZE,
  MIN_BINGO_SIZE,
  type Bingo,
} from "../domain/bingoTypes";
import { validateBingo } from "../domain/validation";

type CreateBingoPageProps = {
  bingo: Bingo;
  isEditing: boolean;
  onBingoChange: (bingo: Bingo) => void;
  onCancelEdit: () => void;
  onSave: (bingo: Bingo) => Promise<void>;
};

export function CreateBingoPage({
  bingo,
  isEditing,
  onBingoChange,
  onCancelEdit,
  onSave,
}: CreateBingoPageProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  function hasContentOutsideNextSize(nextSize: number) {
    return bingo.cells.some((cell) => {
      const outside = cell.row >= nextSize || cell.col >= nextSize;
      const hasContent =
        cell.contentType === "image"
          ? Boolean(cell.imageDataUrl)
          : Boolean(cell.text?.trim());
      return outside && hasContent;
    });
  }

  function handleSizeChange(rawSize: number) {
    const nextSize = Math.min(MAX_BINGO_SIZE, Math.max(MIN_BINGO_SIZE, rawSize));

    if (
      nextSize < bingo.size &&
      hasContentOutsideNextSize(nextSize) &&
      !window.confirm("Reducir el tamano eliminara casillas con contenido.")
    ) {
      return;
    }

    onBingoChange(resizeBingo(bingo, nextSize));
  }

  async function handleSave() {
    const result = validateBingo(bingo);
    setMessages([...result.errors, ...result.warnings]);

    if (!result.isValid) {
      return;
    }

    setIsSaving(true);
    try {
      await onSave(bingo);
    } finally {
      setIsSaving(false);
    }
  }

  function resetDraft() {
    if (window.confirm("Limpiar el formulario actual?")) {
      onBingoChange(createEmptyBingo());
      setMessages([]);
    }
  }

  return (
    <div className="create-page">
      <section className="workspace-band">
        <div className="workspace-header">
          <div>
            <h2>{isEditing ? "Editar bingo" : "Crear bingo"}</h2>
            <p>Prepara el tablero, la puntuacion y su aspecto visual.</p>
          </div>
          <div className="action-row">
            {isEditing ? (
              <button type="button" className="ghost" onClick={onCancelEdit}>
                <X size={18} />
                Cancelar
              </button>
            ) : null}
            <button type="button" className="ghost" onClick={resetDraft}>
              <RotateCcw size={18} />
              Limpiar
            </button>
            <button
              type="button"
              className="primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              <Save size={18} />
              {isSaving ? "Guardando" : "Guardar"}
            </button>
          </div>
        </div>

        {messages.length > 0 ? (
          <div className="validation-box" role="alert">
            {messages.map((message) => (
              <p key={message}>{message}</p>
            ))}
          </div>
        ) : null}

        <div className="create-focus-layout">
          <EditableBingoBoard
            bingo={bingo}
            minSize={MIN_BINGO_SIZE}
            maxSize={MAX_BINGO_SIZE}
            onSizeChange={handleSizeChange}
            onChange={onBingoChange}
          />

          <div className="create-config-grid">
            <ScoreTypeEditor
              value={bingo.scoring}
              onChange={(scoring) => onBingoChange({ ...bingo, scoring })}
            />

            <AppearanceEditor
              value={bingo.appearance}
              onChange={(appearance) => onBingoChange({ ...bingo, appearance })}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
