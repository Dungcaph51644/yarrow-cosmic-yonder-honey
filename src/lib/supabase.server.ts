import type {
  SecretCloudPhoto,
  SecretDiaryData,
  SecretDiaryEntry,
  SecretDiaryDraft,
  SharedSecretDiaryData,
  SharedSecretDiaryDraft,
} from "./secret-space-types";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const STORAGE_BUCKET = "secret-space";
const SIGNED_URL_LIFETIME_SECONDS = 60 * 60;
const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const SHARED_SPACE_ID = "shared";
const SHARED_SESSION_LIFETIME_SECONDS = 60 * 60 * 24 * 180;
const IMAGE_EXTENSIONS: Record<string, string> = {
  "image/avif": "avif",
  "image/gif": "gif",
  "image/heic": "heic",
  "image/heif": "heif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

type SecretPhotoRow = {
  id: string;
  file_name: string;
  content_type: string;
  storage_path: string;
  created_at: string;
};

type DiaryEntryRow = {
  id: string;
  body: string;
  created_at: string;
  updated_at: string;
};

type DiaryDraftRow = {
  body: string;
  entry_id: string | null;
  updated_at: string;
};

type SupabaseConfig = {
  projectUrl: string;
  serviceRoleKey: string;
};

type SharedPhotoRow = {
  id: string;
  file_name: string;
  content_type: string;
  storage_path: string;
  created_at: string;
};

type SharedSession = {
  token: string;
  spaceId: string;
  expiresAt: string;
};

export class SecretSpaceError extends Error {
  constructor(
    message: string,
    readonly status = 500,
  ) {
    super(message);
    this.name = "SecretSpaceError";
  }
}

function hashSecret(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function validRecordId(id: string): boolean {
  return /^[a-zA-Z0-9_-]{1,128}$/.test(id);
}

function getConfig(): SupabaseConfig {
  const projectUrl = process.env.SUPABASE_URL?.trim().replace(/\/+$/, "");
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (!projectUrl || !serviceRoleKey) {
    throw new SecretSpaceError(
      "Supabase chưa được cấu hình. Hãy thêm SUPABASE_URL và SUPABASE_SERVICE_ROLE_KEY vào biến môi trường phía server của Netlify.",
      503,
    );
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(projectUrl);
  } catch {
    throw new SecretSpaceError("SUPABASE_URL không phải địa chỉ hợp lệ.", 503);
  }
  if (parsedUrl.protocol !== "https:" && parsedUrl.hostname !== "localhost") {
    throw new SecretSpaceError("SUPABASE_URL phải sử dụng HTTPS.", 503);
  }

  return { projectUrl, serviceRoleKey };
}

async function supabaseRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const { projectUrl, serviceRoleKey } = getConfig();
  let response: Response;
  try {
    response = await fetch(`${projectUrl}${path}`, {
      ...init,
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        ...(init.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...init.headers,
      },
    });
  } catch (error) {
    throw new SecretSpaceError(
      error instanceof Error
        ? `Không thể kết nối Supabase: ${error.message}`
        : "Không thể kết nối Supabase.",
      503,
    );
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new SecretSpaceError(
      `Supabase trả về lỗi ${response.status}${detail ? `: ${detail}` : ""}`,
      response.status >= 400 && response.status < 500 ? response.status : 502,
    );
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

function restPath(table: string, params: URLSearchParams) {
  return `/rest/v1/${table}?${params.toString()}`;
}

function ownerFilter(userId: string) {
  return new URLSearchParams({ user_id: `eq.${userId}` });
}

function toDiaryEntry(row: DiaryEntryRow): SecretDiaryEntry {
  return {
    id: row.id,
    body: row.body,
    createdAt: Date.parse(row.created_at),
    updatedAt: Date.parse(row.updated_at),
  };
}

function storageObjectPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function signStoragePath(path: string) {
  const { projectUrl } = getConfig();
  const result = await supabaseRequest<{ signedURL: string }>(
    `/storage/v1/object/sign/${encodeURIComponent(STORAGE_BUCKET)}/${storageObjectPath(path)}`,
    {
      method: "POST",
      body: JSON.stringify({ expiresIn: SIGNED_URL_LIFETIME_SECONDS }),
    },
  );
  const storageUrl = `${projectUrl}/storage/v1`;
  return result.signedURL.startsWith("http")
    ? result.signedURL
    : `${storageUrl}${result.signedURL.startsWith("/") ? result.signedURL : `/${result.signedURL}`}`;
}

function toCloudPhoto(row: SecretPhotoRow, url: string): SecretCloudPhoto {
  return {
    id: row.id,
    name: row.file_name,
    contentType: row.content_type,
    url,
    createdAt: Date.parse(row.created_at),
  };
}

function toSharedCloudPhoto(row: SharedPhotoRow, url: string): SecretCloudPhoto {
  return {
    id: row.id,
    name: row.file_name,
    contentType: row.content_type,
    url,
    createdAt: Date.parse(row.created_at),
  };
}

export function verifySharedSpaceBootstrapKey(providedKey: string): void {
  const expectedKey = process.env.SECRET_SPACE_BOOTSTRAP_KEY?.trim();
  if (!expectedKey || expectedKey.length < 32) {
    throw new SecretSpaceError(
      "Không gian chia sẻ chưa được khởi tạo. Hãy cấu hình SECRET_SPACE_BOOTSTRAP_KEY (ít nhất 32 ký tự) trong biến môi trường server.",
      503,
    );
  }
  const expectedHash = Buffer.from(hashSecret(expectedKey), "hex");
  const providedHash = Buffer.from(hashSecret(providedKey), "hex");
  if (!timingSafeEqual(expectedHash, providedHash)) {
    throw new SecretSpaceError("Mã khởi tạo không chính xác.", 401);
  }
}

export async function createSharedSpaceInvite(): Promise<string> {
  const token = randomBytes(32).toString("base64url");
  await supabaseRequest(restPath("shared_secret_invites", new URLSearchParams()), {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ token_hash: hashSecret(token), space_id: SHARED_SPACE_ID }),
  });
  return token;
}

export async function revokeSharedSpaceInvites(
  spaceId: string,
  keepToken?: string,
): Promise<void> {
  const params = new URLSearchParams({
    space_id: `eq.${spaceId}`,
    revoked_at: "is.null",
  });
  if (keepToken) params.set("token_hash", `neq.${hashSecret(keepToken)}`);
  await supabaseRequest(restPath("shared_secret_invites", params), {
    method: "PATCH",
    body: JSON.stringify({ revoked_at: new Date().toISOString() }),
  });
}

export async function createSharedSpaceSession(inviteToken: string): Promise<SharedSession> {
  if (inviteToken.length < 40 || inviteToken.length > 100) {
    throw new SecretSpaceError("Liên kết chia sẻ không hợp lệ hoặc đã hết hạn.", 401);
  }
  const inviteParams = new URLSearchParams({
    select: "space_id",
    token_hash: `eq.${hashSecret(inviteToken)}`,
    revoked_at: "is.null",
    limit: "1",
  });
  const [invite] = await supabaseRequest<Array<{ space_id: string }>>(
    restPath("shared_secret_invites", inviteParams),
  );
  if (!invite) {
    throw new SecretSpaceError("Liên kết chia sẻ không hợp lệ hoặc đã bị thu hồi.", 401);
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SHARED_SESSION_LIFETIME_SECONDS * 1000).toISOString();
  await supabaseRequest(restPath("shared_secret_devices", new URLSearchParams()), {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      token_hash: hashSecret(token),
      space_id: invite.space_id,
      expires_at: expiresAt,
    }),
  });
  return { token, spaceId: invite.space_id, expiresAt };
}

