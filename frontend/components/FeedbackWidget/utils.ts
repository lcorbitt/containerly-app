import type { FeedbackWidgetContext } from "./types";

const SHIPMENT_PATH_PATTERNS = [
  /^\/shipments\/([0-9a-f-]{36})/i,
  /^\/portal\/shipments\/hub\/([0-9a-f-]{36})/i,
  /^\/my-shipments\/([0-9a-f-]{36})/i,
];

export function parseShipmentIdFromPathname(pathname: string): string | null {
  for (const pattern of SHIPMENT_PATH_PATTERNS) {
    const match = pathname.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

export function inferAccountKindFromPathname(pathname: string): string | null {
  if (
    pathname.startsWith("/my-shipments") ||
    pathname.startsWith("/portal") ||
    pathname.startsWith("/invite")
  ) {
    return "customer";
  }
  if (
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/shipments") ||
    pathname.startsWith("/containers") ||
    pathname.startsWith("/tracking") ||
    pathname.startsWith("/settings") ||
    pathname.startsWith("/admin")
  ) {
    return "operator";
  }
  return null;
}

export function buildFeedbackContext(args: {
  pathname: string;
  organizationId: string | null;
}): FeedbackWidgetContext {
  const pageUrl =
    typeof window !== "undefined" ? `${window.location.origin}${args.pathname}` : args.pathname;

  return {
    pageUrl,
    shipmentId: parseShipmentIdFromPathname(args.pathname),
    organizationId: args.organizationId,
    accountKind: inferAccountKindFromPathname(args.pathname),
  };
}

export function formatAccountKindLabel(accountKind: string | null): string {
  if (accountKind === "customer") return "Customer";
  if (accountKind === "operator") return "Operator";
  return "Signed In";
}
