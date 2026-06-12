import "server-only";

import { getProblemPageCtas } from "@/components/AppProblemPage/utils";
import { loadAuthenticatedLayoutSession } from "@/server/loaders/authenticated-layout";

export async function loadNotFoundPageCtas() {
  const session = await loadAuthenticatedLayoutSession();
  return getProblemPageCtas(session ? { isCustomer: session.isCustomer } : null);
}
