/** Parse JSON from a `fetch` Response and throw with API `error` message when not OK. */
export async function readApiJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  if (!text.trim()) {
    throw new Error(
      res.ok
        ? "Server returned an empty response."
        : `Request failed (${res.status} ${res.statusText || "error"}).`,
    );
  }

  let data: T & { error?: string };
  try {
    data = JSON.parse(text) as T & { error?: string };
  } catch {
    throw new Error(`Server returned invalid JSON (${res.status}).`);
  }

  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : res.statusText);
  }
  return data as T;
}
