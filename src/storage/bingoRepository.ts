import type { Bingo, BingoSession } from "../domain/bingoTypes";

const DB_NAME = "bingo-builder-db";
const DB_VERSION = 1;
const BINGO_STORE = "bingos";
const SESSION_STORE = "sessions";

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      if (!db.objectStoreNames.contains(BINGO_STORE)) {
        db.createObjectStore(BINGO_STORE, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(SESSION_STORE)) {
        db.createObjectStore(SESSION_STORE, { keyPath: "id" });
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

function runRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

async function storeTransaction(
  storeName: string,
  mode: IDBTransactionMode = "readonly",
) {
  const db = await openDatabase();
  const transaction = db.transaction(storeName, mode);
  return {
    db,
    transaction,
    store: transaction.objectStore(storeName),
  };
}

export async function listBingos(): Promise<Bingo[]> {
  const { db, transaction, store } = await storeTransaction(BINGO_STORE);
  const bingos = await runRequest(store.getAll() as IDBRequest<Bingo[]>);

  transaction.oncomplete = () => db.close();

  return bingos.sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export async function saveBingo(bingo: Bingo): Promise<void> {
  const { db, transaction, store } = await storeTransaction(BINGO_STORE, "readwrite");

  await runRequest(store.put(bingo));
  transaction.oncomplete = () => db.close();
}

export async function deleteBingo(id: string): Promise<void> {
  const { db, transaction, store } = await storeTransaction(BINGO_STORE, "readwrite");

  await runRequest(store.delete(id));
  transaction.oncomplete = () => db.close();
}

export async function saveBingoSession(session: BingoSession): Promise<void> {
  const { db, transaction, store } = await storeTransaction(
    SESSION_STORE,
    "readwrite",
  );

  await runRequest(store.put(session));
  transaction.oncomplete = () => db.close();
}

export async function listBingoSessions(): Promise<BingoSession[]> {
  const { db, transaction, store } = await storeTransaction(SESSION_STORE);
  const sessions = await runRequest(store.getAll() as IDBRequest<BingoSession[]>);

  transaction.oncomplete = () => db.close();

  return sessions.sort(
    (a, b) =>
      new Date(b.endedAt ?? b.startedAt).getTime() -
      new Date(a.endedAt ?? a.startedAt).getTime(),
  );
}
