import type { AuthPairingCredentialResult, AuthSessionState } from "@t3tools/contracts";

import {
  createServerPairingCredential,
  fetchSessionState,
  revokeOtherServerClientSessions,
  revokeServerClientSession,
  revokeServerPairingLink,
  type ServerClientSessionRecord,
} from "~/environments/primary";

export interface ConnectionsAccessProvider {
  fetchSessionState: () => Promise<AuthSessionState>;
  createPairingCredential: (label?: string) => Promise<AuthPairingCredentialResult>;
  revokePairingLink: (id: string) => Promise<void>;
  revokeClientSession: (sessionId: ServerClientSessionRecord["sessionId"]) => Promise<void>;
  revokeOtherClientSessions: () => Promise<number>;
}

export function createDefaultConnectionsAccessProvider(): ConnectionsAccessProvider {
  return {
    fetchSessionState,
    createPairingCredential: createServerPairingCredential,
    revokePairingLink: revokeServerPairingLink,
    revokeClientSession: revokeServerClientSession,
    revokeOtherClientSessions: revokeOtherServerClientSessions,
  };
}
