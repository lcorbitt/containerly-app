import { corsHeaders } from "@services/utils";
import { handle } from "./handler.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  return handle(req);
});
