export type StoredSecretPhoto = {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  createdAt: number;
};

export type SecretDiaryEntry = {
  id: string;
  body: string;
  createdAt: number;
  updatedAt: number;
};

export type DiaryDraft = {
  id: "current";
  body: string;
  entryId: string | null;
  updatedAt: number;
};

export type SharedSyncItem =
  | {
      id: string;
      kind: "photo-upload";
      queuedAt: number;
      attempts: number;
      photo: StoredSecretPhoto;
    }
  | {
      id: string;
      kind: "photo-delete";
      queuedAt: number;
      attempts: number;
      photoId: string;
    }
  | {
      id: string;
      kind: "diary-save";
      queuedAt: number;
      attempts: number;
      entry: SecretDiaryEntry;
    }
  | {
      id: string;
      kind: "diary-delete";
      queuedAt: number;
      attempts: number;
      entryId: string;
    }
  | {
      id: string;
      kind: "diary-draft";
      queuedAt: number;
      attempts: number;
      draft: DiaryDraft | null;
    };

const DATABASE_NAME = "hanh-trinh-secret-space";
const DATABASE_VERSION = 2;
const PHOTO_STORE = "uploaded-photos";
const DIARY_STORE = "diary-entries";
const DRAFT_STORE = "diary-drafts";
const SHARED_OUTBOX_STORE = "shared-sync-outbox";
const SHARED_DIARY_CACHE_STORE = "shared-diary-cache";
const SHARED_DRAFT_CACHE_STORE = "shared-diary-draft-cache";

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (typeof indexedDB === "undefined") {
    return Promise.reject(new Error("Trình duyệt này không hỗ trợ lưu dữ liệu IndexedDB."));
  }

  if (databasePromise) return databasePromise;

  const opening = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(PHOTO_STORE)) {
        database.createObjectStore(PHOTO_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(DIARY_STORE)) {
        database.createObjectStore(DIARY_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(DRAFT_STORE)) {
        database.createObjectStore(DRAFT_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(SHARED_OUTBOX_STORE)) {
        database.createObjectStore(SHARED_OUTBOX_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(SHARED_DIARY_CACHE_STORE)) {
        database.createObjectStore(SHARED_DIARY_CACHE_STORE, { keyPath: "id" });
      }
      if (!database.objectStoreNames.contains(SHARED_DRAFT_CACHE_STORE)) {
        database.createObjectStore(SHARED_DRAFT_CACHE_STORE, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Không thể mở kho lưu cục bộ."));
    request.onblocked = () => reject(new Error("Kho lưu đang bị chặn bởi một tab khác."));
  }).catch((error: unknown) => {
    databasePromise = null;
    throw error;
  });

  databasePromise = opening;
  return opening;
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Không thể đọc dữ liệu cục bộ."));
  });
}

async function storeRequest<T>(
  storeName: string,
  mode: IDBTransactionMode,
  perform: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  const transaction = database.transaction(storeName, mode);
  const request = perform(transaction.objectStore(storeName));

  const transactionComplete = new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Không thể hoàn tất thao tác lưu."));
    transaction.onabort = () => reject(transaction.error ?? new Error("Thao tác lưu đã bị hủy."));
  });

  const [result] = await Promise.all([requestResult(request), transactionComplete]);
  return result;
}

export function getUploadedPhotos(): Promise<StoredSecretPhoto[]> {
  return storeRequest(PHOTO_STORE, "readonly", (store) => store.getAll());
}

export function saveUploadedPhoto(photo: StoredSecretPhoto): Promise<IDBValidKey> {
  return storeRequest(PHOTO_STORE, "readwrite", (store) => store.put(photo));
}

export function deleteUploadedPhoto(id: string): Promise<undefined> {
  return storeRequest(PHOTO_STORE, "readwrite", (store) => store.delete(id));
}

export function getDiaryEntries(): Promise<SecretDiaryEntry[]> {
  return storeRequest(DIARY_STORE, "readonly", (store) => store.getAll());
}

export function saveDiaryEntry(entry: SecretDiaryEntry): Promise<IDBValidKey> {
  return storeRequest(DIARY_STORE, "readwrite", (store) => store.put(entry));
}

export function deleteDiaryEntry(id: string): Promise<undefined> {
  return storeRequest(DIARY_STORE, "readwrite", (store) => store.delete(id));
}

export async function getDiaryDraft(): Promise<DiaryDraft | undefined> {
  return storeRequest(DRAFT_STORE, "readonly", (store) => store.get("current"));
}

export function saveDiaryDraft(draft: DiaryDraft): Promise<IDBValidKey> {
  return storeRequest(DRAFT_STORE, "readwrite", (store) => store.put(draft));
}

export function deleteDiaryDraft(): Promise<undefined> {
  return storeRequest(DRAFT_STORE, "readwrite", (store) => store.delete("current"));
}

export function getSharedSyncItems(): Promise<SharedSyncItem[]> {
  return storeRequest(SHARED_OUTBOX_STORE, "readonly", (store) => store.getAll()).then((items) =>
    items.sort((left, right) => left.queuedAt - right.queuedAt),
  );
}

export function queueSharedSyncItem(item: SharedSyncItem): Promise<IDBValidKey> {
  return storeRequest(SHARED_OUTBOX_STORE, "readwrite", (store) => store.put(item));
}

export function removeSharedSyncItem(id: string): Promise<undefined> {
  return storeRequest(SHARED_OUTBOX_STORE, "readwrite", (store) => store.delete(id));
}

export function getSharedDiaryCache(): Promise<SecretDiaryEntry[]> {
  return storeRequest(SHARED_DIARY_CACHE_STORE, "readonly", (store) => store.getAll());
}

export async function cacheSharedDiaryEntries(entries: SecretDiaryEntry[]): Promise<void> {
  const database = await openDatabase();
  const transaction = database.transaction(SHARED_DIARY_CACHE_STORE, "readwrite");
  const store = transaction.objectStore(SHARED_DIARY_CACHE_STORE);
  store.clear();
  entries.forEach((entry) => store.put(entry));
  await new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(transaction.error ?? new Error("Không thể lưu bản sao nhật ký cục bộ."));
    transaction.onabort = () =>
      reject(transaction.error ?? new Error("Lưu bản sao nhật ký cục bộ đã bị hủy."));
  });
}

export function getSharedDiaryDraftCache(): Promise<DiaryDraft | undefined> {
  return storeRequest(SHARED_DRAFT_CACHE_STORE, "readonly", (store) => store.get("current"));
}

export async function cacheSharedDiaryDraft(draft: DiaryDraft | null): Promise<void> {
  if (draft) {
    await storeRequest(SHARED_DRAFT_CACHE_STORE, "readwrite", (store) => store.put(draft));
  } else {
    await storeRequest(SHARED_DRAFT_CACHE_STORE, "readwrite", (store) => store.delete("current"));
  }
}
