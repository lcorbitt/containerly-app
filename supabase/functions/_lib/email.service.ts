/**
 * Transactional email via Resend (or console log in local dev when RESEND_API_KEY unset).
 */

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export type SendEmailResult = { ok: true; providerId?: string } | { ok: false; error: string };

export async function sendTransactionalEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = Deno.env.get("RESEND_API_KEY")?.trim();
  const from = Deno.env.get("RESEND_FROM_EMAIL")?.trim() ?? "Containerly <notifications@containerly.app>";

  if (!apiKey) {
    console.log("[email:dev]", {
      to: input.to,
      subject: input.subject,
      text: input.text ?? input.html.replace(/<[^>]+>/g, " "),
    });
    return { ok: true };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      console.error("[email] Resend rejected send", { to: input.to, status: res.status, body });
      return { ok: false, error: `Resend ${res.status}: ${body}` };
    }
    let providerId: string | undefined;
    try {
      const parsed = (await res.json()) as { id?: string };
      providerId = parsed.id;
    } catch {
      /* ignore */
    }
    console.log("[email] sent", { to: input.to, subject: input.subject, providerId });
    return { ok: true, providerId };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Email send failed" };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildBrandedEmailHtml(args: {
  orgName: string;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
}): string {
  const actionBlock = args.actionUrl
    ? `<p style="margin-top:24px"><a href="${escapeHtml(args.actionUrl)}" style="background:#18181b;color:#fff;padding:10px 18px;border-radius:6px;text-decoration:none">${escapeHtml(args.actionLabel ?? "Open in Containerly")}</a></p>`
    : "";
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#18181b;line-height:1.5">
<p style="color:#71717a;font-size:12px">${escapeHtml(args.orgName)} via Containerly</p>
<h2 style="font-size:18px;margin:0 0 12px">${escapeHtml(args.title)}</h2>
<p>${args.body}</p>
${actionBlock}
<p style="margin-top:32px;font-size:11px;color:#a1a1aa">Powered by Containerly</p>
</body></html>`;
}

export async function sendCustomerAccessRequestEmail(args: {
  to: string;
  orgName: string;
  requesterEmail: string;
  orderPhrase: string;
  workspaceUrl: string;
}): Promise<SendEmailResult> {
  const masked = args.requesterEmail.replace(/(^.).*(@.*$)/, "$1***$2");
  return sendTransactionalEmail({
    to: args.to,
    subject: `Access request for ${args.orderPhrase}`,
    html: buildBrandedEmailHtml({
      orgName: args.orgName,
      title: "Customer portal access request",
      body: `<strong>${escapeHtml(masked)}</strong> requested access to <strong>${escapeHtml(args.orderPhrase)}</strong>. Approve or deny from your notifications in Containerly.`,
      actionUrl: args.workspaceUrl,
      actionLabel: "Review request",
    }),
    text: `${masked} requested access to ${args.orderPhrase}. Open: ${args.workspaceUrl}`,
  });
}

export async function sendCustomerInviteEmail(args: {
  to: string;
  orgName: string;
  inviteUrl: string;
}): Promise<SendEmailResult> {
  return sendTransactionalEmail({
    to: args.to,
    subject: `${args.orgName} shared a shipment with you`,
    html: buildBrandedEmailHtml({
      orgName: args.orgName,
      title: "You've been invited to review shipment documents",
      body: `<strong>${escapeHtml(args.orgName)}</strong> invited you to their customer portal on Containerly. Sign in with this email address to review documents and track your shipment.`,
      actionUrl: args.inviteUrl,
      actionLabel: "Accept invitation",
    }),
    text: `${args.orgName} invited you to review shipment documents. Open: ${args.inviteUrl}`,
  });
}

export async function sendPortalSignInLinkEmail(args: {
  to: string;
  orgName: string;
  signInUrl: string;
  shipmentLabel: string;
}): Promise<SendEmailResult> {
  return sendTransactionalEmail({
    to: args.to,
    subject: `Sign in to view ${args.shipmentLabel}`,
    html: buildBrandedEmailHtml({
      orgName: args.orgName,
      title: "Your secure sign-in link",
      body: `Click the button below to open <strong>${escapeHtml(args.shipmentLabel)}</strong> in the ${escapeHtml(args.orgName)} customer portal. This link signs you in automatically — no password needed.`,
      actionUrl: args.signInUrl,
      actionLabel: "Open your shipment",
    }),
    text: `Sign in to view ${args.shipmentLabel} in the ${args.orgName} customer portal: ${args.signInUrl}`,
  });
}

export async function sendDocumentRejectedEmail(args: {
  to: string;
  orgName: string;
  fileName: string;
  reason: string;
  workspaceUrl: string;
}): Promise<SendEmailResult> {
  return sendTransactionalEmail({
    to: args.to,
    subject: `Document rejected: ${args.fileName}`,
    html: buildBrandedEmailHtml({
      orgName: args.orgName,
      title: "Customer rejected a document",
      body: `The customer rejected <strong>${escapeHtml(args.fileName)}</strong>.<br><br>Reason: ${escapeHtml(args.reason)}`,
      actionUrl: args.workspaceUrl,
      actionLabel: "Open shipment workspace",
    }),
  });
}

export async function sendDocumentsApprovedEmail(args: {
  to: string;
  orgName: string;
  workspaceUrl: string;
}): Promise<SendEmailResult> {
  return sendTransactionalEmail({
    to: args.to,
    subject: "All draft documents approved",
    html: buildBrandedEmailHtml({
      orgName: args.orgName,
      title: "Documents approved",
      body: "The customer approved all draft documents. You can mail the originals and add a tracking number.",
      actionUrl: args.workspaceUrl,
      actionLabel: "Open shipment workspace",
    }),
  });
}

export async function sendDocumentsMailedEmail(args: {
  to: string;
  orgName: string;
  trackingNumber: string | null;
  portalUrl: string;
}): Promise<SendEmailResult> {
  const trackingLine = args.trackingNumber
    ? `<br><br>Tracking Number: <strong>${escapeHtml(args.trackingNumber)}</strong>`
    : "";
  return sendTransactionalEmail({
    to: args.to,
    subject: "Original documents have been mailed",
    html: buildBrandedEmailHtml({
      orgName: args.orgName,
      title: "Original documents mailed",
      body: `Your original export documents have been mailed.${trackingLine}`,
      actionUrl: args.portalUrl,
      actionLabel: "View shipment portal",
    }),
  });
}

export async function sendNewMessageEmail(args: {
  to: string;
  orgName: string;
  preview: string;
  url: string;
  recipientRole: "operator" | "customer";
}): Promise<SendEmailResult> {
  const title = args.recipientRole === "operator"
    ? "New customer message"
    : "New message on your shipment";
  return sendTransactionalEmail({
    to: args.to,
    subject: title,
    html: buildBrandedEmailHtml({
      orgName: args.orgName,
      title,
      body: escapeHtml(args.preview.slice(0, 280)),
      actionUrl: args.url,
      actionLabel: "View message",
    }),
  });
}
