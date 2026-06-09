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

const fontOptions = [
  { label: "Sistema", value: "Inter, system-ui, sans-serif" },
  { label: "Rubik", value: "'Rubik', system-ui, sans-serif" },
  { label: "Nunito", value: "'Nunito', system-ui, sans-serif" },
  { label: "Baloo 2", value: "'Baloo 2', system-ui, sans-serif" },
  { label: "Atkinson", value: "'Atkinson Hyperlegible', system-ui, sans-serif" },
  { label: "Fraunces", value: "'Fraunces', Georgia, serif" },
  { label: "Editorial", value: "Georgia, serif" },
  { label: "Redondeada", value: "'Trebuchet MS', sans-serif" },
  { label: "Mono", value: "'IBM Plex Mono', 'Courier New', monospace" },
  { label: "Rotulador", value: "'Permanent Marker', cursive" },
];

const cellStyleOptions: Array<{
  value: AppearanceConfig["cellStyle"];
  label: string;
}> = [
  { value: "classic", label: "Clasico" },
  { value: "soft", label: "Suave" },
  { value: "bold", label: "Fuerte" },
  { value: "minimal", label: "Minimal" },
  { value: "rounded", label: "Redondeado" },
  { value: "ticket", label: "Ticket" },
  { value: "neon", label: "Neon" },
  { value: "paper", label: "Papel" },
  { value: "stamp", label: "Sello" },
];

export function AppearanceEditor({ value, onChange }: AppearanceEditorProps) {
  const areCellsTransparent = value.cellColor === "transparent";
  const isBoardTransparent = value.boardColor === "transparent" || areCellsTransparent;

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
      <div className="appearance-color-grid">
        {colorFields.map((field) => (
          <label className="appearance-color-control" key={field.key}>
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
        <div className="appearance-color-control">
          <span>Tablero</span>
          <input
            aria-label="Color del tablero"
            type="color"
            value={isBoardTransparent ? "#ffffff" : value.boardColor}
            disabled={isBoardTransparent}
            onChange={(event) =>
              onChange({ ...value, boardColor: event.target.value })
            }
          />
          <label className="compact-check">
            <input
              type="checkbox"
              checked={isBoardTransparent}
              disabled={areCellsTransparent}
              onChange={(event) =>
                onChange({
                  ...value,
                  boardColor: event.target.checked ? "transparent" : "#ffffff",
                })
              }
            />
            Transparente
          </label>
        </div>
        <div className="appearance-color-control">
          <span>Casillas</span>
          <input
            aria-label="Color de casillas"
            type="color"
            value={areCellsTransparent ? "#ffffff" : value.cellColor}
            disabled={areCellsTransparent}
            onChange={(event) =>
              onChange({ ...value, cellColor: event.target.value })
            }
          />
          <label className="compact-check">
            <input
              type="checkbox"
              checked={areCellsTransparent}
              onChange={(event) =>
                onChange({
                  ...value,
                  cellColor: event.target.checked ? "transparent" : "#ffffff",
                  boardColor: event.target.checked ? "transparent" : "#ffffff",
                })
              }
            />
            Transparente
          </label>
        </div>
      </div>

      <div className="appearance-select-grid">
        <label>
          <span>Tipografia</span>
          <select
            value={value.fontFamily}
            onChange={(event) =>
              onChange({ ...value, fontFamily: event.target.value })
            }
          >
            {fontOptions.map((font) => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
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
            {cellStyleOptions.map((style) => (
              <option key={style.value} value={style.value}>
                {style.label}
              </option>
            ))}
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
