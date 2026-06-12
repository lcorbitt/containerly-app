import { SignupWizard } from "../SignupWizard";
import {
  SIGNUP_PAGE_BACKGROUND_CLASS,
  SIGNUP_PAGE_CLASS,
  SIGNUP_PAGE_INNER_CLASS,
} from "./constants";
import type { SignupPageProps } from "./types";

export function SignupPage({ initialStep, initialError = null }: SignupPageProps) {
  return (
    <div className={SIGNUP_PAGE_CLASS}>
      <div className={SIGNUP_PAGE_BACKGROUND_CLASS} aria-hidden>
        <div className="landing-grid-bg absolute inset-0" />
        <div className="landing-hero-glow opacity-60" />
      </div>

      <div className={SIGNUP_PAGE_INNER_CLASS}>
        <SignupWizard initialStep={initialStep} initialError={initialError} />
      </div>
    </div>
  );
}
