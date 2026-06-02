export interface ShipmentOverviewTagsCellProps {
  tags: string[];
  activeTagFilter: string | null;
  onTagFilter: (tag: string | null) => void;
}
