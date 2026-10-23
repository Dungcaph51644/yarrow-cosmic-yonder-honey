import type {
  SecretCloudPhoto,
  SecretDiaryEntry,
  SharedSecretDiaryData,
  SharedSecretDiaryDraft,
} from "./secret-space-types";
import {
  getSharedSyncItems,
  queueSharedSyncItem,
  removeSharedSyncItem,
  type SharedSyncItem,
} from "./secret-local-data";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { ...init, cache: "no-store" });
  } catch {
    throw new Error("Mất kết nối mạng. Dữ liệu vẫn được giữ trên thiết bị để thử lại.");
  }
  let result: unknown;
  try {
    result = await response.json();
  } catch {
    throw new Error("Máy chủ trả về phản hồi không hợp lệ.");
  }
  if (!response.ok) {
    const message =
      result && typeof result === "object" && "error" in result && typeof result.error === "string"
        ? result.error
        : "Không thể đồng bộ dữ liệu lúc này.";
    throw new Error(message);
  }
  return result as T;
}

export function getSharedSpaceConnection(): Promise<{ connected: boolean }> {
  return request("/api/secret-space/shared/access");
}

export function bootstrapSharedSpace(bootstrapKey: string): Promise<{
  connected: boolean;
  inviteToken: string;
}> {
  return request("/api/secret-space/shared/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "bootstrap", bootstrapKey }),
  });
}

export function connectSharedSpace(inviteToken: string): Promise<{ connected: boolean }> {
  return request("/api/secret-space/shared/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "connect", inviteToken }),
  });
}

export function createSharedSpaceInvite(): Promise<{ inviteToken: string }> {
  return request("/api/secret-space/shared/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "share" }),
  });
}

export function disconnectSharedSpace(): Promise<{ connected: boolean }> {
  return request("/api/secret-space/shared/access", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "disconnect" }),
  });
}

export function listSharedPhotos(): Promise<SecretCloudPhoto[]> {
  return request("/api/secret-space/shared/photos");
}

export function uploadSharedPhoto(photo: {
  id: string;
  name: string;
  type: string;
  blob: Blob;
  createdAt: number;
}): Promise<SecretCloudPhoto> {
  const form = new FormData();
  form.append("id", photo.id);
  form.append("createdAt", String(photo.createdAt));
  form.append("file", photo.blob, photo.name);
  return request("/api/secret-space/shared/photos", { method: "POST", body: form });
}

export function deleteSharedPhoto(id: string): Promise<{ deleted: boolean }> {
  return request("/api/secret-space/shared/photos", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
}

export function getSharedDiary(): Promise<SharedSecretDiaryData> {
  return request("/api/secret-space/shared/diary");
}

export function saveSharedDiaryEntry(entry: SecretDiaryEntry): Promise<SecretDiaryEntry> {
  return request("/api/secret-space/shared/diary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save-entry", entry }),
  });
}

export function deleteSharedDiaryEntry(entryId: string): Promise<{ deleted: boolean }> {
  return request("/api/secret-space/shared/diary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "delete-entry", entryId }),
  });
}

export function saveSharedDiaryDraft(
  draft: SharedSecretDiaryDraft,
): Promise<{ saved: boolean }> {
  return request("/api/secret-space/shared/diary", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "save-draft", draft }),
  });
}

export async function syncPendingSharedChanges(): Promise<number> {
  if (typeof navigator !== "undefined" && !navigator.onLine) return 0;
  const items = await getSharedSyncItems();
  let synced = 0;
  for (const item of items) {
    try {
      await syncItem(item);
      await removeSharedSyncItem(item.id);
      synced += 1;
    } catch (error) {
      await queueSharedSyncItem({ ...item, attempts: item.attempts + 1 } as SharedSyncItem);
      throw error;
    }
  }
  return synced;
}

async function syncItem(item: SharedSyncItem): Promise<void> {
  switch (item.kind) {
    case "photo-upload":
      await uploadSharedPhoto(item.photo);
      return;
    case "photo-delete":
      await deleteSharedPhoto(item.photoId);
      return;
    case "diary-save":
      await saveSharedDiaryEntry(item.entry);
      return;
    case "diary-delete":
      await deleteSharedDiaryEntry(item.entryId);
      return;
    case "diary-draft":
      await saveSharedDiaryDraft(item.draft);
      return;
  }
}
