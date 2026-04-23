import { HARBORDEX_BRANDING } from "@t3tools/harbordex-runtime";
import {
  bootstrapRemoteMobileSession,
  createHarbordexMobileRpcClient,
  resolveRemotePairingTarget,
  type HarbordexMobileRpcClient,
} from "@t3tools/harbordex-mobile-rpc";
import type { AuthBearerBootstrapResult } from "@t3tools/contracts";

export interface MobilePairAndConnectInput {
  readonly pairingUrl?: string;
  readonly host?: string;
  readonly pairingCode?: string;
  readonly fallbackOrigin?: string;
  readonly fetchImpl?: typeof fetch;
  readonly webSocketFactory?: (socketUrl: string, protocols?: string | string[]) => WebSocket;
}

export interface MobilePairAndConnectResult {
  readonly client: HarbordexMobileRpcClient;
  readonly bearerToken: string;
  readonly wsUrl: string;
  readonly role: "owner" | "client";
  readonly expiresAt: AuthBearerBootstrapResult["expiresAt"];
}

export async function pairAndConnectMobile(
  input: MobilePairAndConnectInput,
): Promise<MobilePairAndConnectResult> {
  const target = resolveRemotePairingTarget({
    ...(input.pairingUrl ? { pairingUrl: input.pairingUrl } : {}),
    ...(input.host ? { host: input.host } : {}),
    ...(input.pairingCode ? { pairingCode: input.pairingCode } : {}),
    ...(input.fallbackOrigin ? { fallbackOrigin: input.fallbackOrigin } : {}),
  });

  const bootstrap = await bootstrapRemoteMobileSession({
    httpBaseUrl: target.httpBaseUrl,
    wsBaseUrl: target.wsBaseUrl,
    credential: target.credential,
    ...(input.fetchImpl ? { transport: { fetchImpl: input.fetchImpl } } : {}),
  });

  const client = createHarbordexMobileRpcClient({
    socketUrl: bootstrap.wsUrl,
    ...(input.webSocketFactory ? { webSocketFactory: input.webSocketFactory } : {}),
  });

  return {
    client,
    bearerToken: bootstrap.bearerToken,
    wsUrl: bootstrap.wsUrl,
    role: bootstrap.role,
    expiresAt: bootstrap.expiresAt,
  };
}

export const MOBILE_BRANDING = HARBORDEX_BRANDING;
