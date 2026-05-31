import {
  adminNavItems,
  freightNavItems,
  importerNavItems,
} from "@/app/(authenticated)/components/SideNav/constants";
import type { BreadcrumbSegment, SubTabRoute } from "./types";

const navItemsByHrefLength = (isFreight: boolean) =>
  [...adminNavItems, ...(isFreight ? freightNavItems : importerNavItems)].sort(
    (a, b) => b.href.length - a.href.length,
  );

export function activeNavSegmentFromPathname(
  pathname: string,
  isFreight: boolean,
): BreadcrumbSegment | null {
  for (const item of navItemsByHrefLength(isFreight)) {
    if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
      return { label: item.label, href: item.href };
    }
  }

  if (pathname.startsWith("/containers/")) {
    return { label: "Shipments", href: "/shipments" };
  }

  return null;
}

export function parseSubTabRoute(pathname: string): SubTabRoute | null {
  const operatorMatch = pathname.match(/^\/shipments\/(?!hub\/)([^/]+)\/?$/);
  if (operatorMatch) {
    return {
      kind: "shipment-operator",
      shipmentId: operatorMatch[1]!,
      href: pathname,
    };
  }

  const hubMatch = pathname.match(/^\/shipments\/hub\/([^/]+)\/?$/);
  if (hubMatch) {
    return {
      kind: "shipment-hub",
      shipmentId: hubMatch[1]!,
      href: pathname,
    };
  }

  const containerMatch = pathname.match(/^\/containers\/([^/]+)\/?$/);
  if (containerMatch) {
    return {
      kind: "container",
      containerId: containerMatch[1]!,
      href: pathname,
    };
  }

  return null;
}

export function fallbackSubTabLabel(id: string): string {
  return id.slice(0, 8);
}
