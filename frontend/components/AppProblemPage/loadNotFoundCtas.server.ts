import "server-only";

import { getProblemPageCtas } from "@/components/AppProblemPage/utils";
import { loadAuthenticatedLayoutSession } from "@/services/authenticated-layout.server";

export async function loadNotFoundPageCtas() {
  const session = await loadAuthenticatedLayoutSession();
  return getProblemPageCtas(session ? { isCustomer: session.isCustomer } : null);
}
