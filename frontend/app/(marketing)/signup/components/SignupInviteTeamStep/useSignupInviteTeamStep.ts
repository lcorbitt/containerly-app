"use client";

import { useCallback, useState } from "react";
import { useSignupDraft } from "@/atoms/signup-draft";
import type { SignupInviteDraft } from "../SignupWizard/types";
import { createInviteRow, filledInviteRows } from "./utils";
import type { SignupInviteRow } from "./types";

interface UseSignupInviteTeamStepInput {
  onSubmit: (invites: SignupInviteDraft[]) => void | Promise<void>;
}

function rowsFromDraft(invites: SignupInviteDraft[]): SignupInviteRow[] {
  if (invites.length === 0) return [createInviteRow()];
  return invites.map((invite, index) => ({
    id: `invite-${index + 1}`,
    email: invite.email,
    role: invite.role,
  }));
}

export function useSignupInviteTeamStep({ onSubmit }: UseSignupInviteTeamStepInput) {
  const { draft } = useSignupDraft();
  const [rows, setRows] = useState<SignupInviteRow[]>(() => rowsFromDraft(draft.invites));

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, createInviteRow()]);
  }, []);

  const updateRow = useCallback((id: string, update: Partial<SignupInviteRow>) => {
    setRows((prev) => prev.map((row) => (row.id === id ? { ...row, ...update } : row)));
  }, []);

  const finish = useCallback(
    async (invites: SignupInviteDraft[]) => {
      await onSubmit(invites);
    },
    [onSubmit],
  );

  const sendInvites = useCallback(async () => {
    await finish(
      filledInviteRows(rows).map((row) => ({
        email: row.email.trim().toLowerCase(),
        role: row.role,
      })),
    );
  }, [finish, rows]);

  const skipInvites = useCallback(async () => {
    await finish([]);
  }, [finish]);

  return {
    rows,
    addRow,
    updateRow,
    sendInvites,
    skipInvites,
  };
}
