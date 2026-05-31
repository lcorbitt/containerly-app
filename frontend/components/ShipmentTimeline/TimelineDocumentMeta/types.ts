import type { TimelineDocumentMeta } from "../types";

export interface TimelineDocumentMetaProps {
  meta: TimelineDocumentMeta;
  /** Tighter spacing when embedded in timeline cards. */
  compact?: boolean;
}
