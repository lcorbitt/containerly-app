import { readApiJson } from "@/services/json-api";

export async function createOrganization(input: {
  name: string;
  slug: string | null;
}): Promise<{ id: string }> {
  const res = await fetch("/api/organizations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: input.name.trim(),
      slug: input.slug?.trim() || null,
    }),
  });
  const data = await readApiJson<{ id?: string }>(res);
  if (!data.id) throw new Error("Missing organization id");
  return { id: data.id };
}
