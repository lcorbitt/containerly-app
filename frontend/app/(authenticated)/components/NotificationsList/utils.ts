import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  BadgeCheck,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  FileUp,
  Info,
  Mail,
  MailOpen,
  MessageSquareReply,
  RefreshCw,
  ScrollText,
  Send,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

export type IconConfig = { Icon: LucideIcon; className: string };

export function alertTypeIconConfig(alertType: string): IconConfig {
  switch (alertType) {
    case "SHIPMENT_DELAYED":
      return { Icon: Clock, className: "text-amber-600 dark:text-amber-400" };
    case "STATUS_EXCEPTION":
      return { Icon: AlertTriangle, className: "text-red-600 dark:text-red-400" };
    case "INFO":
      return { Icon: Info, className: "text-zinc-500 dark:text-zinc-400" };
    case "ASSIGNMENT_ASSIGNEE":
      return { Icon: UserCheck, className: "text-violet-600 dark:text-violet-400" };
    case "ASSIGNMENT_PARTICIPANT":
      return { Icon: Users, className: "text-indigo-600 dark:text-indigo-400" };
    case "MESSAGE_NEW":
      return { Icon: Mail, className: "text-sky-600 dark:text-sky-400" };
    case "MESSAGE_REPLY":
      return { Icon: MessageSquareReply, className: "text-cyan-600 dark:text-cyan-400" };
    case "DOCUMENT_UPLOADED":
      return { Icon: FileUp, className: "text-emerald-600 dark:text-emerald-400" };
    case "DOCUMENT_REJECTED":
      return { Icon: XCircle, className: "text-red-600 dark:text-red-400" };
    case "DOCUMENTS_APPROVED":
      return { Icon: CheckCircle2, className: "text-green-600 dark:text-green-400" };
    case "DOCUMENTS_MAILED":
      return { Icon: MailOpen, className: "text-violet-600 dark:text-violet-400" };
    case "CUSTOMER_INVITE_SENT":
      return { Icon: Send, className: "text-sky-600 dark:text-sky-400" };
    case "ORG_INVITE_ACCEPTED":
    case "ORG_MEMBER_JOINED":
      return { Icon: BadgeCheck, className: "text-green-600 dark:text-green-400" };
    case "CUSTOMER_JOINED_ORG":
    case "CUSTOMER_ACCESS_GRANTED":
      return { Icon: Building2, className: "text-teal-600 dark:text-teal-400" };
    case "BOL_IMPORTED":
      return { Icon: ScrollText, className: "text-orange-600 dark:text-orange-400" };
    case "TRACKING_LINKED":
      return { Icon: RefreshCw, className: "text-blue-600 dark:text-blue-400" };
    case "TRACKING_SYNC_OK":
      return { Icon: RefreshCw, className: "text-blue-600 dark:text-blue-400" };
    case "TRACKING_SYNC_FAILED":
      return { Icon: AlertTriangle, className: "text-amber-600 dark:text-amber-400" };
    case "DRAFTS_PUBLISHED":
      return { Icon: FileUp, className: "text-emerald-600 dark:text-emerald-400" };
    case "MESSAGE_TEAM":
      return { Icon: MessageSquareReply, className: "text-indigo-600 dark:text-indigo-400" };
    case "ASSIGNMENT_REMOVED":
    case "ASSIGNMENT_REASSIGNED":
      return { Icon: Users, className: "text-zinc-600 dark:text-zinc-400" };
    default:
      return { Icon: Bell, className: "text-zinc-500 dark:text-zinc-400" };
  }
}
