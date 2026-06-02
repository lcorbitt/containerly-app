export const TRIAGE_BUCKET_KEYS = ["exceptions", "eta", "docs", "customer"] as const;

export type TriageBucketKey = (typeof TRIAGE_BUCKET_KEYS)[number];
