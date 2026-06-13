import {
  signInWithPassword,
  signUpWithEmail,
  syncServerAuthSession,
} from "@/services/auth.service";
import { completeOnboardingOrganization } from "@/services/onboarding.service";
import {
  inviteOrganizationMember,
  uploadOrganizationImageAndSetPath,
} from "@/services/organization.service";
import type { SignupDraft } from "@/app/(marketing)/signup/components/SignupWizard/types";
import { slugFromOrganizationName } from "@/utils/organization-slug";

export async function submitSignup(input: {
  draft: SignupDraft;
  orgImageFile: File | null;
  hasSession: boolean;
}): Promise<{ organizationId: string }> {
  const { draft, orgImageFile, hasSession } = input;

  if (!draft.organization) {
    throw new Error("Organization details are required");
  }

  if (!hasSession) {
    if (!draft.account) {
      throw new Error("Account details are required");
    }
    const { error, session } = await signUpWithEmail({
      email: draft.account.email,
      password: draft.account.password,
      fullName: draft.account.fullName,
      referralSource: draft.account.referralSource,
    });
    if (error) throw error;

    if (!session) {
      const signIn = await signInWithPassword(draft.account.email, draft.account.password);
      if (signIn.error) {
        throw new Error("Check your email to confirm, then return here to finish sign-up.");
      }
    }

    const sync = await syncServerAuthSession();
    if (sync.error) throw sync.error;
  }

  const org = await completeOnboardingOrganization({
    name: draft.organization.name,
    slug: slugFromOrganizationName(draft.organization.name),
    teamSize: draft.organization.teamSize,
    monthlyShipmentVolume: draft.organization.monthlyShipmentVolume,
  });

  if (orgImageFile) {
    await uploadOrganizationImageAndSetPath({
      organizationId: org.id,
      file: orgImageFile,
      previousPath: null,
    });
  }

  for (const invite of draft.invites) {
    const email = invite.email.trim().toLowerCase();
    if (!email) continue;
    await inviteOrganizationMember({
      organization_id: org.id,
      email,
      role: invite.role,
    });
  }

  return { organizationId: org.id };
}
