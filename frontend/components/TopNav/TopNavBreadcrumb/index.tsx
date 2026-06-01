import Link from "next/link";
import {
  TOP_NAV_BREADCRUMB_CURRENT_CLASS,
  TOP_NAV_BREADCRUMB_LINK_CLASS,
  TOP_NAV_BREADCRUMB_LIST_CLASS,
  TOP_NAV_BREADCRUMB_SEPARATOR_CLASS,
} from "./constants";
import type { TopNavBreadcrumbProps } from "./types";

function BreadcrumbSeparator() {
  return (
    <li className={TOP_NAV_BREADCRUMB_SEPARATOR_CLASS} aria-hidden>
      /
    </li>
  );
}

export function TopNavBreadcrumb({
  org,
  tab,
  subTabLabel,
  subTabHref,
  leafLabel,
}: TopNavBreadcrumbProps) {
  if (!org && !tab && !subTabLabel && !leafLabel) return null;

  const hasLeaf = Boolean(leafLabel?.trim());
  const subTabIsLink = hasLeaf && Boolean(subTabHref?.trim() && subTabLabel?.trim());

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className={TOP_NAV_BREADCRUMB_LIST_CLASS}>
        {org ? (
          <li className="min-w-0 truncate">
            {tab || subTabLabel || leafLabel ? (
              <Link href={org.href} className={TOP_NAV_BREADCRUMB_LINK_CLASS}>
                {org.label}
              </Link>
            ) : (
              <span aria-current="page" className={TOP_NAV_BREADCRUMB_CURRENT_CLASS}>
                {org.label}
              </span>
            )}
          </li>
        ) : null}

        {org && tab ? <BreadcrumbSeparator /> : null}

        {tab ? (
          <li className="min-w-0 truncate">
            {subTabLabel || leafLabel ? (
              <Link href={tab.href} className={TOP_NAV_BREADCRUMB_LINK_CLASS}>
                {tab.label}
              </Link>
            ) : (
              <span aria-current="page" className={TOP_NAV_BREADCRUMB_CURRENT_CLASS}>
                {tab.label}
              </span>
            )}
          </li>
        ) : null}

        {tab && subTabLabel ? <BreadcrumbSeparator /> : null}

        {subTabLabel ? (
          <li className="min-w-0 truncate">
            {subTabIsLink ? (
              <Link href={subTabHref!} className={TOP_NAV_BREADCRUMB_LINK_CLASS}>
                {subTabLabel}
              </Link>
            ) : hasLeaf ? (
              <span className="truncate font-normal">{subTabLabel}</span>
            ) : (
              <span aria-current="page" className={TOP_NAV_BREADCRUMB_CURRENT_CLASS}>
                {subTabLabel}
              </span>
            )}
          </li>
        ) : null}

        {subTabLabel && leafLabel ? <BreadcrumbSeparator /> : null}

        {leafLabel ? (
          <li className={`min-w-0 truncate ${TOP_NAV_BREADCRUMB_CURRENT_CLASS}`} aria-current="page">
            {leafLabel}
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
