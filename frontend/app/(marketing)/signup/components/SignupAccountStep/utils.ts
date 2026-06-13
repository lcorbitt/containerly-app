export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
}

export function initialReferralFields(referralSource?: string): { option: string; other: string } {
  if (!referralSource) return { option: "", other: "" };
  const knownValues = new Set([
    "google_search",
    "chatgpt",
    "social_media",
    "referral",
    "trade_show",
    "other",
  ]);
  if (knownValues.has(referralSource) && referralSource !== "other") {
    return { option: referralSource, other: "" };
  }
  return { option: "other", other: referralSource };
}

export function resolveReferralSource(
  referralOption: string,
  referralOther: string,
): string | undefined {
  if (referralOption === "other") {
    const trimmed = referralOther.trim();
    return trimmed !== "" ? trimmed : undefined;
  }
  if (referralOption === "") return undefined;
  return referralOption;
}
