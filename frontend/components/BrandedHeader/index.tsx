"use client";

import {
  BRANDED_HEADER_CLASS,
  BRANDED_HEADER_EMBEDDED_CLASS,
  BRANDED_HEADER_EYEBROW_CLASS,
  BRANDED_HEADER_IDENTITY_CLASS,
  BRANDED_HEADER_INNER_CLASS,
  BRANDED_HEADER_LOGO_CLASS,
  BRANDED_HEADER_LOGO_FALLBACK_CLASS,
  BRANDED_HEADER_NAME_CLASS,
} from "./constants";
import type { BrandedHeaderProps } from "./types";
import { organizationInitials } from "./utils";

export function BrandedHeader({
  organizationName,
  organizationImageUrl,
  eyebrow = "Exporter Organization",
  actions,
  variant = "card",
}: BrandedHeaderProps) {
  const displayName = organizationName.trim() || "Shipment report";
  const initials = organizationInitials(displayName);
  const shellClass = variant === "embedded" ? BRANDED_HEADER_EMBEDDED_CLASS : BRANDED_HEADER_CLASS;

  return (
    <header className={shellClass}>
      <div className={BRANDED_HEADER_INNER_CLASS}>
        <div className={BRANDED_HEADER_IDENTITY_CLASS}>
          {organizationImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={organizationImageUrl}
              alt=""
              className={BRANDED_HEADER_LOGO_CLASS}
            />
          ) : (
            <div className={BRANDED_HEADER_LOGO_FALLBACK_CLASS} aria-hidden>
              {initials}
            </div>
          )}
          <div className="min-w-0">
            <h1 className={`${BRANDED_HEADER_NAME_CLASS}${eyebrow ? " mt-1" : ""}`}>
              {displayName}
            </h1>
            {eyebrow ? <p className={BRANDED_HEADER_EYEBROW_CLASS}>{eyebrow}</p> : null}
          </div>
        </div>
        {actions ? <div className="flex shrink-0 items-center">{actions}</div> : null}
      </div>
    </header>
  );
}

export type { BrandedHeaderProps } from "./types";