export async function getSharedSpaceId(sessionToken: string | undefined): Promise<string> {
  if (!sessionToken || sessionToken.length < 40 || sessionToken.length > 100) {
    throw new SecretSpaceError("Hãy kết nối thiết bị bằng liên kết chia sẻ.", 401);
  }
  const params = new URLSearchParams({
    select: "space_id",
    token_hash: `eq.${hashSecret(sessionToken)}`,
    expires_at: `gt.${new Date().toISOString()}`,
    limit: "1",
  });
  const [session] = await supabaseRequest<Array<{ space_id: string }>>(
    restPath("shared_secret_devices", params),
  );
  if (!session) throw new SecretSpaceError("Phiên chia sẻ đã hết hạn. Hãy mở lại liên kết.", 401);
  return session.space_id;
}

export async function revokeSharedSpaceSession(sessionToken: string | undefined): Promise<void> {
  if (!sessionToken) return;
  const params = new URLSearchParams({ token_hash: `eq.${hashSecret(sessionToken)}` });
  await supabaseRequest(restPath("shared_secret_devices", params), { method: "DELETE" });
}

export async function listSharedPhotos(spaceId: string): Promise<SecretCloudPhoto[]> {
  const params = new URLSearchParams({
    select: "id,file_name,content_type,storage_path,created_at",
    space_id: `eq.${spaceId}`,
    order: "created_at.desc",
  });
  const rows = await supabaseRequest<SharedPhotoRow[]>(
    restPath("shared_secret_photos", params),
  );
  return Promise.all(
    rows.map(async (row) => toSharedCloudPhoto(row, await signStoragePath(row.storage_path))),
  );
}

