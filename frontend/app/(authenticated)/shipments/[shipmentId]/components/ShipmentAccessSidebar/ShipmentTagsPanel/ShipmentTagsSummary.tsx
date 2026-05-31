"use client";

import { SHIPMENT_TAG_CHIP_CLASS } from "./constants";
import { SIDEBAR_SETTINGS_EMPTY_CLASS } from "../ShipmentSidebarSettingsRow/constants";

export function ShipmentTagsSummary({ tags }: { tags: string[] }) {
  if (tags.length === 0) {
    return <p className={SIDEBAR_SETTINGS_EMPTY_CLASS}>None yet</p>;
  }

  return (
    <ul className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <li key={tag}>
          <span className={SHIPMENT_TAG_CHIP_CLASS} title={tag}>
            <span className="max-w-32 truncate">{tag}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
