import { SetPasswordPage } from "./components/SetPasswordPage";
import type { SetPasswordFlow } from "./components/SetPasswordForm/types";

export const dynamic = "force-dynamic";

interface SetPasswordRouteProps {
  searchParams: Promise<{ flow?: string }>;
}

export default async function SetPassword({ searchParams }: SetPasswordRouteProps) {
  const params = await searchParams;
  const initialFlow: SetPasswordFlow = params.flow === "recovery" ? "recovery" : "invite";

  return <SetPasswordPage initialFlow={initialFlow} />;
}
