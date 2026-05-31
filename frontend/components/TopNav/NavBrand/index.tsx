import Link from "next/link";
import Image from "next/image";
import { NAV_BRAND_CLASS } from "./constants";
import type { NavBrandProps } from "./types";

export function NavBrand({ href, variant }: NavBrandProps) {
  return (
    <Link href={href} className={NAV_BRAND_CLASS[variant]}>
      <Image src="/containerly-logo.png" alt="Containerly" width={70} height={70} />
    </Link>
  );
}
