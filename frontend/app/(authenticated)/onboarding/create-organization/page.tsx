import { CreateOrganizationOnboardingForm } from "./components/CreateOrganizationOnboardingForm";

export const dynamic = "force-dynamic";

export default function CreateOrganizationOnboardingPage() {
  return (
    <div className="mx-auto flex w-full max-w-lg flex-col px-4 py-10 sm:px-6">
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
        <CreateOrganizationOnboardingForm />
      </section>
    </div>
  );
}
