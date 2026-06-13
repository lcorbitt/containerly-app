import { type NextRequest } from "next/server";
import {
  createMiddlewareSupabase,
  refreshMiddlewareAuthSession,
} from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createMiddlewareSupabase(request);

  if (supabase) {
    await refreshMiddlewareAuthSession(supabase);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
