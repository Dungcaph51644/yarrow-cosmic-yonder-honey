import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import {
  createSharedSpaceInvite,
  createSharedSpaceSession,
  deleteSharedDiaryEntry,
  deleteSharedPhoto,
  getSharedDiary,
  getSharedSpaceId,
  listSharedPhotos,
  revokeSharedSpaceInvites,
  revokeSharedSpaceSession,
  saveSharedDiaryDraft,
  saveSharedDiaryEntry,
  SecretSpaceError,
  uploadSharedPhoto,
  verifySharedSpaceBootstrapKey,
} from "@/lib/supabase.server";
import type { SecretDiaryEntry, SharedSecretDiaryDraft } from "@/lib/secret-space-types";

const COOKIE_LIFETIME_SECONDS = 60 * 60 * 24 * 180;
const recordIdSchema = z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/);
const diaryEntrySchema = z.object({
  id: recordIdSchema,
  body: z.string().trim().min(1).max(100_000),
  createdAt: z.number().finite().positive(),
  updatedAt: z.number().finite().positive(),
});
const diaryDraftSchema = z
  .object({
    body: z.string().max(100_000),
    entryId: recordIdSchema.nullable(),
    updatedAt: z.number().finite().positive(),
  })
  .nullable();
const accessPayloadSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("bootstrap"),
    bootstrapKey: z.string().min(32).max(256),
  }),
  z.object({ action: z.literal("connect"), inviteToken: z.string().min(40).max(100) }),
  z.object({ action: z.literal("share") }),
  z.object({ action: z.literal("disconnect") }),
]);
const diaryPayloadSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save-entry"), entry: diaryEntrySchema }),
  z.object({ action: z.literal("delete-entry"), entryId: recordIdSchema }),
  z.object({ action: z.literal("save-draft"), draft: diaryDraftSchema }),
]);

async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new SecretSpaceError("Nội dung yêu cầu không phải JSON hợp lệ.", 400);
  }
}

function validated<T>(schema: z.ZodType<T>, value: unknown, message: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new SecretSpaceError(message, 400);
  return result.data;
}

function cookieName(request: Request): string {
  return new URL(request.url).protocol === "https:"
    ? "__Host-secret-space-session"
    : "secret-space-session";
}

function readCookie(request: Request): string | undefined {
  const name = cookieName(request);
  const cookieHeader = request.headers.get("cookie") ?? "";
  for (const part of cookieHeader.split(";")) {
    const [key, ...value] = part.trim().split("=");
    if (key === name) return value.join("=");
  }
  return undefined;
}

function sessionCookie(request: Request, token: string, maxAge = COOKIE_LIFETIME_SECONDS): string {
  const secure = new URL(request.url).protocol === "https:" ? "; Secure" : "";
  return `${cookieName(request)}=${encodeURIComponent(token)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${secure}`;
}

function json(data: unknown, init?: ResponseInit): Response {
  return Response.json(data, {
    ...init,
    headers: { "Cache-Control": "no-store", ...init?.headers },
  });
}

function errorResponse(error: unknown): Response {
  const status =
    error instanceof SecretSpaceError
      ? error.status
      : error instanceof Error && "status" in error && typeof error.status === "number"
        ? error.status
        : 500;
  if (status >= 500) console.error("[secret-space] Shared-space request failed:", error);
  return json(
    {
      error:
        error instanceof SecretSpaceError
          ? error.message
          : status === 401
            ? "Thiết bị chưa được kết nối với không gian chia sẻ."
            : "Không thể hoàn thành yêu cầu đồng bộ lúc này.",
    },
    { status },
  );
}

