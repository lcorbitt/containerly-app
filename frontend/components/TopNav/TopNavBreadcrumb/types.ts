export interface BreadcrumbSegment {
  label: string;
  href: string;
}

export interface ShipmentOperatorSubTabRoute {
  kind: "shipment-operator";
  shipmentId: string;
  href: string;
}

export interface ShipmentHubSubTabRoute {
  kind: "shipment-hub";
  shipmentId: string;
  href: string;
}

export interface ContainerSubTabRoute {
  kind: "container";
  containerId: string;
  href: string;
}

export type SubTabRoute =
  | ShipmentOperatorSubTabRoute
  | ShipmentHubSubTabRoute
  | ContainerSubTabRoute;

export interface TopNavBreadcrumbProps {
  org: BreadcrumbSegment | null;
  tab: BreadcrumbSegment | null;
  /** Shipment identifier (e.g. order number) between tab and leaf. */
  subTabLabel: string | null;
  /** When set with `leafLabel`, sub-tab renders as a link. */
  subTabHref?: string | null;
  /** Final crumb (e.g. "Customer Portal" on `/shipments/hub/[id]`). */
  leafLabel?: string | null;
}
