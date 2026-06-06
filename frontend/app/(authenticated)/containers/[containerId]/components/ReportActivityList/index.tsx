import { formatTimestamp } from "@/utils/datetime";
import type { ReportActivity } from "@/types/database";

const ACTIVITY_ACTION_LABELS: Record<string, string> = {
  public_view: "Public report viewed (legacy)",
  customer_message: "Customer message",
  customer_invite_created: "Invite sent",
  customer_invite_accepted: "Invite accepted",
};

function activityActionLabel(action: string): string {
  return ACTIVITY_ACTION_LABELS[action] ?? action.replace(/_/g, " ");
}

function activityContextLine(a: ReportActivity): string | null {
  const m =
    a.metadata && typeof a.metadata === "object" && !Array.isArray(a.metadata)
      ? (a.metadata as Record<string, unknown>)
      : null;
  if (m?.invited_email != null) return String(m.invited_email);
  if (a.shared_report_id) return "Legacy shared link";
  return null;
}

export function ReportActivityList({
  activity,
  className,
}: {
  activity: ReportActivity[];
  className?: string;
}) {
  return (
    <ul className={`space-y-0 text-xs text-zinc-600 dark:text-zinc-400 ${className ?? ""}`}>
      {activity.length === 0 ? (
        <li className="py-2 text-zinc-500">No activity logged yet.</li>
      ) : (
        activity.map((a) => {
          const ctx = activityContextLine(a);
          return (
            <li
              key={a.id}
              className="border-b border-zinc-100 py-2.5 last:border-0 dark:border-zinc-800"
            >
              <div>
                <span className="font-medium text-zinc-800 dark:text-zinc-200">
                  {activityActionLabel(a.action)}
                </span>
                <span className="text-zinc-500"> · {formatTimestamp(a.created_at)}</span>
              </div>
              {ctx ? (
                <p className="mt-1 text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                  <span className="text-zinc-600 dark:text-zinc-300">{ctx}</span>
                </p>
              ) : null}
            </li>
          );
        })
      )}
    </ul>
  );
}
