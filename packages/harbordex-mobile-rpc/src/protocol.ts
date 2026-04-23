import { WsRpcGroup } from "@t3tools/contracts";
import { Effect, Layer } from "effect";
import { RpcClient, RpcSerialization } from "effect/unstable/rpc";
import * as Socket from "effect/unstable/socket/Socket";

export const makeWsRpcProtocolClient = RpcClient.make(WsRpcGroup);
type RpcClientFactory = typeof makeWsRpcProtocolClient;
export type WsRpcProtocolClient =
  RpcClientFactory extends Effect.Effect<infer Client, any, any> ? Client : never;

export interface CreateHarbordexRpcProtocolLayerOptions {
  readonly socketUrl: string;
  readonly webSocketFactory?: (socketUrl: string, protocols?: string | string[]) => WebSocket;
}

function resolveWsRpcSocketUrl(rawUrl: string): string {
  const resolved = new URL(rawUrl);
  if (resolved.protocol !== "ws:" && resolved.protocol !== "wss:") {
    throw new Error(`Unsupported websocket transport URL protocol: ${resolved.protocol}`);
  }

  resolved.pathname = "/ws";
  return resolved.toString();
}

function defaultWebSocketFactory(socketUrl: string, protocols?: string | string[]): WebSocket {
  if (typeof globalThis.WebSocket !== "function") {
    throw new Error("No global WebSocket constructor found. Provide webSocketFactory explicitly.");
  }
  return new globalThis.WebSocket(socketUrl, protocols);
}

export function createHarbordexRpcProtocolLayer(options: CreateHarbordexRpcProtocolLayerOptions) {
  const socketUrl = resolveWsRpcSocketUrl(options.socketUrl);
  const socketFactory = options.webSocketFactory ?? defaultWebSocketFactory;

  const webSocketConstructorLayer = Layer.succeed(Socket.WebSocketConstructor, (url, protocols) =>
    socketFactory(url, protocols),
  );

  const socketLayer = Socket.layerWebSocket(socketUrl).pipe(
    Layer.provide(webSocketConstructorLayer),
  );
  const protocolLayer = Layer.effect(RpcClient.Protocol, RpcClient.makeProtocolSocket());

  return protocolLayer.pipe(Layer.provide(Layer.mergeAll(socketLayer, RpcSerialization.layerJson)));
}
