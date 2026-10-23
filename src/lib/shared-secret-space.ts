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
  type StoredSecretPhoto,
  type SharedSyncItem,
} from "./secret-local-data";

const MAX_NETLIFY_UPLOAD_BYTES = 4 * 1024 * 1024;
const MIME_BY_EXTENSION: Record<string, string> = {
  avif: "image/avif",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
  jpeg: "image/jpeg",
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

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

type DecodedPhoto = {
  source: CanvasImageSource;
  width: number;
  height: number;
  close: () => void;
};

async function decodePhoto(blob: Blob): Promise<DecodedPhoto> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(blob);
      return {
        source: bitmap,
        width: bitmap.width,
        height: bitmap.height,
        close: () => bitmap.close(),
      };
    } catch {
      // Safari may not decode HEIC through createImageBitmap; try its native image decoder.
    }
  }

  const url = URL.createObjectURL(blob);
  const image = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Trình duyệt không đọc được định dạng ảnh này."));
      image.src = url;
    });
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  return {
    source: image,
    width: image.naturalWidth,
    height: image.naturalHeight,
    close: () => URL.revokeObjectURL(url),
  };
}

async function preparePhotoForUpload(photo: StoredSecretPhoto): Promise<Blob> {
  if (photo.blob.size <= MAX_NETLIFY_UPLOAD_BYTES) return photo.blob;
  if (photo.type === "image/gif") {
    throw new Error("Ảnh GIF quá lớn để tải lên. Hãy chọn ảnh GIF có dung lượng dưới 4 MB.");
  }

  let decoded: DecodedPhoto;
  try {
    decoded = await decodePhoto(photo.blob);
  } catch (error) {
    throw new Error(
      error instanceof Error
        ? `${error.message} Hãy chọn ảnh có dung lượng dưới 4 MB.`
        : "Không thể đọc ảnh dung lượng lớn trên thiết bị này.",
    );
  }

  try {
    const scale = Math.min(1, 2560 / Math.max(decoded.width, decoded.height));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Không thể xử lý ảnh trên thiết bị này.");

    const outputType =
      photo.type === "image/png" || photo.type === "image/webp"
        ? "image/webp"
        : "image/jpeg";
    const qualities = [0.86, 0.76, 0.66, 0.56];
    for (const reduction of [1, 0.82, 0.66]) {
      canvas.width = Math.max(1, Math.round(decoded.width * scale * reduction));
      canvas.height = Math.max(1, Math.round(decoded.height * scale * reduction));
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.drawImage(decoded.source, 0, 0, canvas.width, canvas.height);
      for (const quality of qualities) {
        const blob = await canvasBlob(canvas, outputType, quality);
        if (blob.size <= MAX_NETLIFY_UPLOAD_BYTES) return blob;
      }
    }
  } finally {
    decoded.close();
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
  const contentType = response.headers.get("content-type") ?? "";
  try {
    result = contentType.includes("application/json")
      ? await response.json()
      : await response.text();
  } catch {
    throw new Error(`Không đọc được phản hồi từ máy chủ (HTTP ${response.status}).`);
  }
  if (!response.ok) {
    const message =
      result && typeof result === "object" && "error" in result && typeof result.error === "string"
        ? result.error
        : typeof result === "string" && result.trim()
          ? `Máy chủ không thể đồng bộ (HTTP ${response.status}): ${result.slice(0, 240)}`
          : `Không thể đồng bộ dữ liệu (HTTP ${response.status}).`;
    throw new Error(message);
  }
  if (typeof result === "string") {
    throw new Error("Máy chủ trả về nội dung không phải JSON.");
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
  const extension = photo.name.split(".").at(-1)?.toLowerCase() ?? "";
  const contentType = photo.type.toLowerCase() || MIME_BY_EXTENSION[extension] || "";
  if (!Object.values(MIME_BY_EXTENSION).includes(contentType)) {
    return Promise.reject(new Error("Định dạng ảnh chưa được hỗ trợ."));
  }
  const normalizedPhoto: StoredSecretPhoto = {
    ...photo,
    type: contentType,
    blob:
      photo.blob.type.toLowerCase() === contentType
        ? photo.blob
        : new Blob([photo.blob], { type: contentType }),
  };
  const form = new FormData();
  form.append("id", photo.id);
  form.append("createdAt", String(photo.createdAt));
  return preparePhotoForUpload(normalizedPhoto).then((blob) => {
    const type = blob.type || contentType;
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
