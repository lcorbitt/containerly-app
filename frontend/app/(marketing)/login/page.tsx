import { LoginPage } from "./components/LoginPage";
import type { LoginFormMode } from "./components/LoginForm/types";

export const dynamic = "force-dynamic";

interface LoginRouteProps {
  searchParams: Promise<{ mode?: string; next?: string }>;
}

export default async function Login({ searchParams }: LoginRouteProps) {
  const params = await searchParams;
  const initialMode: LoginFormMode = params.mode === "signup" ? "signup" : "signin";
  const next = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/dashboard";

  return <LoginPage initialMode={initialMode} next={next} />;
}
