import { AppProblemPage } from "@/components/AppProblemPage";
import { loadNotFoundPageCtas } from "@/components/AppProblemPage/loadNotFoundCtas.server";

export default async function PortalNotFound() {
  const { primaryCta, secondaryCta } = await loadNotFoundPageCtas();

  return (
    <AppProblemPage
      variant="embedded"
      kind="notFound"
      primaryCta={primaryCta}
      secondaryCta={secondaryCta}
    />
  );
}
