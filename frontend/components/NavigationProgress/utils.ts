export function isSameAppLocation(
  nextPathname: string,
  nextSearch: string,
  currentPathname: string,
  currentSearch: string,
): boolean {
  return nextPathname === currentPathname && nextSearch === currentSearch;
}

export function resolveInternalNavigationTarget(
  href: string | null,
  origin: string,
): { pathname: string; search: string } | null {
  if (href == null || href === "" || href.startsWith("#")) return null;

  try {
    const url = new URL(href, origin);
    if (url.origin !== origin) return null;
    return { pathname: url.pathname, search: url.search };
  } catch {
    return null;
  }
}

export function shouldStartNavigationFromAnchor(anchor: HTMLAnchorElement): boolean {
  if (anchor.hasAttribute("download")) return false;
  if (anchor.target && anchor.target !== "_self") return false;

  const href = anchor.getAttribute("href");
  const target = resolveInternalNavigationTarget(href, window.location.origin);
  if (!target) return false;

  return !isSameAppLocation(
    target.pathname,
    target.search,
    window.location.pathname,
    window.location.search,
  );
}
