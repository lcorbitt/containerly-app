import { LoginAuthPanel } from "../LoginAuthPanel";
import {
  LOGIN_PAGE_BACKGROUND_CLASS,
  LOGIN_PAGE_CLASS,
  LOGIN_PAGE_INNER_CLASS,
} from "./constants";
import type { LoginPageProps } from "./types";

export function LoginPage({ initialMode, next }: LoginPageProps) {
  return (
    <div className={LOGIN_PAGE_CLASS}>
      <div className={LOGIN_PAGE_BACKGROUND_CLASS} aria-hidden>
        <div className="landing-grid-bg absolute inset-0" />
        <div className="landing-hero-glow opacity-60" />
      </div>

      <div className={LOGIN_PAGE_INNER_CLASS}>
        <LoginAuthPanel initialMode={initialMode} next={next} />
      </div>
    </div>
  );
}
