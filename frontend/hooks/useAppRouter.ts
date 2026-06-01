"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useNavigationProgress } from "@/components/NavigationProgress";
import { navigationEntityLabelFromHref } from "@/components/NavigationProgress/navigation-entity-label";

type AppRouter = ReturnType<typeof useRouter>;

export function useAppRouter(): AppRouter {
  const router = useRouter();
  const { startNavigation } = useNavigationProgress();

  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<AppRouter["push"]>[1]) => {
        startNavigation(navigationEntityLabelFromHref(href));
        return router.push(href, options);
      },
      replace: (href: string, options?: Parameters<AppRouter["replace"]>[1]) => {
        startNavigation(navigationEntityLabelFromHref(href));
        return router.replace(href, options);
      },
    }),
    [router, startNavigation],
  );
}
