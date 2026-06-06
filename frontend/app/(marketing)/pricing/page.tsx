import type { Metadata } from "next";
import { PricingPage } from "./components/PricingPage";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, seat-based pricing for freight brokers, 3PLs, and export teams. Start free, upgrade as you scale shipment communication.",
};

export default function Pricing() {
  return <PricingPage />;
}
