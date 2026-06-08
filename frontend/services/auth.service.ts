import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

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
