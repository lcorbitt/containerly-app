/** Parse JSON from a `fetch` Response and throw with API `error` message when not OK. */
export async function readApiJson<T>(res: Response): Promise<T> {
  const data = (await res.json()) as T & { error?: string };
  if (!res.ok) {
    throw new Error(typeof data.error === "string" ? data.error : res.statusText);
  }
  return data as T;
}
