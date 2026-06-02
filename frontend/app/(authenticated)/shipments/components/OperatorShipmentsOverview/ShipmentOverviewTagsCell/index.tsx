import {
  SHIPMENT_OVERVIEW_TAGS_CHIP_CLASS,
  SHIPMENT_OVERVIEW_TAGS_EMPTY_CLASS,
  SHIPMENT_OVERVIEW_TAGS_FILTER_BTN_CLASS,
  SHIPMENT_OVERVIEW_TAGS_SCROLL_CLASS,
} from "./constants";
import type { ShipmentOverviewTagsCellProps } from "./types";

export function ShipmentOverviewTagsCell({
  tags,
  activeTagFilter,
  onTagFilter,
}: ShipmentOverviewTagsCellProps) {
  if (tags.length === 0) {
    return <span className={SHIPMENT_OVERVIEW_TAGS_EMPTY_CLASS}>—</span>;
  }

  return (
    <div
      className={SHIPMENT_OVERVIEW_TAGS_SCROLL_CLASS}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      {tags.map((tag) => {
        const isActive = activeTagFilter?.toLowerCase() === tag.toLowerCase();
        return (
          <button
            key={tag}
            type="button"
            title={isActive ? `Clear filter: ${tag}` : `Filter by tag: ${tag}`}
            className={isActive ? SHIPMENT_OVERVIEW_TAGS_FILTER_BTN_CLASS : SHIPMENT_OVERVIEW_TAGS_CHIP_CLASS}
            onClick={(e) => {
              e.stopPropagation();
              onTagFilter(isActive ? null : tag);
            }}
          >
            {tag}
          </button>
        );
      })}
    </div>
  );
}
