import { type NextRequest, NextResponse } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createMiddlewareSupabase(request);

  if (!supabase) {
    return response;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith("/dashboard") && !user) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/login";
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
