import Link from "next/link";
import {
  TOP_NAV_BREADCRUMB_CURRENT_CLASS,
  TOP_NAV_BREADCRUMB_LINK_CLASS,
  TOP_NAV_BREADCRUMB_LIST_CLASS,
  TOP_NAV_BREADCRUMB_SEPARATOR_CLASS,
} from "./constants";
import type { TopNavBreadcrumbProps } from "./types";

export function TopNavBreadcrumb({ org, tab, subTabLabel }: TopNavBreadcrumbProps) {
  if (!org && !tab && !subTabLabel) return null;

  return (
    <nav aria-label="Breadcrumb" className="min-w-0">
      <ol className={TOP_NAV_BREADCRUMB_LIST_CLASS}>
        {org ? (
          <li className="min-w-0 truncate">
            {tab || subTabLabel ? (
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

        {org && tab ? (
          <li className={TOP_NAV_BREADCRUMB_SEPARATOR_CLASS} aria-hidden>
            /
          </li>
        ) : null}

        {tab ? (
          <li className="min-w-0 truncate">
            {subTabLabel ? (
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

        {tab && subTabLabel ? (
          <li className={TOP_NAV_BREADCRUMB_SEPARATOR_CLASS} aria-hidden>
            /
          </li>
        ) : null}

        {subTabLabel ? (
          <li className={`min-w-0 truncate ${TOP_NAV_BREADCRUMB_CURRENT_CLASS}`} aria-current="page">
            {subTabLabel}
          </li>
        ) : null}
      </ol>
    </nav>
  );
}
