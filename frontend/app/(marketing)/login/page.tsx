import { LoginPage } from "./components/LoginPage";
import { LOGIN_OAUTH_CALLBACK_ERROR } from "./components/LoginOAuthButtons/constants";

export const dynamic = "force-dynamic";

interface LoginRouteProps {
  searchParams: Promise<{ next?: string; error?: string }>;
}

export default async function Login({ searchParams }: LoginRouteProps) {
  const params = await searchParams;
  const next = typeof params.next === "string" && params.next.startsWith("/") ? params.next : "/dashboard";
  const initialError = params.error === "auth_callback" ? LOGIN_OAUTH_CALLBACK_ERROR : null;

  return <LoginPage next={next} initialError={initialError} />;
}
