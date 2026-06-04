import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareSupabase } from "@/lib/supabase/middleware";

/**
 * Portal routes enforce auth in-page and via Edge; marketing routes are unauthenticated.
 *
 * The one exception handled here: the operator customer-portal preview route lives under
 * `(authenticated)` (so operators get the operator shell), which would bounce unauthenticated
 * visitors to `/login`. Instead, send them to the public hub gate (email allowlist card).
 */
const CUSTOMER_PORTAL_PATH_RE = /^\/shipments\/([^/]+)\/customer-portal\/?$/;

export async function middleware(request: NextRequest) {
  const match = request.nextUrl.pathname.match(CUSTOMER_PORTAL_PATH_RE);
  if (!match) return NextResponse.next();

  const { supabase, response } = await createMiddlewareSupabase(request);
  if (!supabase) return response;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) return response;

  const hubUrl = request.nextUrl.clone();
  hubUrl.pathname = `/shipments/hub/${match[1]}`;
  hubUrl.search = "";
  return NextResponse.redirect(hubUrl);
}

export const config = {
  matcher: ["/shipments/:shipmentId/customer-portal"],
};
