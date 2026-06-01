import { SIDE_NAV_LINK_ACTIVE_CLASS, SIDE_NAV_LINK_INACTIVE_CLASS } from "./constants";

/** `/admin` is an exact route; nested admin pages must not highlight Users. */
export function isSideNavLinkActive(pathname: string, href: string): boolean {
  if (pathname === href) return true;
  if (href === "/admin") return false;
  return pathname.startsWith(`${href}/`);
}

export function getSideNavLinkClassName(active: boolean): string {
  return `flex min-h-0 w-full items-center gap-4 rounded-md p-4 text-xs font-medium leading-tight transition-colors ${
    active ? SIDE_NAV_LINK_ACTIVE_CLASS : SIDE_NAV_LINK_INACTIVE_CLASS
  }`;
}
