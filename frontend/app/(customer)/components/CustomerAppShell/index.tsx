"use client";

import { SessionAvatarInit } from "@/components/SessionAvatarInit";
import { CustomerTopNav } from "@/components/TopNav";
import { AuthenticatedMainPane } from "@/app/(authenticated)/components/AuthenticatedMainPane";
import {
  AUTHENTICATED_APP_SHELL_BODY_CLASS,
  AUTHENTICATED_APP_SHELL_MAIN_CLASS,
  AUTHENTICATED_APP_SHELL_MAIN_INNER_CLASS,
  AUTHENTICATED_APP_SHELL_ROOT_CLASS,
} from "@/app/(authenticated)/components/AuthenticatedAppShell/constants";
import { CustomerSideNav } from "../CustomerSideNav";
import type { CustomerAppShellProps } from "./types";

export function CustomerAppShell({
  email,
  fullName,
  initialProfileImagePath,
  children,
}: CustomerAppShellProps) {
  return (
    <>
      <SessionAvatarInit initialProfileImagePath={initialProfileImagePath} />
      <div className={AUTHENTICATED_APP_SHELL_ROOT_CLASS}>
        <CustomerTopNav shellMode />
        <div className={AUTHENTICATED_APP_SHELL_BODY_CLASS}>
          <CustomerSideNav email={email} fullName={fullName} />
          <div className={AUTHENTICATED_APP_SHELL_MAIN_CLASS} data-authenticated-main-scroll>
            <div className={AUTHENTICATED_APP_SHELL_MAIN_INNER_CLASS}>
              <AuthenticatedMainPane>{children}</AuthenticatedMainPane>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
