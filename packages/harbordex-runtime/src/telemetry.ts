import { Effect } from "effect";

export interface HarbordexTelemetryProvider {
  readonly record: (
    event: string,
    properties?: Readonly<Record<string, unknown>>,
  ) => Effect.Effect<void, never>;
  readonly flush: Effect.Effect<void, never>;
}

export function createNoopHarbordexTelemetryProvider(): HarbordexTelemetryProvider {
  return {
    record: () => Effect.void,
    flush: Effect.void,
  };
}
