import Link from "next/link";
import Image from "next/image";
import { NAV_BRAND_CLASS } from "./constants";
import type { NavBrandProps } from "./types";

export function NavBrand({ href, variant }: NavBrandProps) {
  return (
    <Link href={href} className={NAV_BRAND_CLASS[variant]}>
      <div className="flex items-center gap-2">
        <Image src="/containerly-logo.png" alt="Containerly" width={70} height={70} />
        <span className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">Containerly</span>
      </div>
    </Link>
  );
}
