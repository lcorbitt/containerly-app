import { redirect } from "next/navigation";

/** Container workspaces live under `/containers/[id]`; the catalog is shipment-first at `/shipments`. */
export default function RequestsListRedirectPage() {
  redirect("/shipments");
}
