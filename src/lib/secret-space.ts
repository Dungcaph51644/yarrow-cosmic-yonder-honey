import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { authMiddleware } from "@/lib/auth/middleware";

const entryIdSchema = z.string().uuid();

export const listSecretPhotos = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { listPhotosForUser } = await import("./supabase.server");
    return listPhotosForUser(context.userId);
  });

export const deleteSecretPhoto = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: entryIdSchema }))
  .handler(async ({ context, data }) => {
    const { deletePhotoForUser } = await import("./supabase.server");
    await deletePhotoForUser(context.userId, data.id);
    return { deleted: true };
  });

export const getSecretDiary = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { getDiaryForUser } = await import("./supabase.server");
    return getDiaryForUser(context.userId);
  });

export const saveSecretDiaryDraft = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      body: z.string().max(100_000),
      entryId: entryIdSchema.nullable(),
    }),
  )
  .handler(async ({ context, data }) => {
    const { saveDiaryDraftForUser } = await import("./supabase.server");
    return saveDiaryDraftForUser(context.userId, data);
  });

export const saveSecretDiaryEntry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(
    z.object({
      id: entryIdSchema.nullable(),
      body: z.string().trim().min(1).max(100_000),
    }),
  )
  .handler(async ({ context, data }) => {
    const { saveDiaryEntryForUser } = await import("./supabase.server");
    return saveDiaryEntryForUser(context.userId, data);
  });

export const deleteSecretDiaryEntry = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator(z.object({ id: entryIdSchema }))
  .handler(async ({ context, data }) => {
    const { deleteDiaryEntryForUser } = await import("./supabase.server");
    await deleteDiaryEntryForUser(context.userId, data.id);
    return { deleted: true };
  });

export const clearSecretDiaryDraft = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    const { clearDiaryDraftForUser } = await import("./supabase.server");
    await clearDiaryDraftForUser(context.userId);
    return { deleted: true };
  });
