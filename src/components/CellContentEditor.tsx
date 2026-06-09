import { Image, Type, X } from "lucide-react";
import type { BingoCell, WildcardCell } from "../domain/bingoTypes";
import { imageFileToDataUrl } from "../utils/images";

type EditableCell = BingoCell | WildcardCell;

type CellContentEditorProps<T extends EditableCell> = {
  label: string;
  value: T;
  onChange: (value: T) => void;
};

export function CellContentEditor<T extends EditableCell>({
  label,
  value,
  onChange,
}: CellContentEditorProps<T>) {
  const inputId = `${label.replace(/\s+/g, "-").toLowerCase()}-image`;

  async function handleImage(file: File | undefined) {
    if (!file) {
      return;
    }

    const imageDataUrl = await imageFileToDataUrl(file);
    onChange({
      ...value,
      contentType: "image",
      imageDataUrl,
      text: value.text,
    });
  }

  return (
    <div className="cell-editor">
      <div className="cell-editor-head">
        <span>{label}</span>
        <div className="segmented">
          <button
            type="button"
            className={value.contentType === "text" ? "active" : ""}
            onClick={() => onChange({ ...value, contentType: "text" })}
            title="Texto"
            aria-label="Usar texto"
          >
            <Type size={16} />
          </button>
          <button
            type="button"
            className={value.contentType === "image" ? "active" : ""}
            onClick={() => onChange({ ...value, contentType: "image" })}
            title="Imagen"
            aria-label="Usar imagen"
          >
            <Image size={16} />
          </button>
        </div>
      </div>

      {value.contentType === "text" ? (
        <textarea
          value={value.text ?? ""}
          maxLength={180}
          onChange={(event) =>
            onChange({
              ...value,
              contentType: "text",
              text: event.target.value,
            })
          }
        />
      ) : (
        <div className="image-editor">
          {value.imageDataUrl ? (
            <div className="image-preview">
              <img src={value.imageDataUrl} alt={value.altText || label} />
              <button
                type="button"
                onClick={() =>
                  onChange({
                    ...value,
                    imageDataUrl: undefined,
                    contentType: "image",
                  })
                }
                title="Quitar imagen"
                aria-label="Quitar imagen"
              >
                <X size={16} />
              </button>
            </div>
          ) : null}
          <label className="file-pick" htmlFor={inputId}>
            <Image size={16} />
            Subir imagen
          </label>
          <input
            id={inputId}
            type="file"
            accept="image/*"
            onChange={(event) => handleImage(event.target.files?.[0])}
          />
          <input
            type="text"
            value={value.altText ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                altText: event.target.value,
              })
            }
            placeholder="Texto alternativo"
          />
        </div>
      )}
    </div>
  );
}
