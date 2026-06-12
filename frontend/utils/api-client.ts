import { readApiJson } from "@/utils/json-api";

/** Authenticated same-origin fetch to Next `/api/auth/session` (cookie bridge). */
export async function apiJson<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    credentials: "include",
    headers: {
      ...(init?.headers as Record<string, string>),
    },
  });
  return readApiJson<T>(res);
}
