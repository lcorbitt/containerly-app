const PATH_SEGMENT_ENTITY_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  alerts: "Alerts",
  shipments: "Shipments",
  documents: "Documents",
  customers: "Customers",
  containers: "Containers",
  automations: "Automations",
  reports: "Reports",
  settings: "Settings",
  "my-settings": "Settings",
  admin: "Users",
  "container-details": "Container Details",
  requests: "Requests",
  "live-vessel-tracking": "Live Vessel Tracking",
  "port-finder": "Port Finder",
  "terminal-finder": "Terminal Finder",
  "vessel-finder": "Vessel Finder",
  "container-numbers": "Container Numbers",
  login: "Sign In",
  "how-it-works": "How It Works",
};

const ADMIN_SUBPATH_ENTITY_LABELS: Record<string, string> = {
  organizations: "Organizations",
};

function titleCaseWords(value: string): string {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function pluralTitleCaseEntityLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "Page";

  const normalized = titleCaseWords(trimmed);
  const routeKey = trimmed.toLowerCase().replace(/\s+/g, "-");
  if (PATH_SEGMENT_ENTITY_LABELS[routeKey]) {
    return PATH_SEGMENT_ENTITY_LABELS[routeKey];
  }

  return normalized;
}

export function navigationEntityLabelFromHref(href: string | null | undefined): string {
  if (href == null || href === "") return "Page";

  try {
    const { pathname } = new URL(href, "http://localhost");
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length === 0) return "Page";

    if (segments[0] === "admin" && segments[1]) {
      return ADMIN_SUBPATH_ENTITY_LABELS[segments[1]] ?? titleCaseWords(segments[1]);
    }

    const first = segments[0];
    if (PATH_SEGMENT_ENTITY_LABELS[first]) {
      return PATH_SEGMENT_ENTITY_LABELS[first];
    }

    return titleCaseWords(first);
  } catch {
    return "Page";
  }
}

export function navigationEntityLabelFromAnchor(anchor: HTMLAnchorElement): string {
  const dataLabel = anchor.getAttribute("data-nav-label")?.trim();
  if (dataLabel) return pluralTitleCaseEntityLabel(dataLabel);

  const ariaLabel = anchor.getAttribute("aria-label")?.trim();
  if (ariaLabel) return pluralTitleCaseEntityLabel(ariaLabel);

  const text = anchor.textContent?.replace(/\s+/g, " ").trim();
  if (text && text.length > 0 && text.length <= 48) {
    return pluralTitleCaseEntityLabel(text);
  }

  return navigationEntityLabelFromHref(anchor.getAttribute("href"));
}

export function buildNavigationLoadingText(entityLabel: string): string {
  const name = pluralTitleCaseEntityLabel(entityLabel);
  return `Loading ${name}...`;
}
