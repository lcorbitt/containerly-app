/** OAuth provider buttons are hidden on production builds until launch. */
export function areOAuthButtonsEnabled(): boolean {
  return process.env.NODE_ENV !== "production";
}
