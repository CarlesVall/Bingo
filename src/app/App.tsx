import { PenLine, PlaySquare } from "lucide-react";
import { useEffect, useState } from "react";
import { CreateBingoPage } from "../pages/CreateBingoPage";
import { MyBingosPage } from "../pages/MyBingosPage";
import { PlayBingoPage } from "../pages/PlayBingoPage";
import { createEmptyBingo, duplicateBingo } from "../domain/bingoFactory";
import {
  createBingoFromSharedTemplate,
  getSharedTemplateFromHash,
} from "../domain/bingoTemplateSharing";
import { getCompletedLines } from "../domain/lineDetection";
import type { AppView } from "./routes";
import type { Bingo, BingoSession, FinalScore } from "../domain/bingoTypes";
import {
  deleteBingo,
  listBingos,
  listBingoSessions,
  saveBingo,
  saveBingoSession,
} from "../storage/bingoRepository";

function copyBingo(bingo: Bingo): Bingo {
  return JSON.parse(JSON.stringify(bingo)) as Bingo;
}

export function App() {
  const [view, setView] = useState<AppView>("create");
  const [bingos, setBingos] = useState<Bingo[]>([]);
  const [draft, setDraft] = useState<Bingo>(() => createEmptyBingo());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeBingo, setActiveBingo] = useState<Bingo | null>(null);
  const [sessions, setSessions] = useState<BingoSession[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refreshBingos() {
    const storedBingos = await listBingos();
    setBingos(storedBingos);
  }

  async function refreshSessions() {
    const storedSessions = await listBingoSessions();
    setSessions(storedSessions);
  }

  useEffect(() => {
    Promise.all([refreshBingos(), refreshSessions()])
      .catch(() => setNotice("No se pudieron cargar los bingos guardados."))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    const sharedTemplate = getSharedTemplateFromHash(window.location.hash);

    if (!sharedTemplate) {
      return;
    }

    setEditingId(null);
    setActiveBingo(null);
    setDraft(createBingoFromSharedTemplate(sharedTemplate));
    setView("create");
    setNotice("Plantilla compartida cargada. Rellena las casillas y el comodin.");
    window.history.replaceState(
      null,
      "",
      `${window.location.pathname}${window.location.search}`,
    );
  }, []);

  function openCreate() {
    setEditingId(null);
    setDraft(createEmptyBingo());
    setView("create");
  }

  function openLibrary() {
    setEditingId(null);
    setActiveBingo(null);
    setView("library");
  }

  async function handleSaveBingo(bingo: Bingo) {
    const now = new Date().toISOString();
    const existing = editingId
      ? bingos.find((candidate) => candidate.id === editingId)
      : undefined;
    const bingoToSave: Bingo = {
      ...bingo,
      id: editingId ?? bingo.id,
      createdAt: existing?.createdAt ?? bingo.createdAt,
      updatedAt: now,
    };

    await saveBingo(bingoToSave);
    await refreshBingos();
    setDraft(createEmptyBingo());
    setEditingId(null);
    setNotice(editingId ? "Bingo actualizado." : "Bingo guardado.");
    setView("library");
  }

  function handleEditBingo(bingo: Bingo) {
    setDraft(copyBingo(bingo));
    setEditingId(bingo.id);
    setNotice(null);
    setView("create");
  }

  async function handleDuplicateBingo(bingo: Bingo) {
    const duplicated = duplicateBingo(bingo);
    await saveBingo(duplicated);
    await refreshBingos();
    setNotice("Bingo duplicado.");
  }

  async function handleDeleteBingo(bingo: Bingo) {
    await deleteBingo(bingo.id);
    await refreshBingos();
    setNotice("Bingo eliminado.");
  }

  function handleUseBingo(bingo: Bingo) {
    setActiveBingo(copyBingo(bingo));
    setNotice(null);
    setView("play");
  }

  async function handleSaveSession(
    bingo: Bingo,
    markedCellIds: string[],
    wildcardAppliedToCellId: string | null,
    finalScore: FinalScore,
  ) {
    const now = new Date().toISOString();
    const session: BingoSession = {
      id: crypto.randomUUID(),
      bingoId: bingo.id,
      startedAt: now,
      endedAt: now,
      markedCellIds,
      completedLineIds: getCompletedLines(
        bingo,
        markedCellIds,
        wildcardAppliedToCellId,
      ).map((line) => line.id),
      wildcardAppliedToCellId: wildcardAppliedToCellId ?? undefined,
      finalScore,
    };

    await saveBingoSession(session);
    await refreshSessions();
    setNotice("Resultado guardado.");
    setActiveBingo(null);
    setView("library");
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-lockup">
          <div className="brand-mark">B</div>
          <div>
            <h1>Creador de bingos</h1>
            <p>Bingos personalizados para eventos en directo.</p>
          </div>
        </div>
        <nav className="top-tabs" aria-label="Navegacion principal">
          <button
            className={view === "create" ? "active" : ""}
            type="button"
            onClick={openCreate}
          >
            <PenLine size={18} />
            Crear bingos
          </button>
          <button
            className={view === "library" ? "active" : ""}
            type="button"
            onClick={openLibrary}
          >
            <PlaySquare size={18} />
            Mis bingos
          </button>
        </nav>
      </header>

      {notice ? (
        <div className="notice" role="status">
          {notice}
        </div>
      ) : null}

      <main>
        {view === "create" ? (
          <CreateBingoPage
            bingo={draft}
            isEditing={Boolean(editingId)}
            onBingoChange={setDraft}
            onCancelEdit={openLibrary}
            onSave={handleSaveBingo}
          />
        ) : null}

        {view === "library" ? (
          <MyBingosPage
            bingos={bingos}
            sessions={sessions}
            isLoading={isLoading}
            onCreate={openCreate}
            onDelete={handleDeleteBingo}
            onDuplicate={handleDuplicateBingo}
            onEdit={handleEditBingo}
            onUse={handleUseBingo}
          />
        ) : null}

        {view === "play" && activeBingo ? (
          <PlayBingoPage
            bingo={activeBingo}
            onBack={openLibrary}
            onSaveSession={handleSaveSession}
          />
        ) : null}
      </main>
    </div>
  );
}
