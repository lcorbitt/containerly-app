"use client";

import Image from "next/image";
import { memo } from "react";
import navLogoImage from "../assets/containerly-logo-nav.png";
import { NAV_BRAND_LOGO_CLASS, NAV_BRAND_LOGO_SIZES } from "../constants";

/** Stable logo subtree — memoized so top-nav state updates do not re-render the image. */
export const NavBrandLogo = memo(function NavBrandLogo() {
  return (
    <Image
      src={navLogoImage}
      alt="Containerly"
      width={navLogoImage.width}
      height={navLogoImage.height}
      priority
      fetchPriority="high"
      sizes={NAV_BRAND_LOGO_SIZES}
      quality={90}
      className={NAV_BRAND_LOGO_CLASS}
      draggable={false}
    />
  );
});
