import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function CreateOrganizationOnboardingPage() {
  redirect("/signup?step=2");
}
