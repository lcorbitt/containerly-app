import { requireAuthUserId } from "@services/auth";
import { uploadProfileImageAndSetPath } from "@services/profile/profile.service";
import { createUserClient } from "@services/db";
import { edgeErrorMessage, isLikelyUnauthorizedFromCatch, jsonResponse } from "@services/utils";

export async function handle(req: Request): Promise<Response> {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, { status: 405 });
  }

  try {
    const userClient = createUserClient(req);
    const auth = await requireAuthUserId(userClient);
    if (!auth.ok) return auth.response;

    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return jsonResponse({ error: "Invalid form data" }, { status: 400 });
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return jsonResponse({ error: "file required" }, { status: 400 });
    }

    const previousRaw = formData.get("previousPath");
    const previousPath =
      typeof previousRaw === "string" && previousRaw.trim() !== "" ? previousRaw.trim() : null;

    const path = await uploadProfileImageAndSetPath(userClient, {
      userId: auth.userId,
      file,
      previousPath,
    });
    return jsonResponse({ path });
  } catch (e) {
    const message = edgeErrorMessage(e);
    if (isLikelyUnauthorizedFromCatch(message)) {
      return jsonResponse({ error: "Unauthorized" }, { status: 401 });
    }
    return jsonResponse({ error: message }, { status: 400 });
  }
}
