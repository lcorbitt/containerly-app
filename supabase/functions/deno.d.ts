/** Ambient types for Edge Functions so the editor recognizes Deno globals (runtime is Deno). */
declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
  serve(
    handler: (request: Request) => Response | Promise<Response>,
  ): unknown;
};