async function accessHandler(request: Request): Promise<Response> {
  if (request.method === "GET") {
    try {
      await getSharedSpaceId(readCookie(request));
      return json({ connected: true });
    } catch (error) {
      if (error instanceof SecretSpaceError && error.status === 401) {
        return json({ connected: false });
      }
      throw error;
    }
  }

  assertSameSiteRequest();
  const payload = validated(
    accessPayloadSchema,
    await readJson(request),
    "Thao tác kết nối không hợp lệ.",
  );
  if (payload.action === "bootstrap") {
    verifySharedSpaceBootstrapKey(payload.bootstrapKey);
    const inviteToken = await createSharedSpaceInvite();
    const session = await createSharedSpaceSession(inviteToken);
    return json(
      { connected: true, inviteToken },
      { headers: { "Set-Cookie": sessionCookie(request, session.token) } },
    );
  }
  if (payload.action === "connect") {
    const session = await createSharedSpaceSession(payload.inviteToken);
    return json(
      { connected: true },
      { headers: { "Set-Cookie": sessionCookie(request, session.token) } },
    );
  }
  if (payload.action === "share") {
    const spaceId = await getSharedSpaceId(readCookie(request));
    const inviteToken = await createSharedSpaceInvite();
    await revokeSharedSpaceInvites(spaceId, inviteToken);
    return json({ inviteToken });
  }
  if (payload.action === "disconnect") {
    await revokeSharedSpaceSession(readCookie(request));
    return json(
      { connected: false },
      { headers: { "Set-Cookie": sessionCookie(request, "", 0) } },
    );
  }
  throw new SecretSpaceError("Thao tác không được hỗ trợ.", 400);
}

async function photosHandler(request: Request): Promise<Response> {
  const spaceId = await getSharedSpaceId(readCookie(request));
  if (request.method === "GET") return json(await listSharedPhotos(spaceId));

  assertSameSiteRequest();
  if (request.method === "POST") {
    let form: FormData;
    try {
      form = await request.formData();
    } catch {
      throw new SecretSpaceError("Không đọc được dữ liệu ảnh tải lên.", 400);
    }
    const file = form.get("file");
    const id = form.get("id");
    const createdAt = Number(form.get("createdAt"));
    if (!(file instanceof File) || typeof id !== "string") {
      throw new SecretSpaceError("Thiếu ảnh hoặc mã ảnh.", 400);
    }
    return json(await uploadSharedPhoto(spaceId, id, file, createdAt), { status: 201 });
  }
  if (request.method === "DELETE") {
    const payload = validated(
      z.object({ id: recordIdSchema }),
      await readJson(request),
      "Mã ảnh không hợp lệ.",
    );
    await deleteSharedPhoto(spaceId, payload.id);
    return json({ deleted: true });
  }
  return json({ error: "Phương thức không được hỗ trợ." }, { status: 405 });
}

async function diaryHandler(request: Request): Promise<Response> {
  const spaceId = await getSharedSpaceId(readCookie(request));
  if (request.method === "GET") return json(await getSharedDiary(spaceId));

  assertSameSiteRequest();
  const payload = validated(
    diaryPayloadSchema,
    await readJson(request),
    "Thao tác nhật ký không hợp lệ.",
  );
  if (payload.action === "save-entry") {
    return json(await saveSharedDiaryEntry(spaceId, payload.entry as SecretDiaryEntry));
  }
  if (payload.action === "delete-entry") {
    await deleteSharedDiaryEntry(spaceId, payload.entryId);
    return json({ deleted: true });
  }
  if (payload.action === "save-draft") {
    await saveSharedDiaryDraft(spaceId, payload.draft as SharedSecretDiaryDraft);
    return json({ saved: true });
  }
  throw new SecretSpaceError("Thao tác nhật ký không được hỗ trợ.", 400);
}

async function handle(request: Request): Promise<Response> {
  try {
    const endpoint = new URL(request.url).pathname.split("/").at(-1);
    if (endpoint === "access") return await accessHandler(request);
    if (endpoint === "photos") return await photosHandler(request);
    if (endpoint === "diary") return await diaryHandler(request);
    return json({ error: "Không tìm thấy endpoint đồng bộ." }, { status: 404 });
  } catch (error) {
    return errorResponse(error);
  }
}

export const Route = createFileRoute("/api/secret-space/shared/$")({
  server: {
    handlers: {
      GET: ({ request }) => handle(request),
      POST: ({ request }) => handle(request),
      DELETE: ({ request }) => handle(request),
    },
  },
});
