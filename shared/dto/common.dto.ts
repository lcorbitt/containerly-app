/** Standard error envelope returned by all Edge Function handlers. */
export type ErrorResponse = {
  error: string;
};

/** Discriminated result helpers for frontend service wrappers. */
export type ServiceOk<T> = { ok: true } & T;
export type ServiceErr = { ok: false; status: number; error: string };
export type ServiceResult<T> = ServiceOk<T> | ServiceErr;
