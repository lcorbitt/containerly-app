import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import { edgeFunctionFetch } from "@/lib/supabase/edge-functions";
import { createClient } from "@/lib/supabase/client";
import { authCallbackUrl, SET_PASSWORD_PATH } from "@/utils/auth-redirect";

export async function getBrowserAuthUserId(): Promise<string | null> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function getBrowserAuthSession() {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  return data.session ?? null;
}

/**
 * Subscribe to browser auth-state changes (sign-in / sign-out / token refresh). Lets long-lived
 * UI (e.g. the portal top nav in the layout) react to an in-page sign-in without a full reload.
 * Returns an unsubscribe function.
 */
export function subscribeToAuthState(
  callback: (signedIn: boolean, session: Session | null) => void,
): () => void {
  const supabase = createClient();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(Boolean(session), session ?? null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signInWithPassword(email: string, password: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  return { error: error ? new Error(error.message) : null };
}

export async function signUpWithEmail(input: {
  email: string;
  password: string;
  fullName?: string;
}): Promise<{
  error: Error | null;
  session: { access_token: string } | null;
}> {
  const supabase = createClient();
  const trimmedName = input.fullName?.trim() ?? "";
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: trimmedName !== "" ? { data: { full_name: trimmedName } } : undefined,
  });
  if (error) return { error: new Error(error.message), session: null };
  return { error: null, session: data.session };
}

export async function verifyEmailOtp(
  tokenHash: string,
  type: "magiclink" | "email" | "signup" | "recovery" | "invite" | "email_change" = "magiclink",
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
  return { error: error ? new Error(error.message) : null };
}

export async function signOutBrowser(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function resetPasswordForEmail(email: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const redirectTo = authCallbackUrl(`${SET_PASSWORD_PATH}?flow=recovery`);
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: redirectTo ?? undefined,
  });
  return { error: error ? new Error(error.message) : null };
}

export async function updatePassword(newPassword: string): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error ? new Error(error.message) : null };
}

/** Verifies the current password by re-signing in (works with Secure password change enabled). */
export async function reauthenticateWithPassword(
  currentPassword: string,
): Promise<{ error: Error | null }> {
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  const email = data.user?.email?.trim();
  if (!email) return { error: new Error("Not signed in") };
  const { error } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
  return { error: error ? new Error(error.message) : null };
}

export async function notifyPasswordChanged(): Promise<{ error: Error | null }> {
  const result = await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.auth.notifyPasswordChanged, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
  });
  if ("error" in result) {
    return { error: new Error(result.error) };
  }
  if (!result.res.ok) {
    let message = "Could not send password notification";
    try {
      const parsed = JSON.parse(result.text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      /* ignore */
    }
    return { error: new Error(message) };
  }
  return { error: null };
}

/** One-shot listener for PASSWORD_RECOVERY (forgot-password reset flow). */
export function listenForPasswordRecovery(
  callback: (isRecovery: boolean) => void,
): () => void {
  const supabase = createClient();
  const { data } = supabase.auth.onAuthStateChange((event: AuthChangeEvent) => {
    if (event === "PASSWORD_RECOVERY") {
      callback(true);
    }
  });
  return () => data.subscription.unsubscribe();
}
