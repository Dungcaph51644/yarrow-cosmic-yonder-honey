import { createFileRoute } from "@tanstack/react-router";
import { assertSameSiteRequest } from "@/lib/auth/isolation.server";
import { requireUserId } from "@/lib/auth/verify.server";
import { SecretSpaceError, uploadPhotoForUser } from "@/lib/supabase.server";

export const Route = createFileRoute("/api/secret-space/photos")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          assertSameSiteRequest();
          const authorization = request.headers.get("authorization");
          const bearerToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];
          const userId = await requireUserId(bearerToken);
          const form = await request.formData();
          const file = form.get("file");
          if (!(file instanceof File)) {
            throw new SecretSpaceError("Chưa chọn ảnh để tải lên.", 400);
          }
          const photo = await uploadPhotoForUser(userId, file);
          return Response.json(photo, { status: 201 });
        } catch (error) {
          const status =
            error instanceof SecretSpaceError
              ? error.status
              : error instanceof Error && "status" in error && typeof error.status === "number"
                ? error.status
                : 500;
          if (status >= 500) {
            console.error("[secret-space] Photo upload failed:", error);
          }
          const message =
            error instanceof SecretSpaceError
              ? error.message
              : status === 401
                ? "Vui lòng đăng nhập lại để tải ảnh."
                : "Không thể tải ảnh lên lúc này.";
          return Response.json({ error: message }, { status });
        }
      },
    },
  },
});
