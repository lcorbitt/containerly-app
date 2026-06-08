import {
  buildNavigationLoadingText,
  navigationEntityLabelFromAnchor,
} from "./navigation-entity-label";

export type NavigationStartInput =
  | string
  | {
      label?: string;
      message?: string;
    };

export function resolveNavigationLoadingText(input?: NavigationStartInput): string | null {
  if (input == null) return null;

  if (typeof input === "string") {
    const trimmed = input.trim();
    return trimmed ? buildNavigationLoadingText(trimmed) : null;
  }

  const message = input.message?.trim();
  if (message) return message;

  const label = input.label?.trim();
  if (label) return buildNavigationLoadingText(label);

  return null;
}

export function navigationStartInputFromAnchor(anchor: HTMLAnchorElement): NavigationStartInput {
  const message = anchor.getAttribute("data-nav-message")?.trim();
  if (message) return { message };

  return navigationEntityLabelFromAnchor(anchor);
}
