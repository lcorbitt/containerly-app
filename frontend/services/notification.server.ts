import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { stripMessageMarkup } from "@/utils/message-markup";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchProfileDisplayName,
  notifyCustomersOperatorReply,
  notifyOrgAdminsMemberJoined,
  notifyOperatorsBolImported,
  notifyOperatorsCustomerAccessGranted,
  notifyOperatorsCustomerDocumentUploaded,
  notifyOperatorsDraftsPublished,
  notifyOperatorsOriginalsMailed,
  notifyOperatorsTeamMessage,
  notifyOperatorsTrackingLinked,
  notifyUserAssignedAsAssignee,
  notifyUserAssignedAsParticipant,
  notifyUserRemovedAsParticipant,
  notifyUserUnassignedAsAssignee,
} from "@supabase-shared/in-app-alerts";

function adminClient(): SupabaseClient {
  return createAdminClient();
}

export async function runOrgMemberJoinedNotifications(input: {
  organizationId: string;
  newMemberUserId: string;
  actorUserId: string;
  memberEmail: string;
  invited: boolean;
}): Promise<void> {
  const admin = adminClient();
  const memberDisplayName = await fetchProfileDisplayName(admin, input.newMemberUserId).catch(
    () => input.memberEmail,
  );
  await notifyOrgAdminsMemberJoined(admin, {
    organizationId: input.organizationId,
    newMemberUserId: input.newMemberUserId,
    actorUserId: input.actorUserId,
    memberDisplayName,
    invited: input.invited,
  });
}

export async function runAssigneeChangeNotifications(input: {
  organizationId: string;
  shipmentId: string;
  actorUserId: string;
  previousAssigneeUserId: string | null;
  newAssigneeUserId: string | null;
}): Promise<void> {
  const admin = adminClient();
  const ctx = {
    organizationId: input.organizationId,
    shipmentId: input.shipmentId,
  };

  if (
    input.previousAssigneeUserId &&
    input.previousAssigneeUserId !== input.newAssigneeUserId
  ) {
    await notifyUserUnassignedAsAssignee(admin, {
      ...ctx,
      previousAssigneeUserId: input.previousAssigneeUserId,
      actorUserId: input.actorUserId,
      newAssigneeUserId: input.newAssigneeUserId,
    });
  }

  if (input.newAssigneeUserId) {
    await notifyUserAssignedAsAssignee(admin, {
      ...ctx,
      assigneeUserId: input.newAssigneeUserId,
      actorUserId: input.actorUserId,
    });
  }
}

export async function runParticipantAddedNotification(input: {
  organizationId: string;
  shipmentId: string;
  participantUserId: string;
  actorUserId: string;
}): Promise<void> {
  await notifyUserAssignedAsParticipant(adminClient(), {
    organizationId: input.organizationId,
    shipmentId: input.shipmentId,
    participantUserId: input.participantUserId,
    actorUserId: input.actorUserId,
  });
}

export async function runParticipantRemovedNotification(input: {
  organizationId: string;
  shipmentId: string;
  participantUserId: string;
  actorUserId: string;
}): Promise<void> {
  await notifyUserRemovedAsParticipant(adminClient(), {
    organizationId: input.organizationId,
    shipmentId: input.shipmentId,
    participantUserId: input.participantUserId,
    actorUserId: input.actorUserId,
  });
}

export async function runOperatorShipmentMessageNotifications(input: {
  organizationId: string;
  shipmentId: string;
  actorUserId: string;
  body: string;
  internalOnly: boolean;
  reportMessageId: string;
}): Promise<void> {
  if (input.internalOnly) return;
  const preview = stripMessageMarkup(input.body).trim();
  if (!preview) return;

  const admin = adminClient();
  await notifyOperatorsTeamMessage(admin, {
    organizationId: input.organizationId,
    shipmentId: input.shipmentId,
    actorUserId: input.actorUserId,
    preview,
    reportMessageId: input.reportMessageId,
  });

  await notifyCustomersOperatorReply(admin, {
    organizationId: input.organizationId,
    shipmentId: input.shipmentId,
    operatorUserId: input.actorUserId,
    preview,
    reportMessageId: input.reportMessageId,
  });
}

export async function runCustomerDocumentUploadNotification(input: {
  organizationId: string;
  shipmentId: string;
  customerUserId: string;
  fileName: string;
}): Promise<void> {
  await notifyOperatorsCustomerDocumentUploaded(adminClient(), {
    organizationId: input.organizationId,
    shipmentId: input.shipmentId,
    customerUserId: input.customerUserId,
    fileName: input.fileName,
  });
}

export async function runOperatorDraftsPublishedNotification(input: {
  organizationId: string;
  shipmentId: string;
  actorUserId: string;
  fileCount: number;
}): Promise<void> {
  const group = input.fileCount;
  if (group < 1) return;
  await notifyOperatorsDraftsPublished(adminClient(), {
    organizationId: input.organizationId,
    shipmentId: input.shipmentId,
    actorUserId: input.actorUserId,
    fileCount: input.fileCount,
  });
}

export async function runTrackingLinkedNotification(input: {
  organizationId: string;
  shipmentId: string;
  actorUserId: string;
  containerNumber: string;
}): Promise<void> {
  await notifyOperatorsTrackingLinked(adminClient(), input);
}

export async function runBolImportedNotification(input: {
  organizationId: string;
  shipmentId: string;
  actorUserId: string;
  billOfLading: string;
  containerCount: number;
}): Promise<void> {
  await notifyOperatorsBolImported(adminClient(), input);
}

export {
  notifyOperatorsCustomerAccessGranted,
  notifyOperatorsOriginalsMailed,
};
