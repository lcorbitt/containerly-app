export function passwordsMatch(password: string, confirmPassword: string): boolean {
  return password === confirmPassword;
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
