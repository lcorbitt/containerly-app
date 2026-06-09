import Image from "next/image";
import Link from "next/link";
import navLogoImage from "@/components/TopNav/NavBrand/assets/containerly-logo-nav.png";
import { withoutPricingLinks } from "@/lib/pricing-page";
import { SITE_NAME } from "@/lib/site-metadata";
import {
  MARKETING_FOOTER_BOTTOM_CLASS,
  MARKETING_FOOTER_BRAND_NAME_CLASS,
  MARKETING_FOOTER_CLASS,
  MARKETING_FOOTER_COLUMN_TITLE_CLASS,
  MARKETING_FOOTER_GRID_CLASS,
  MARKETING_FOOTER_INNER_CLASS,
  MARKETING_FOOTER_LEGAL_LINK_CLASS,
  MARKETING_FOOTER_LEGAL_LINKS,
  MARKETING_FOOTER_LINK_CLASS,
  MARKETING_FOOTER_LINK_GROUPS,
  MARKETING_FOOTER_LINK_LIST_CLASS,
  MARKETING_FOOTER_LOGO_CLASS,
  MARKETING_FOOTER_TAGLINE,
  MARKETING_FOOTER_TAGLINE_CLASS,
} from "./constants";

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className={MARKETING_FOOTER_CLASS}>
      <div className={MARKETING_FOOTER_INNER_CLASS}>
        <div className={MARKETING_FOOTER_GRID_CLASS}>
          <div className="sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-flex items-center gap-2.5" aria-label={`${SITE_NAME} home`}>
              <Image
                src={navLogoImage}
                alt=""
                width={navLogoImage.width}
                height={navLogoImage.height}
                className={MARKETING_FOOTER_LOGO_CLASS}
                draggable={false}
              />
              <span className={MARKETING_FOOTER_BRAND_NAME_CLASS}>{SITE_NAME}</span>
            </Link>
            <p className={MARKETING_FOOTER_TAGLINE_CLASS}>{MARKETING_FOOTER_TAGLINE}</p>
          </div>

          {MARKETING_FOOTER_LINK_GROUPS.map((group) => (
            <div key={group.title}>
              <h2 className={MARKETING_FOOTER_COLUMN_TITLE_CLASS}>{group.title}</h2>
              <ul className={MARKETING_FOOTER_LINK_LIST_CLASS}>
                {withoutPricingLinks(group.links).map((link) => (
                  <li key={`${group.title}-${link.label}`}>
                    <Link href={link.href} className={MARKETING_FOOTER_LINK_CLASS}>
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className={MARKETING_FOOTER_BOTTOM_CLASS}>
          <p>{`© ${year} ${SITE_NAME}. All rights reserved.`}</p>
          {MARKETING_FOOTER_LEGAL_LINKS.map((link) => (
            <Link key={link.label} href={link.href} className={MARKETING_FOOTER_LEGAL_LINK_CLASS}>
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
