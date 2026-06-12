import { buildBrandedEmailHtml, sendTransactionalEmail } from "@services/email/email.service.ts";
import type { FeedbackCategory } from "@shared/dto/feedback.dto.ts";

const CATEGORY_LABELS: Record<FeedbackCategory, string> = {
  bug: "Bug Report",
  feature: "Feature Request",
  general: "General Feedback",
};

const CATEGORY_EMOJI: Record<FeedbackCategory, string> = {
  bug: ":bug:",
  feature: ":bulb:",
  general: ":speech_balloon:",
};

function escapeSlackText(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function adminFeedbackUrl(): string {
  const base = Deno.env.get("PUBLIC_SITE_URL")?.trim().replace(/\/$/, "") ?? "";
  return base ? `${base}/admin/feedback` : "/admin/feedback";
}

export type NotifyFeedbackSubmittedArgs = {
  id: string;
  category: FeedbackCategory;
  message: string;
  pageUrl: string;
  submitterEmail: string | null;
  accountKind: string | null;
  organizationId: string | null;
};

export async function notifyFeedbackSubmitted(args: NotifyFeedbackSubmittedArgs): Promise<void> {
  const label = CATEGORY_LABELS[args.category];
  const excerpt = args.message.trim().slice(0, 400);
  const submitter = args.submitterEmail ?? "Unknown user";
  const adminUrl = adminFeedbackUrl();

  await Promise.all([
    sendSlackFeedbackNotification({ ...args, label, excerpt, submitter, adminUrl }),
    sendEmailFeedbackNotification({ ...args, label, excerpt, submitter, adminUrl }),
  ]);
}

async function sendSlackFeedbackNotification(args: {
  id: string;
  category: FeedbackCategory;
  label: string;
  excerpt: string;
  pageUrl: string;
  submitter: string;
  accountKind: string | null;
  organizationId: string | null;
  adminUrl: string;
}): Promise<void> {
  const webhook = Deno.env.get("FEEDBACK_SLACK_WEBHOOK_URL")?.trim();
  if (!webhook) return;

  const emoji = CATEGORY_EMOJI[args.category];
  const lines = [
    `${emoji} *${args.label}* from ${escapeSlackText(args.submitter)}`,
    `> ${escapeSlackText(args.excerpt)}`,
    `Page: ${escapeSlackText(args.pageUrl)}`,
    args.accountKind ? `Account: ${escapeSlackText(args.accountKind)}` : null,
    args.organizationId ? `Org: \`${args.organizationId}\`` : null,
    `<${args.adminUrl}|Review in admin>`,
    `ID: \`${args.id}\``,
  ].filter(Boolean);

  try {
    const res = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });
    if (!res.ok) {
      console.error("[feedback:slack] webhook failed", { status: res.status, body: await res.text() });
    }
  } catch (e) {
    console.error("[feedback:slack] send failed", e);
  }
}

async function sendEmailFeedbackNotification(args: {
  id: string;
  category: FeedbackCategory;
  label: string;
  excerpt: string;
  pageUrl: string;
  submitter: string;
  accountKind: string | null;
  organizationId: string | null;
  adminUrl: string;
}): Promise<void> {
  const to = Deno.env.get("FEEDBACK_NOTIFY_EMAIL")?.trim();
  if (!to) return;

  const subjectPrefix = args.category === "bug" ? "[Bug]" : args.category === "feature" ? "[Feature]" : "[Feedback]";
  const contextLines = [
    args.accountKind ? `Account: ${args.accountKind}` : null,
    args.organizationId ? `Organization: ${args.organizationId}` : null,
    `Page: ${args.pageUrl}`,
    `ID: ${args.id}`,
  ].filter(Boolean);

  const escapeHtml = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = `<p style="margin:0 0 14px"><strong>From:</strong> ${escapeHtml(args.submitter)}</p>
<p style="margin:0 0 16px;white-space:pre-wrap">${escapeHtml(args.excerpt)}</p>
<p style="margin:0;font-size:13px;color:#71717a">${contextLines.map(escapeHtml).join("<br>")}</p>`;

  const result = await sendTransactionalEmail({
    to,
    subject: `${subjectPrefix} ${args.label} from ${args.submitter}`,
    html: buildBrandedEmailHtml({
      orgName: "Containerly",
      title: args.label,
      body,
      actionUrl: args.adminUrl,
      actionLabel: "Review Feedback",
    }),
    text: `${args.label} from ${args.submitter}\n\n${args.excerpt}\n\n${contextLines.join("\n")}\n\nReview: ${args.adminUrl}`,
  });

  if (!result.ok) {
    console.error("[feedback:email] send failed", result.error);
  }
}
