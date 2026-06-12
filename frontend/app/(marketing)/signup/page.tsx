import { Suspense } from "react";
import { SignupPage } from "./components/SignupPage";
import { parseSignupStep } from "./components/SignupWizard/utils";
import { LOGIN_OAUTH_CALLBACK_ERROR } from "../login/components/LoginOAuthButtons/constants";

export const dynamic = "force-dynamic";

interface SignupRouteProps {
  searchParams: Promise<{ step?: string; error?: string }>;
}

export default async function Signup({ searchParams }: SignupRouteProps) {
  const params = await searchParams;
  const initialStep = parseSignupStep(params.step);
  const initialError = params.error === "auth_callback" ? LOGIN_OAUTH_CALLBACK_ERROR : null;

  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-4 py-16">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
        </div>
      }
    >
      <SignupPage initialStep={initialStep} initialError={initialError} />
    </Suspense>
  );
}