export async function uploadSharedPhoto(
  spaceId: string,
  id: string,
  file: File,
  createdAt: number,
): Promise<SecretCloudPhoto> {
  if (!validRecordId(id)) throw new SecretSpaceError("Mã ảnh không hợp lệ.", 400);
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) {
    throw new SecretSpaceError("Ảnh phải có dung lượng từ 1 byte đến 15 MB.", 400);
  }
  const contentType = file.type.toLowerCase();
  const extension = IMAGE_EXTENSIONS[contentType];
  if (!extension) {
    throw new SecretSpaceError(
      "Định dạng ảnh chưa được hỗ trợ. Hãy dùng JPEG, PNG, WebP, GIF, AVIF hoặc HEIC.",
      400,
    );
  }
  if (!Number.isFinite(createdAt) || createdAt <= 0) {
    throw new SecretSpaceError("Thời gian tạo ảnh không hợp lệ.", 400);
  }

  const storagePath = `${spaceId}/${id}.${extension}`;
  const { projectUrl, serviceRoleKey } = getConfig();
  const uploadResponse = await fetch(
    `${projectUrl}/storage/v1/object/${encodeURIComponent(STORAGE_BUCKET)}/${storageObjectPath(storagePath)}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": contentType,
        "x-upsert": "true",
        "cache-control": "3600",
      },
      body: file,
    },
  );
  if (!uploadResponse.ok) {
    const detail = (await uploadResponse.text()).slice(0, 500);
    throw new SecretSpaceError(
      `Không thể tải ảnh lên Supabase (${uploadResponse.status})${detail ? `: ${detail}` : ""}`,
      uploadResponse.status >= 400 && uploadResponse.status < 500 ? uploadResponse.status : 502,
    );
  }

  const params = new URLSearchParams({
    on_conflict: "space_id,id",
    select: "id,file_name,content_type,storage_path,created_at",
  });
  const [saved] = await supabaseRequest<SharedPhotoRow[]>(
    restPath("shared_secret_photos", params),
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        space_id: spaceId,
        id,
        file_name: file.name.slice(0, 255),
        content_type: contentType,
        storage_path: storagePath,
        created_at: new Date(createdAt).toISOString(),
      }),
    },
  );
  if (!saved) throw new SecretSpaceError("Không thể lưu thông tin ảnh.", 502);
  return toSharedCloudPhoto(saved, await signStoragePath(saved.storage_path));
}

export async function deleteSharedPhoto(spaceId: string, id: string): Promise<void> {
  if (!validRecordId(id)) throw new SecretSpaceError("Mã ảnh không hợp lệ.", 400);
  const params = new URLSearchParams({
    select: "storage_path",
    space_id: `eq.${spaceId}`,
    id: `eq.${id}`,
    limit: "1",
  });
  const [photo] = await supabaseRequest<Array<{ storage_path: string }>>(
    restPath("shared_secret_photos", params),
  );
  if (!photo) return;

  const { projectUrl, serviceRoleKey } = getConfig();
  const response = await fetch(
    `${projectUrl}/storage/v1/object/${encodeURIComponent(STORAGE_BUCKET)}/${storageObjectPath(photo.storage_path)}`,
    {
      method: "DELETE",
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    },
  );
  if (!response.ok && response.status !== 404) {
    const detail = (await response.text()).slice(0, 500);
    throw new SecretSpaceError(
      `Không thể xóa ảnh khỏi Supabase (${response.status})${detail ? `: ${detail}` : ""}`,
      502,
    );
  }
  const deleteParams = new URLSearchParams({ space_id: `eq.${spaceId}`, id: `eq.${id}` });
  await supabaseRequest(restPath("shared_secret_photos", deleteParams), { method: "DELETE" });
}

export async function getSharedDiary(spaceId: string): Promise<SharedSecretDiaryData> {
  const entryParams = new URLSearchParams({
    select: "id,body,created_at,updated_at",
    space_id: `eq.${spaceId}`,
    order: "updated_at.desc",
  });
  const draftParams = new URLSearchParams({
    select: "body,entry_id,updated_at",
    space_id: `eq.${spaceId}`,
    limit: "1",
  });
  const [entryRows, draftRows] = await Promise.all([
    supabaseRequest<DiaryEntryRow[]>(restPath("shared_secret_diary_entries", entryParams)),
    supabaseRequest<DiaryDraftRow[]>(restPath("shared_secret_diary_drafts", draftParams)),
  ]);
  const draftRow = draftRows[0];
  const draft: SharedSecretDiaryDraft = draftRow
    ? {
        body: draftRow.body,
        entryId: draftRow.entry_id,
        updatedAt: Date.parse(draftRow.updated_at),
      }
    : null;
  return { entries: entryRows.map(toDiaryEntry), draft };
}

export async function saveSharedDiaryEntry(
  spaceId: string,
  entry: SecretDiaryEntry,
): Promise<SecretDiaryEntry> {
  if (!validRecordId(entry.id)) throw new SecretSpaceError("Mã nhật ký không hợp lệ.", 400);
  if (!entry.body.trim() || entry.body.length > 100_000) {
    throw new SecretSpaceError("Nội dung nhật ký cần từ 1 đến 100.000 ký tự.", 400);
  }
  if (
    !Number.isFinite(entry.createdAt) ||
    !Number.isFinite(entry.updatedAt) ||
    entry.createdAt <= 0 ||
    entry.updatedAt <= 0
  ) {
    throw new SecretSpaceError("Thời gian nhật ký không hợp lệ.", 400);
  }
  const params = new URLSearchParams({
    on_conflict: "space_id,id",
    select: "id,body,created_at,updated_at",
  });
  const [row] = await supabaseRequest<DiaryEntryRow[]>(
    restPath("shared_secret_diary_entries", params),
    {
      method: "POST",
      headers: { Prefer: "resolution=merge-duplicates,return=representation" },
      body: JSON.stringify({
        space_id: spaceId,
        id: entry.id,
        body: entry.body,
        created_at: new Date(entry.createdAt).toISOString(),
        updated_at: new Date(entry.updatedAt).toISOString(),
      }),
    },
  );
  if (!row) throw new SecretSpaceError("Không thể lưu mục nhật ký.", 502);
  return toDiaryEntry(row);
}

export async function deleteSharedDiaryEntry(spaceId: string, id: string): Promise<void> {
  if (!validRecordId(id)) throw new SecretSpaceError("Mã nhật ký không hợp lệ.", 400);
  const params = new URLSearchParams({ space_id: `eq.${spaceId}`, id: `eq.${id}` });
  await supabaseRequest(restPath("shared_secret_diary_entries", params), { method: "DELETE" });
}

export async function saveSharedDiaryDraft(
  spaceId: string,
  draft: SharedSecretDiaryDraft,
): Promise<void> {
  const params = new URLSearchParams({ space_id: `eq.${spaceId}` });
  if (draft === null) {
    await supabaseRequest(restPath("shared_secret_diary_drafts", params), { method: "DELETE" });
    return;
  }
  if (draft.body.length > 100_000) {
    throw new SecretSpaceError("Bản nháp vượt quá 100.000 ký tự.", 400);
  }
  if (draft.entryId && !validRecordId(draft.entryId)) {
    throw new SecretSpaceError("Mã nhật ký không hợp lệ.", 400);
  }
  const upsertParams = new URLSearchParams({ on_conflict: "space_id" });
  await supabaseRequest(restPath("shared_secret_diary_drafts", upsertParams), {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      space_id: spaceId,
      body: draft.body,
      entry_id: draft.entryId,
      updated_at: new Date(draft.updatedAt).toISOString(),
    }),
  });
}

export async function listPhotosForUser(userId: string): Promise<SecretCloudPhoto[]> {
  const params = ownerFilter(userId);
  params.set("select", "id,file_name,content_type,storage_path,created_at");
  params.set("order", "created_at.desc");
  const rows = await supabaseRequest<SecretPhotoRow[]>(restPath("secret_photos", params));
  return Promise.all(
    rows.map(async (row) => toCloudPhoto(row, await signStoragePath(row.storage_path))),
  );
}

export async function uploadPhotoForUser(userId: string, file: File): Promise<SecretCloudPhoto> {
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES) {
    throw new SecretSpaceError("Ảnh phải có dung lượng từ 1 byte đến 15 MB.", 400);
  }
  const contentType = file.type.toLowerCase();
  const extension = IMAGE_EXTENSIONS[contentType];
  if (!extension) {
    throw new SecretSpaceError(
      "Định dạng ảnh chưa được hỗ trợ. Hãy dùng JPEG, PNG, WebP, GIF, AVIF hoặc HEIC.",
      400,
    );
  }

  const id = crypto.randomUUID();
  const storagePath = `${userId}/${id}.${extension}`;
  const { projectUrl, serviceRoleKey } = getConfig();
  const uploadResponse = await fetch(
    `${projectUrl}/storage/v1/object/${encodeURIComponent(STORAGE_BUCKET)}/${storageObjectPath(storagePath)}`,
    {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": contentType,
        "x-upsert": "false",
        "cache-control": "3600",
      },
      body: file,
    },
  );
  if (!uploadResponse.ok) {
    const detail = (await uploadResponse.text()).slice(0, 500);
    throw new SecretSpaceError(
      `Không thể tải ảnh lên Supabase (${uploadResponse.status})${detail ? `: ${detail}` : ""}`,
      uploadResponse.status >= 400 && uploadResponse.status < 500 ? uploadResponse.status : 502,
    );
  }

  const row: SecretPhotoRow = {
    id,
    file_name: file.name.slice(0, 255),
    content_type: contentType,
    storage_path: storagePath,
    created_at: new Date().toISOString(),
  };

  try {
    const params = new URLSearchParams({
      select: "id,file_name,content_type,storage_path,created_at",
    });
    const [saved] = await supabaseRequest<SecretPhotoRow[]>(restPath("secret_photos", params), {
      method: "POST",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ ...row, user_id: userId }),
    });
    return toCloudPhoto(saved, await signStoragePath(saved.storage_path));
  } catch (error) {
    const rollback = await fetch(
      `${projectUrl}/storage/v1/object/${encodeURIComponent(STORAGE_BUCKET)}/${storageObjectPath(storagePath)}`,
      {
        method: "DELETE",
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      },
    );
    if (!rollback.ok) {
      console.error(
        "[secret-space] Upload metadata failed and the stored object could not be rolled back.",
      );
    }
    throw error;
  }
}

export async function deletePhotoForUser(userId: string, id: string): Promise<void> {
  const selectParams = ownerFilter(userId);
  selectParams.set("id", `eq.${id}`);
  selectParams.set("select", "storage_path");
  const [photo] = await supabaseRequest<Array<Pick<SecretPhotoRow, "storage_path">>>(
    restPath("secret_photos", selectParams),
  );
  if (!photo) throw new SecretSpaceError("Không tìm thấy ảnh trong tài khoản này.", 404);

  const { projectUrl, serviceRoleKey } = getConfig();
  const response = await fetch(
    `${projectUrl}/storage/v1/object/${encodeURIComponent(STORAGE_BUCKET)}/${storageObjectPath(photo.storage_path)}`,
    {
      method: "DELETE",
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    },
  );
  if (!response.ok && response.status !== 404) {
    const detail = (await response.text()).slice(0, 500);
    throw new SecretSpaceError(
      `Không thể xóa ảnh khỏi Supabase (${response.status})${detail ? `: ${detail}` : ""}`,
      502,
    );
  }

  const deleteParams = ownerFilter(userId);
  deleteParams.set("id", `eq.${id}`);
  await supabaseRequest<unknown>(restPath("secret_photos", deleteParams), {
    method: "DELETE",
  });
}

export async function getDiaryForUser(userId: string): Promise<SecretDiaryData> {
  const entryParams = ownerFilter(userId);
  entryParams.set("select", "id,body,created_at,updated_at");
  entryParams.set("order", "updated_at.desc");
  const draftParams = ownerFilter(userId);
  draftParams.set("select", "body,entry_id,updated_at");
  draftParams.set("limit", "1");
  const [entryRows, draftRows] = await Promise.all([
    supabaseRequest<DiaryEntryRow[]>(restPath("secret_diary_entries", entryParams)),
    supabaseRequest<DiaryDraftRow[]>(restPath("secret_diary_drafts", draftParams)),
  ]);
  const draftRow = draftRows[0];
  const draft: SecretDiaryDraft = draftRow
    ? {
        body: draftRow.body,
        entryId: draftRow.entry_id,
        updatedAt: Date.parse(draftRow.updated_at),
      }
    : null;
  return { entries: entryRows.map(toDiaryEntry), draft };
}

export async function saveDiaryDraftForUser(
  userId: string,
  draft: { body: string; entryId: string | null },
): Promise<SecretDiaryDraft> {
  const params = new URLSearchParams({ on_conflict: "user_id" });
  await supabaseRequest(restPath("secret_diary_drafts", params), {
    method: "POST",
    headers: { Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({
      user_id: userId,
      body: draft.body,
      entry_id: draft.entryId,
      updated_at: new Date().toISOString(),
    }),
  });
  return { ...draft, updatedAt: Date.now() };
}

export async function saveDiaryEntryForUser(
  userId: string,
  input: { id: string | null; body: string },
): Promise<SecretDiaryEntry> {
  const now = new Date().toISOString();
  if (input.id) {
    const params = ownerFilter(userId);
    params.set("id", `eq.${input.id}`);
    params.set("select", "id,body,created_at,updated_at");
    const [row] = await supabaseRequest<DiaryEntryRow[]>(restPath("secret_diary_entries", params), {
      method: "PATCH",
      headers: { Prefer: "return=representation" },
      body: JSON.stringify({ body: input.body, updated_at: now }),
    });
    if (!row) throw new SecretSpaceError("Không tìm thấy mục nhật ký trong tài khoản này.", 404);
    return toDiaryEntry(row);
  }

  const params = new URLSearchParams({ select: "id,body,created_at,updated_at" });
  const [row] = await supabaseRequest<DiaryEntryRow[]>(restPath("secret_diary_entries", params), {
    method: "POST",
    headers: { Prefer: "return=representation" },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      user_id: userId,
      body: input.body,
      created_at: now,
      updated_at: now,
    }),
  });
  if (!row) throw new SecretSpaceError("Không thể tạo mục nhật ký.", 502);
  return toDiaryEntry(row);
}

export async function deleteDiaryEntryForUser(userId: string, id: string): Promise<void> {
  const params = ownerFilter(userId);
  params.set("id", `eq.${id}`);
  params.set("select", "id");
  const rows = await supabaseRequest<Array<{ id: string }>>(
    restPath("secret_diary_entries", params),
    { method: "DELETE", headers: { Prefer: "return=representation" } },
  );
  if (rows.length === 0)
    throw new SecretSpaceError("Không tìm thấy mục nhật ký trong tài khoản này.", 404);
}

export async function clearDiaryDraftForUser(userId: string): Promise<void> {
  const params = ownerFilter(userId);
  await supabaseRequest(restPath("secret_diary_drafts", params), { method: "DELETE" });
}
