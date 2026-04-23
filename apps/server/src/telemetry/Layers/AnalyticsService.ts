/**
 * AnalyticsServiceLive - Harbordex runtime telemetry adapter.
 *
 * Harbordex v2 disables user tracking by default. We keep the analytics
 * contract alive for provider/session flows, then route calls through a
 * swappable Harbordex telemetry provider that is no-op out of the box.
 */

import { Effect, Layer } from "effect";
import { createNoopHarbordexTelemetryProvider } from "@t3tools/harbordex-runtime";

import { AnalyticsService } from "../Services/AnalyticsService.ts";

const makeAnalyticsService = Effect.sync(() => createNoopHarbordexTelemetryProvider());

export const AnalyticsServiceLayerLive = Layer.effect(AnalyticsService, makeAnalyticsService);
