import {
  Bell,
  GitBranch,
  Radar,
  ShieldCheck,
  Users,
  Workflow,
} from "lucide-react";
import type {
  AudienceCard,
  AutomationExample,
  FeatureCard,
  Step,
} from "./types";

export const ACCENT_BTN_CLASS =
  "inline-flex items-center justify-center rounded-full border border-primary-orange/70 bg-white px-6 py-3 text-sm font-semibold text-primary-orange shadow-sm transition-[box-shadow,transform,border-color,background-color] hover:border-primary-orange hover:bg-primary-orange/5 active:scale-[0.98] dark:border-primary-orange/85 dark:bg-black/55 dark:shadow-[0_0_28px_rgba(255,78,0,0.35)] dark:backdrop-blur-sm dark:hover:bg-primary-orange/10 dark:hover:shadow-[0_0_40px_rgba(255,78,0,0.48)]";

export const GHOST_BTN_CLASS =
  "inline-flex items-center justify-center rounded-full border border-zinc-300 px-6 py-3 text-sm font-medium text-zinc-700 transition-colors hover:border-primary-orange/40 hover:text-zinc-900 dark:border-white/15 dark:text-zinc-200 dark:hover:text-white";

export const HERO_EYEBROW = "For freight brokers, 3PLs, and export teams";

export const HERO_SUBHEAD =
  "Containerly replaces the email threads, document chasing, and status questions around every shipment with a single shared workspace.";

export const PROBLEM_HEADLINE =
  "Stop digging through emails and spreadsheets to answer shipment questions.";

export const featureCards: readonly FeatureCard[] = [
  {
    icon: Radar,
    title: "One link, every update",
    body: "Status, milestones, and history live on one shareable page, so your team is not reconciling three different answers across inboxes.",
  },
  {
    icon: Bell,
    title: "Branded portals customers open",
    body: "Importers and partners get a clarity your competitors email as PDF attachments, so the experience becomes a reason to keep working with you instead of shopping the next quote.",
  },
  {
    icon: Workflow,
    title: "Automation behind the scenes",
    body: "Route delays and exceptions to the right owners, so issues get handled before they turn into escalations.",
  },
  {
    icon: GitBranch,
    title: "Retail grade clarity",
    body: "Clear next steps and ETAs that feel closer to consumer package tracking than a forwarded thread from a broker.",
  },
  {
    icon: Users,
    title: "Built for how teams work",
    body: "Shared access and history, so operations, planning, and leadership all reference the same shipments and decisions.",
  },
  {
    icon: ShieldCheck,
    title: "Document approvals in one place",
    body: "Upload export drafts, route them for customer sign off, and track originals through mail and carrier milestones.",
  },
];

export const painBullets: readonly string[] = [
  "Status lives in inboxes, spreadsheets, and carrier sites all at the same time.",
  "Customers reopen the same questions by email and phone because they have nowhere durable to look.",
  "A clunky update experience quietly downgrades you to 'just a vendor' the next time they shop the lane.",
  "Exceptions surface late because nobody gets notified with context.",
];

export const audienceCards: readonly AudienceCard[] = [
  {
    label: "Freight brokers",
    headline: "Stop fielding 'where is my load?' calls",
    pain: "Loads move fast but communication lags behind, and every status question pulls you off the next deal.",
    outcome: "Send one live link per shipment and look bigger than you are on every load you move.",
  },
  {
    label: "3PLs",
    headline: "One branded portal for every customer",
    pain: "Every customer wants updates differently, so account managers rebuild the same communication one email at a time.",
    outcome: "Make the customer experience the reason accounts renew, with a consistent portal that scales without more headcount.",
  },
  {
    label: "Enterprise shippers",
    headline: "One source of truth per shipment",
    pain: "Internal teams and customers see different information, and document chaos turns into real operational risk.",
    outcome: "Align internal and external visibility on one record, with a clean audit trail for every shipment.",
  },
];

export const portalSteps: readonly Step[] = [
  {
    n: "01",
    title: "Look like the most professional partner they work with",
    body: "Hand customers a branded portal to review documents, approve exports, and follow activity, with optional carrier tracking when you turn it on. You set the bar their other suppliers get measured against.",
  },
  {
    n: "02",
    title: "Cut the inbound that eats your day",
    body: "Customers self serve status and documents after a short, verified sign up, so the 'where is it' and 'send me that doc again' messages stop landing in your inbox.",
  },
  {
    n: "03",
    title: "Become the supplier they do not want to leave",
    body: "Every shipment lives on one durable record instead of scattered forwards and screenshots, so switching away from you means giving up the clarity they now expect.",
  },
  {
    n: "04",
    title: "Stay top of mind when it moves",
    body: "Notifications pull customers back to the portal the moment something material changes, so you stay visible and your updates stay tied to evidence.",
  },
];

export const automationExamples: readonly AutomationExample[] = [
  {
    title: "Act on delays",
    body: "Notify subscribers and internal owners the moment a milestone slips.",
  },
  {
    title: "Surface stale data",
    body: "Flag your team when information needs a refresh before it becomes a customer issue.",
  },
  {
    title: "Meet people where they are",
    body: "Email and SMS today, with room to expand into the channels your organization standardizes on.",
  },
];

export const steps: readonly Step[] = [
  {
    n: "01",
    title: "Set up your organization",
    body: "Create your organization and invite teammates, so operations, planning, and leadership work from one shared source of truth.",
  },
  {
    n: "02",
    title: "Create a shipment workspace",
    body: "Start with commercial details and order lines. Keep every update anchored to a single shipment record instead of scattered threads and spreadsheets.",
  },
  {
    n: "03",
    title: "Upload documents and collect approval",
    body: "Route export drafts and key attachments for customer sign off. Approvals, rejections, and comments stay attached to the shipment timeline.",
  },
  {
    n: "04",
    title: "Invite customers into a branded portal",
    body: "Share a dedicated customer portal where importers and partners self serve documents, shipment details, and the same narrative your team relies on.",
  },
  {
    n: "05",
    title: "Keep communication structured",
    body: "Use portal messaging and activity history, so updates stay tied to evidence, decisions, and accountability instead of forwarded screenshots.",
  },
  {
    n: "06",
    title: "Track progress and notify the right people",
    body: "Add container tracking as identifiers become available, monitor milestones, and configure notifications so exceptions surface early and subscribers return to the portal.",
  },
];
