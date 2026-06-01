import { FileText, MessageSquare, Route } from "lucide-react";
import { WORKSPACE_TAB_ICON_CLASS } from "./constants";

export function WorkspaceTrackingTabIcon() {
  return <Route className={WORKSPACE_TAB_ICON_CLASS} strokeWidth={2} aria-hidden />;
}

export function WorkspaceDocumentsTabIcon() {
  return <FileText className={WORKSPACE_TAB_ICON_CLASS} strokeWidth={2} aria-hidden />;
}

export function WorkspaceMessagesTabIcon() {
  return <MessageSquare className={WORKSPACE_TAB_ICON_CLASS} strokeWidth={2} aria-hidden />;
}
