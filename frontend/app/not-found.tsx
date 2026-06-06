import { AppProblemPage } from "@/components/AppProblemPage";
import { loadNotFoundPageCtas } from "@/components/AppProblemPage/loadNotFoundCtas.server";

export default async function NotFound() {
  const { primaryCta, secondaryCta } = await loadNotFoundPageCtas();

  return (
    <AppProblemPage
      variant="standalone"
      kind="notFound"
      primaryCta={primaryCta}
      secondaryCta={secondaryCta}
    />
  );
}
