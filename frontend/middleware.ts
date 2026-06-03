import { NextResponse, type NextRequest } from "next/server";

/** Portal routes enforce auth in-page and via Edge; marketing routes are unauthenticated. */
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
