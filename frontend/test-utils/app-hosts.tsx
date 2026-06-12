"use client";

import { Provider, createStore } from "jotai";
import { useHydrateAtoms } from "jotai/utils";
import type { ReactNode } from "react";
import { useState } from "react";
import {
  orgWorkspaceActiveAtom,
  orgWorkspaceMetaAtom,
  orgsAtom,
  selectedOrgIdAtom,
} from "@/atoms/organization-workspace";
import { ConfirmDialogHost } from "@/hosts/confirm-dialog";
import { ToastHost } from "@/hosts/toast";

interface TestOrgWorkspaceOptions {
  selectedOrgId?: string | null;
  isSuperAdmin?: boolean;
  userId?: string;
}

function TestOrgWorkspaceHydrate({
  children,
  selectedOrgId = null,
  isSuperAdmin = false,
  userId = "test-user",
}: TestOrgWorkspaceOptions & { children: ReactNode }) {
  useHydrateAtoms([
    [orgsAtom, []],
    [selectedOrgIdAtom, selectedOrgId],
    [orgWorkspaceMetaAtom, { userId, isSuperAdmin }],
    [orgWorkspaceActiveAtom, true],
  ]);
  return <>{children}</>;
}

/** Toast + confirm hosts with an isolated Jotai store (no org workspace). */
export function TestConfirmToastHosts({ children }: { children: ReactNode }) {
  const [store] = useState(() => createStore());

  return (
    <Provider store={store}>
      <ConfirmDialogHost>
        <ToastHost>{children}</ToastHost>
      </ConfirmDialogHost>
    </Provider>
  );
}

/** Jotai store + toast/confirm hosts + optional org workspace for unit tests. */
export function TestAppHosts({
  children,
  org,
}: {
  children: ReactNode;
  org?: TestOrgWorkspaceOptions;
}) {
  const [store] = useState(() => createStore());

  return (
    <Provider store={store}>
      <TestOrgWorkspaceHydrate {...org}>
        <ConfirmDialogHost>
          <ToastHost>{children}</ToastHost>
        </ConfirmDialogHost>
      </TestOrgWorkspaceHydrate>
    </Provider>
  );
}
