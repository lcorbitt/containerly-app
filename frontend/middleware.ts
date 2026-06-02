import { NextResponse, type NextRequest } from "next/server";

/** Hub portal is public; access is enforced in-page and via Edge. */
export async function middleware(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: [],
};
