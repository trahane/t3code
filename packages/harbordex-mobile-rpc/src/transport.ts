import { Cause, Effect, Exit, ManagedRuntime, Scope, Stream } from "effect";
import { RpcClient } from "effect/unstable/rpc";

import {
  createHarbordexRpcProtocolLayer,
  makeWsRpcProtocolClient,
  type CreateHarbordexRpcProtocolLayerOptions,
  type WsRpcProtocolClient,
} from "./protocol.ts";

interface TransportSession {
  readonly clientPromise: Promise<WsRpcProtocolClient>;
  readonly clientScope: Scope.Closeable;
  readonly runtime: ManagedRuntime.ManagedRuntime<RpcClient.Protocol, never>;
}

const NOOP: () => void = () => undefined;

export class HarbordexMobileWsTransport {
  private readonly protocolOptions: CreateHarbordexRpcProtocolLayerOptions;
  private disposed = false;
  private session: TransportSession;

  constructor(options: CreateHarbordexRpcProtocolLayerOptions) {
    this.protocolOptions = options;
    this.session = this.createSession();
  }

  async request<TSuccess>(
    execute: (client: WsRpcProtocolClient) => Effect.Effect<TSuccess, Error, never>,
  ): Promise<TSuccess> {
    if (this.disposed) {
      throw new Error("Transport disposed");
    }

    const session = this.session;
    const client = await session.clientPromise;
    return await session.runtime.runPromise(Effect.suspend(() => execute(client)));
  }

  subscribe<TValue>(
    connect: (client: WsRpcProtocolClient) => Stream.Stream<TValue, Error, never>,
    listener: (value: TValue) => void,
  ): () => void {
    if (this.disposed) {
      return NOOP;
    }

    const session = this.session;
    const cancel = session.runtime.runCallback(
      Effect.promise(() => session.clientPromise).pipe(
        Effect.flatMap((client) =>
          Stream.runForEach(connect(client), (value) =>
            Effect.sync(() => {
              try {
                listener(value);
              } catch {
                // Swallow listener errors so the stream can stay active.
              }
            }),
          ),
        ),
      ),
      {
        onExit: (exit) => {
          if (Exit.isFailure(exit)) {
            const error = Cause.squash(exit.cause);
            console.warn("Harbordex mobile RPC stream closed", { error });
          }
        },
      },
    );

    return () => {
      cancel();
    };
  }

  async reconnect(): Promise<void> {
    if (this.disposed) {
      throw new Error("Transport disposed");
    }

    const previous = this.session;
    this.session = this.createSession();
    await this.closeSession(previous);
  }

  async dispose(): Promise<void> {
    if (this.disposed) {
      return;
    }
    this.disposed = true;
    await this.closeSession(this.session);
  }

  private closeSession(session: TransportSession): Promise<void> {
    return session.runtime
      .runPromise(Scope.close(session.clientScope, Exit.void))
      .finally(() => session.runtime.dispose());
  }

  private createSession(): TransportSession {
    const runtime = ManagedRuntime.make(createHarbordexRpcProtocolLayer(this.protocolOptions));
    const clientScope = runtime.runSync(Scope.make());
    return {
      runtime,
      clientScope,
      clientPromise: runtime.runPromise(Scope.provide(clientScope)(makeWsRpcProtocolClient)),
    };
  }
}
