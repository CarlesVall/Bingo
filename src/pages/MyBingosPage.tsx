import {
  CalendarClock,
  Check,
  Copy,
  Grid2X2,
  Link,
  Pencil,
  Play,
  Plus,
  Search,
  Share2,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { BingoBoard } from "../components/BingoBoard";
import { createShareHash } from "../domain/bingoTemplateSharing";
import type { Bingo, BingoSession } from "../domain/bingoTypes";

type MyBingosPageProps = {
  bingos: Bingo[];
  sessions: BingoSession[];
  isLoading: boolean;
  onCreate: () => void;
  onUse: (bingo: Bingo) => void;
  onEdit: (bingo: Bingo) => void;
  onDuplicate: (bingo: Bingo) => Promise<void>;
  onDelete: (bingo: Bingo) => Promise<void>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatShortDate(value: string) {
  return new Intl.DateTimeFormat("es", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
}

function getTotalScore(session: BingoSession) {
  return Object.values(session.finalScore?.byScoreType ?? {}).reduce(
    (total, value) => total + value,
    0,
  );
}

function createShareUrl(bingo: Bingo) {
  return `${window.location.href.split("#")[0]}${createShareHash(bingo)}`;
}

export function MyBingosPage({
  bingos,
  sessions,
  isLoading,
  onCreate,
  onUse,
  onEdit,
  onDuplicate,
  onDelete,
}: MyBingosPageProps) {
  const [query, setQuery] = useState("");
  const [shareDialog, setShareDialog] = useState<{
    bingo: Bingo;
    url: string;
    copied: boolean;
  } | null>(null);
  const filteredBingos = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return bingos;
    }

    return bingos.filter((bingo) =>
      bingo.title.toLowerCase().includes(normalizedQuery),
    );
  }, [bingos, query]);
  const sessionsByBingo = useMemo(() => {
    return sessions.reduce<Record<string, BingoSession[]>>((grouped, session) => {
      grouped[session.bingoId] = grouped[session.bingoId] ?? [];
      grouped[session.bingoId].push(session);
      return grouped;
    }, {});
  }, [sessions]);

  async function confirmDelete(bingo: Bingo) {
    if (window.confirm(`Eliminar "${bingo.title}"?`)) {
      await onDelete(bingo);
    }
  }

  function openShareDialog(bingo: Bingo) {
    setShareDialog({
      bingo,
      url: createShareUrl(bingo),
      copied: false,
    });
  }

  async function copyShareUrl() {
    if (!shareDialog) {
      return;
    }

    if (!navigator.clipboard) {
      window.prompt("Copia este enlace", shareDialog.url);
      return;
    }

    try {
      await navigator.clipboard.writeText(shareDialog.url);
      setShareDialog({ ...shareDialog, copied: true });
    } catch {
      window.prompt("Copia este enlace", shareDialog.url);
    }
  }

  return (
    <section className="library-page">
      <div className="workspace-header">
        <div>
          <h2>Mis bingos</h2>
          <p>{bingos.length} bingos guardados</p>
        </div>
        <button type="button" className="primary" onClick={onCreate}>
          <Plus size={18} />
          Crear
        </button>
      </div>

      <div className="library-toolbar">
        <Search size={18} />
        <input
          type="search"
          placeholder="Buscar por titulo"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {isLoading ? <p className="empty-state">Cargando bingos...</p> : null}

      {!isLoading && filteredBingos.length === 0 ? (
        <div className="empty-state">
          <p>No hay bingos que mostrar.</p>
          <button type="button" className="primary" onClick={onCreate}>
            <Plus size={18} />
            Crear bingo
          </button>
        </div>
      ) : null}

      <div className="bingo-library-grid">
        {filteredBingos.map((bingo) => {
          const bingoSessions = sessionsByBingo[bingo.id] ?? [];
          const latestSession = bingoSessions[0];

          return (
            <article className="bingo-card" key={bingo.id}>
              <div className="bingo-card-preview">
                <BingoBoard bingo={bingo} compact />
                <div className="bingo-card-preview-badges" aria-hidden="true">
                  <span>
                    <Grid2X2 size={14} />
                    {bingo.size} x {bingo.size}
                  </span>
                  <span>
                    <Trophy size={14} />
                    {bingoSessions.length}
                  </span>
                </div>
              </div>

              <div className="bingo-card-body">
                <div className="bingo-card-meta">
                  <h3>{bingo.title}</h3>
                  <p>
                    <CalendarClock size={14} />
                    Actualizado {formatDate(bingo.updatedAt)}
                  </p>
                </div>

                <div className="bingo-card-result">
                  {latestSession ? (
                    <>
                      <span>Ultimo resultado</span>
                      <strong>{getTotalScore(latestSession)} pts</strong>
                      <small>
                        {formatShortDate(
                          latestSession.endedAt ?? latestSession.startedAt,
                        )}
                        {" - "}
                        {latestSession.markedCellIds.length}/{bingo.cells.length}
                        {" - "}
                        {latestSession.completedLineIds.length} lineas
                        {latestSession.wildcardAppliedToCellId ? " - comodin" : ""}
                      </small>
                    </>
                  ) : (
                    <>
                      <span>Sin resultados guardados</span>
                      <strong>{bingo.scoring.scoreTypes.length} marcador</strong>
                      <small>Listo para iniciar partida</small>
                    </>
                  )}
                </div>
              </div>

              <div className="card-actions">
                <button type="button" className="primary" onClick={() => onUse(bingo)}>
                  <Play size={17} />
                  Usar
                </button>
                <button
                  type="button"
                  className="icon-action"
                  onClick={() => onEdit(bingo)}
                  aria-label={`Editar ${bingo.title}`}
                  title="Editar"
                >
                  <Pencil size={17} />
                </button>
                <button
                  type="button"
                  className="icon-action"
                  onClick={() => onDuplicate(bingo)}
                  aria-label={`Duplicar ${bingo.title}`}
                  title="Duplicar"
                >
                  <Copy size={17} />
                </button>
                <button
                  type="button"
                  className="icon-action"
                  onClick={() => openShareDialog(bingo)}
                  aria-label={`Compartir plantilla de ${bingo.title}`}
                  title="Compartir plantilla"
                >
                  <Share2 size={17} />
                </button>
                <button
                  type="button"
                  className="icon-action danger"
                  onClick={() => confirmDelete(bingo)}
                  aria-label={`Eliminar ${bingo.title}`}
                  title="Eliminar"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {shareDialog ? (
        <div className="modal-backdrop" role="presentation">
          <section className="share-modal" role="dialog" aria-modal="true">
            <header className="modal-header">
              <div>
                <h2>Compartir plantilla</h2>
                <p>{shareDialog.bingo.title || "Bingo sin titulo"}</p>
              </div>
              <button
                type="button"
                onClick={() => setShareDialog(null)}
                title="Cerrar"
                aria-label="Cerrar"
              >
                <X size={18} />
              </button>
            </header>

            <div className="share-content">
              <div className="share-note">
                <Link size={18} />
                <p>
                  El enlace copia tamano, puntuacion y apariencia. Las casillas y el
                  comodin se rellenan desde cero al abrirlo.
                </p>
              </div>

              <label>
                <span>Enlace para compartir</span>
                <input type="text" value={shareDialog.url} readOnly />
              </label>

              <button type="button" className="primary wide" onClick={copyShareUrl}>
                {shareDialog.copied ? <Check size={18} /> : <Copy size={18} />}
                {shareDialog.copied ? "Copiado" : "Copiar enlace"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
