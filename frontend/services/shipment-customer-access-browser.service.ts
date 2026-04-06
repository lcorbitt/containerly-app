import { createClient } from "@/lib/supabase/client";

export async function updateShipmentCustomerAccessSettings(input: {
  accessId: string;
  visibilitySettings: Record<string, boolean>;
  operatorOverrides: Record<string, string>;
}): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("shipment_customer_access")
    .update({
      visibility_settings: input.visibilitySettings,
      operator_overrides: input.operatorOverrides,
    })
    .eq("id", input.accessId);
  if (error) throw new Error(error.message);
}
