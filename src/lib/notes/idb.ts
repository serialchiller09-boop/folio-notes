import type { MediaRecord, Note } from "./types";

const DB_NAME = "folio-notes";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("notes")) {
        db.createObjectStore("notes", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("media")) {
        db.createObjectStore("media", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("meta")) {
        db.createObjectStore("meta", { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB open failed"));
  });
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error("IndexedDB request failed"));
  });
}

export async function idbGetAllNotes(): Promise<Note[]> {
  const db = await openDb();
  const tx = db.transaction("notes", "readonly");
  const notes = await reqToPromise(tx.objectStore("notes").getAll() as IDBRequest<Note[]>);
  db.close();
  return notes;
}

export async function idbPutNote(note: Note): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("notes", "readwrite");
  await reqToPromise(tx.objectStore("notes").put(note));
  db.close();
}

export async function idbDeleteNote(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("notes", "readwrite");
  await reqToPromise(tx.objectStore("notes").delete(id));
  db.close();
}

export async function idbGetMedia(id: string): Promise<MediaRecord | undefined> {
  const db = await openDb();
  const tx = db.transaction("media", "readonly");
  const rec = await reqToPromise(tx.objectStore("media").get(id) as IDBRequest<MediaRecord | undefined>);
  db.close();
  return rec;
}

export async function idbPutMedia(rec: MediaRecord): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("media", "readwrite");
  await reqToPromise(tx.objectStore("media").put(rec));
  db.close();
}

export async function idbDeleteMedia(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("media", "readwrite");
  await reqToPromise(tx.objectStore("media").delete(id));
  db.close();
}

export async function idbGetMeta<T>(key: string): Promise<T | undefined> {
  const db = await openDb();
  const tx = db.transaction("meta", "readonly");
  const row = await reqToPromise(
    tx.objectStore("meta").get(key) as IDBRequest<{ key: string; value: T } | undefined>,
  );
  db.close();
  return row?.value;
}

export async function idbPutMeta<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  const tx = db.transaction("meta", "readwrite");
  await reqToPromise(tx.objectStore("meta").put({ key, value }));
  db.close();
}
