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

const BRAND_ORANGE = "#ff4e00";
const INK = "#18181b";
const MUTED = "#71717a";
const FAINT = "#a1a1aa";
const PAGE_BG = "#f4f4f5";
const BORDER = "#e4e4e7";
const FONT_STACK =
  "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function marketingSiteUrl(): string {
  return Deno.env.get("PUBLIC_SITE_URL")?.trim().replace(/\/$/, "") ?? "";
}

/** Logo image (when site URL is known) plus the "Containerly" wordmark, for resilience when images are blocked. */
function brandHeaderHtml(): string {
  const siteUrl = marketingSiteUrl();
  const logoImg = siteUrl
    ? `<img src="${escapeHtml(siteUrl)}/containerly-logo.png" alt="Containerly" width="28" height="28" style="display:block;border:0;outline:none;width:28px;height:28px" />`
    : "";
  const logoCell = logoImg
    ? `<td width="28" style="padding:0 10px 0 0;vertical-align:middle">${logoImg}</td>`
    : "";
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
${logoCell}
<td style="vertical-align:middle;font-family:${FONT_STACK};font-size:18px;font-weight:700;letter-spacing:-0.01em;color:${INK}">Containerly</td>
</tr></table>`;
}

/** Bulletproof, table-based CTA button so it renders consistently across email clients. */
function ctaButtonHtml(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 4px"><tr>
<td align="center" bgcolor="${BRAND_ORANGE}" style="border-radius:8px">
<a href="${escapeHtml(url)}" style="display:inline-block;padding:12px 24px;font-family:${FONT_STACK};font-size:15px;font-weight:600;line-height:1;color:#ffffff;text-decoration:none;border-radius:8px">${escapeHtml(label)}</a>
</td></tr></table>`;
}

function footerHtml(): string {
  const siteUrl = marketingSiteUrl();
  const containerlyLink = siteUrl
    ? `<a href="${escapeHtml(siteUrl)}" style="color:${MUTED};text-decoration:underline">Containerly</a>`
    : "Containerly";
  return `<tr><td style="padding:20px 32px 28px;border-top:1px solid ${BORDER}">
<p style="margin:0;font-family:${FONT_STACK};font-size:12px;line-height:1.5;color:${FAINT}">Powered by ${containerlyLink} — the customer portal for freight forwarders.</p>
</td></tr>`;
}

export function buildBrandedEmailHtml(args: {
  orgName: string;
  title: string;
  body: string;
  actionUrl?: string;
  actionLabel?: string;
}): string {
  const preheader = `${args.orgName} via Containerly`;
  const actionBlock = args.actionUrl
    ? ctaButtonHtml(args.actionUrl, args.actionLabel ?? "Open in Containerly")
    : "";
  return `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="color-scheme" content="light only" />
<title>${escapeHtml(args.title)}</title>
</head>
<body style="margin:0;padding:0;background-color:${PAGE_BG};-webkit-text-size-adjust:100%">
<span style="display:none!important;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all">${escapeHtml(preheader)}</span>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:${PAGE_BG}">
<tr><td align="center" style="padding:32px 16px">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;background-color:#ffffff;border:1px solid ${BORDER};border-radius:12px;overflow:hidden">
<tr><td style="height:4px;background-color:${BRAND_ORANGE};line-height:4px;font-size:4px">&nbsp;</td></tr>
<tr><td style="padding:28px 32px 0">
${brandHeaderHtml()}
</td></tr>
<tr><td style="padding:24px 32px 28px">
<p style="margin:0 0 6px;font-family:${FONT_STACK};font-size:12px;font-weight:600;letter-spacing:0.04em;text-transform:uppercase;color:${BRAND_ORANGE}">${escapeHtml(args.orgName)} via Containerly</p>
<h1 style="margin:0 0 14px;font-family:${FONT_STACK};font-size:21px;font-weight:700;line-height:1.3;letter-spacing:-0.01em;color:${INK}">${escapeHtml(args.title)}</h1>
<div style="font-family:${FONT_STACK};font-size:15px;line-height:1.6;color:#3f3f46">${args.body}</div>
${actionBlock}
</td></tr>
${footerHtml()}
</table>
</td></tr>
</table>
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

export async function sendPasswordChangedEmail(args: {
  to: string;
  loginUrl: string;
}): Promise<SendEmailResult> {
  const orgName = "Containerly";
  return sendTransactionalEmail({
    to: args.to,
    subject: "Your Containerly Password Was Updated",
    html: buildBrandedEmailHtml({
      orgName,
      title: "Your password was updated",
      body:
        "Your Containerly account password was changed successfully. If you did not make this change, contact your administrator or reply to this email immediately.",
      actionUrl: args.loginUrl,
      actionLabel: "Sign In",
    }),
    text: `Your Containerly password was updated. Sign in: ${args.loginUrl}`,
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
