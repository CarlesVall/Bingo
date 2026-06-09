import { Image, X } from "lucide-react";
import type { AppearanceConfig } from "../domain/bingoTypes";
import { imageFileToDataUrl } from "../utils/images";

type AppearanceEditorProps = {
  value: AppearanceConfig;
  onChange: (value: AppearanceConfig) => void;
};

const colorFields: Array<{ key: keyof AppearanceConfig; label: string }> = [
  { key: "backgroundColor", label: "Fondo" },
  { key: "cellTextColor", label: "Texto" },
  { key: "borderColor", label: "Borde" },
  { key: "markColor", label: "Marca" },
  { key: "titleColor", label: "Titulo" },
];

export function AppearanceEditor({ value, onChange }: AppearanceEditorProps) {
  const isBoardTransparent = value.boardColor === "transparent";
  const areCellsTransparent = value.cellColor === "transparent";

  async function handleBackgroundImage(file: File | undefined) {
    if (!file) {
      return;
    }

    const backgroundImageDataUrl = await imageFileToDataUrl(file);
    onChange({ ...value, backgroundImageDataUrl });
  }

  return (
    <section className="editor-panel">
      <div className="panel-title-row">
        <h2>Apariencia</h2>
      </div>
      <div className="color-grid">
        {colorFields.map((field) => (
          <label key={field.key}>
            <span>{field.label}</span>
            <input
              type="color"
              value={String(value[field.key])}
              onChange={(event) =>
                onChange({ ...value, [field.key]: event.target.value })
              }
            />
          </label>
        ))}
      </div>

      <div className="board-appearance-row">
        <label>
          <span>Color del tablero</span>
          <input
            type="color"
            value={isBoardTransparent ? "#ffffff" : value.boardColor}
            disabled={isBoardTransparent}
            onChange={(event) =>
              onChange({ ...value, boardColor: event.target.value })
            }
          />
        </label>

        <label className="toggle-row board-transparent-toggle">
          <input
            type="checkbox"
            checked={isBoardTransparent}
            onChange={(event) =>
              onChange({
                ...value,
                boardColor: event.target.checked ? "transparent" : "#ffffff",
              })
            }
          />
          Tablero transparente
        </label>
      </div>

      <div className="board-appearance-row">
        <label>
          <span>Color de casillas</span>
          <input
            type="color"
            value={areCellsTransparent ? "#ffffff" : value.cellColor}
            disabled={areCellsTransparent}
            onChange={(event) =>
              onChange({ ...value, cellColor: event.target.value })
            }
          />
        </label>

        <label className="toggle-row board-transparent-toggle">
          <input
            type="checkbox"
            checked={areCellsTransparent}
            onChange={(event) =>
              onChange({
                ...value,
                cellColor: event.target.checked ? "transparent" : "#ffffff",
              })
            }
          />
          Casillas transparentes
        </label>
      </div>

      <div className="form-grid two">
        <label>
          <span>Tipografia</span>
          <select
            value={value.fontFamily}
            onChange={(event) =>
              onChange({ ...value, fontFamily: event.target.value })
            }
          >
            <option value="Inter, system-ui, sans-serif">Sistema</option>
            <option value="Georgia, serif">Editorial</option>
            <option value="'Trebuchet MS', sans-serif">Redondeada</option>
            <option value="'Courier New', monospace">Mono</option>
          </select>
        </label>
        <label>
          <span>Estilo de casilla</span>
          <select
            value={value.cellStyle}
            onChange={(event) =>
              onChange({
                ...value,
                cellStyle: event.target.value as AppearanceConfig["cellStyle"],
              })
            }
          >
            <option value="classic">Clasico</option>
            <option value="soft">Suave</option>
            <option value="bold">Fuerte</option>
            <option value="minimal">Minimal</option>
          </select>
        </label>
      </div>

      <div className="background-picker">
        <label className="file-pick" htmlFor="background-image">
          <Image size={16} />
          Fondo con imagen
        </label>
        <input
          id="background-image"
          type="file"
          accept="image/*"
          onChange={(event) => handleBackgroundImage(event.target.files?.[0])}
        />
        {value.backgroundImageDataUrl ? (
          <button
            type="button"
            className="icon-text subtle"
            onClick={() => onChange({ ...value, backgroundImageDataUrl: undefined })}
          >
            <X size={16} />
            Quitar fondo
          </button>
        ) : null}
      </div>
    </section>
  );
}
