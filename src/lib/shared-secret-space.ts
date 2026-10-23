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

const MAX_NETLIFY_UPLOAD_BYTES = 4 * 1024 * 1024;

function canvasBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Không thể nén ảnh trên thiết bị này."));
      },
      type,
      quality,
    );
  });
}

async function preparePhotoForUpload(photo: SharedSyncItem & { kind: "photo-upload" }): Promise<Blob> {
  if (photo.photo.blob.size <= MAX_NETLIFY_UPLOAD_BYTES) return photo.photo.blob;
  if (photo.photo.type === "image/gif") {
    throw new Error("Ảnh GIF quá lớn để tải lên. Hãy chọn ảnh GIF có dung lượng dưới 4 MB.");
  }
  if (typeof createImageBitmap !== "function") {
    throw new Error("Ảnh quá lớn để tải lên. Hãy chọn ảnh có dung lượng dưới 4 MB.");
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(photo.photo.blob);
  } catch {
    throw new Error("Không thể xử lý ảnh dung lượng lớn. Hãy chọn ảnh nhỏ hơn 4 MB.");
  }

  try {
    const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể xử lý ảnh trên thiết bị này.");

    const outputType =
      photo.photo.type === "image/png" || photo.photo.type === "image/webp"
        ? "image/webp"
        : "image/jpeg";
    const qualities = [0.86, 0.76, 0.66, 0.56];
    for (const reduction of [1, 0.82, 0.66]) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale * reduction));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale * reduction));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of qualities) {
        const blob = await canvasBlob(canvas, outputType, quality);
        if (blob.size <= MAX_NETLIFY_UPLOAD_BYTES) return blob;
      }
    }
  } finally {
    bitmap.close();
  }

  throw new Error("Không thể nén ảnh xuống dưới 4 MB. Hãy chọn ảnh nhỏ hơn.");
}

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
  const item = {
    id: `photo-${photo.id}`,
    kind: "photo-upload" as const,
    queuedAt: photo.createdAt,
    attempts: 0,
    photo,
  };
  return preparePhotoForUpload(item).then((blob) => {
    const type = blob.type || photo.type;
    const extension = type === "image/webp" ? ".webp" : type === "image/jpeg" ? ".jpg" : "";
    const name = blob !== photo.blob && extension
      ? `${photo.name.replace(/\.[^.]+$/, "")}${extension}`
      : photo.name;
    form.append("file", blob, name);
    return request<SecretCloudPhoto>("/api/secret-space/shared/photos", {
      method: "POST",
      body: form,
    });
  });
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
