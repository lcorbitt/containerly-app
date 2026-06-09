import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isPricingPageEnabled } from "@/lib/pricing-page";
import { PricingPage } from "./components/PricingPage";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, seat-based pricing for freight brokers, 3PLs, and export teams. Start free, upgrade as you scale shipment communication.",
};

export default function Pricing() {
  if (!isPricingPageEnabled()) {
    notFound();
  }

  return <PricingPage />;
}
