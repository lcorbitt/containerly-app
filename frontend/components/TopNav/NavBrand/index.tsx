"use client";

import Link from "next/link";
import { memo } from "react";
import { NAV_BRAND_CLASS, NAV_BRAND_TEXT_CLASS } from "./constants";
import { NavBrandLogo } from "./NavBrandLogo";
import type { NavBrandProps } from "./types";

export const NavBrand = memo(function NavBrand({ href, variant }: NavBrandProps) {
  return (
    <Link href={href} className={NAV_BRAND_CLASS[variant]} aria-label="Containerly home">
      <div className="flex shrink-0 items-center gap-2">
        <NavBrandLogo />
        {variant === "marketing" ? (
          <span className={NAV_BRAND_TEXT_CLASS[variant]}>Containerly</span>
        ) : null}
      </div>
    </Link>
  );
});
