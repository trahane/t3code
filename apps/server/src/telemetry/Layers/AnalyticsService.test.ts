import { assert, it } from "@effect/vitest";
import { Effect } from "effect";

import { AnalyticsService } from "../Services/AnalyticsService.ts";
import { AnalyticsServiceLayerLive } from "./AnalyticsService.ts";

it.effect("AnalyticsService no-op provider stays compatible with runtime call sites", () =>
  Effect.gen(function* () {
    const analytics = yield* AnalyticsService;

    yield* analytics.record("provider.turn.sent", { index: 1 });
    yield* analytics.record("provider.turn.interrupted", { reason: "manual" });
    yield* analytics.flush;

    assert.equal(true, true);
  }).pipe(Effect.provide(AnalyticsServiceLayerLive)),
);
