import {
  ORCHESTRATION_WS_METHODS,
  type ClientOrchestrationCommand,
  type DispatchResult,
  type OrchestrationGetFullThreadDiffInput,
  type OrchestrationGetFullThreadDiffResult,
  type OrchestrationGetTurnDiffInput,
  type OrchestrationGetTurnDiffResult,
  type OrchestrationShellStreamItem,
  type OrchestrationSubscribeThreadInput,
  type OrchestrationThreadStreamItem,
} from "@t3tools/contracts";

import { createCommandId, nowIsoString } from "./commands.ts";
import { type CreateHarbordexRpcProtocolLayerOptions } from "./protocol.ts";
import { HarbordexMobileWsTransport } from "./transport.ts";

type ThreadTurnStartCommand = Extract<
  ClientOrchestrationCommand,
  { readonly type: "thread.turn.start" }
>;
type ThreadTurnInterruptCommand = Extract<
  ClientOrchestrationCommand,
  { readonly type: "thread.turn.interrupt" }
>;
type ThreadApprovalRespondCommand = Extract<
  ClientOrchestrationCommand,
  { readonly type: "thread.approval.respond" }
>;
type ThreadUserInputRespondCommand = Extract<
  ClientOrchestrationCommand,
  { readonly type: "thread.user-input.respond" }
>;

function asThreadTurnStartCommand(command: ThreadTurnStartCommand): ThreadTurnStartCommand {
  return command;
}

function asThreadTurnInterruptCommand(
  command: ThreadTurnInterruptCommand,
): ThreadTurnInterruptCommand {
  return command;
}

function asThreadApprovalRespondCommand(
  command: ThreadApprovalRespondCommand,
): ThreadApprovalRespondCommand {
  return command;
}

function asThreadUserInputRespondCommand(
  command: ThreadUserInputRespondCommand,
): ThreadUserInputRespondCommand {
  return command;
}

export interface StartTurnInput {
  readonly threadId: string;
  readonly text: string;
  readonly attachments?: ThreadTurnStartCommand["message"]["attachments"];
  readonly commandId?: string;
  readonly messageId?: string;
  readonly modelSelection?: ThreadTurnStartCommand["modelSelection"];
  readonly runtimeMode?: ThreadTurnStartCommand["runtimeMode"];
  readonly interactionMode?: ThreadTurnStartCommand["interactionMode"];
  readonly bootstrap?: ThreadTurnStartCommand["bootstrap"];
  readonly sourceProposedPlan?: ThreadTurnStartCommand["sourceProposedPlan"];
  readonly titleSeed?: ThreadTurnStartCommand["titleSeed"];
  readonly createdAt?: string;
}

export interface InterruptTurnInput {
  readonly threadId: string;
  readonly turnId?: string;
  readonly commandId?: string;
  readonly createdAt?: string;
}

export interface ApprovalRespondInput {
  readonly threadId: string;
  readonly requestId: string;
  readonly decision: ThreadApprovalRespondCommand["decision"];
  readonly commandId?: string;
  readonly createdAt?: string;
}

export interface StructuredInputRespondInput {
  readonly threadId: string;
  readonly requestId: string;
  readonly answers: ThreadUserInputRespondCommand["answers"];
  readonly commandId?: string;
  readonly createdAt?: string;
}

export class HarbordexMobileRpcClient {
  private readonly transport: HarbordexMobileWsTransport;

  constructor(protocolOptions: CreateHarbordexRpcProtocolLayerOptions) {
    this.transport = new HarbordexMobileWsTransport(protocolOptions);
  }

  async dispose(): Promise<void> {
    await this.transport.dispose();
  }

  async reconnect(): Promise<void> {
    await this.transport.reconnect();
  }

  async dispatchCommand(command: ClientOrchestrationCommand): Promise<DispatchResult> {
    return this.transport.request((client) =>
      client[ORCHESTRATION_WS_METHODS.dispatchCommand](command),
    );
  }

  async getTurnDiff(input: OrchestrationGetTurnDiffInput): Promise<OrchestrationGetTurnDiffResult> {
    return this.transport.request((client) => client[ORCHESTRATION_WS_METHODS.getTurnDiff](input));
  }

  async getFullThreadDiff(
    input: OrchestrationGetFullThreadDiffInput,
  ): Promise<OrchestrationGetFullThreadDiffResult> {
    return this.transport.request((client) =>
      client[ORCHESTRATION_WS_METHODS.getFullThreadDiff](input),
    );
  }

  subscribeThread(
    input: OrchestrationSubscribeThreadInput,
    listener: (item: OrchestrationThreadStreamItem) => void,
  ): () => void {
    return this.transport.subscribe(
      (client) => client[ORCHESTRATION_WS_METHODS.subscribeThread](input),
      listener,
    );
  }

  subscribeShell(listener: (item: OrchestrationShellStreamItem) => void): () => void {
    return this.transport.subscribe(
      (client) => client[ORCHESTRATION_WS_METHODS.subscribeShell]({}),
      listener,
    );
  }

  async startTurn(input: StartTurnInput): Promise<DispatchResult> {
    const command = asThreadTurnStartCommand({
      type: "thread.turn.start",
      commandId: (input.commandId ??
        createCommandId("turn")) as ThreadTurnStartCommand["commandId"],
      threadId: input.threadId as ThreadTurnStartCommand["threadId"],
      message: {
        messageId: (input.messageId ??
          createCommandId("msg")) as ThreadTurnStartCommand["message"]["messageId"],
        role: "user",
        text: input.text,
        attachments: input.attachments ?? [],
      },
      ...(input.modelSelection ? { modelSelection: input.modelSelection } : {}),
      ...(input.titleSeed ? { titleSeed: input.titleSeed } : {}),
      runtimeMode: input.runtimeMode ?? "full-access",
      interactionMode: input.interactionMode ?? "default",
      ...(input.bootstrap ? { bootstrap: input.bootstrap } : {}),
      ...(input.sourceProposedPlan ? { sourceProposedPlan: input.sourceProposedPlan } : {}),
      createdAt: input.createdAt ?? nowIsoString(),
    });

    return this.dispatchCommand(command);
  }

  async interruptTurn(input: InterruptTurnInput): Promise<DispatchResult> {
    const command = asThreadTurnInterruptCommand({
      type: "thread.turn.interrupt",
      commandId: (input.commandId ??
        createCommandId("interrupt")) as ThreadTurnInterruptCommand["commandId"],
      threadId: input.threadId as ThreadTurnInterruptCommand["threadId"],
      ...(input.turnId ? { turnId: input.turnId as ThreadTurnInterruptCommand["turnId"] } : {}),
      createdAt: input.createdAt ?? nowIsoString(),
    });

    return this.dispatchCommand(command);
  }

  async respondApproval(input: ApprovalRespondInput): Promise<DispatchResult> {
    const command = asThreadApprovalRespondCommand({
      type: "thread.approval.respond",
      commandId: (input.commandId ??
        createCommandId("approval")) as ThreadApprovalRespondCommand["commandId"],
      threadId: input.threadId as ThreadApprovalRespondCommand["threadId"],
      requestId: input.requestId as ThreadApprovalRespondCommand["requestId"],
      decision: input.decision,
      createdAt: input.createdAt ?? nowIsoString(),
    });

    return this.dispatchCommand(command);
  }

  async respondStructuredInput(input: StructuredInputRespondInput): Promise<DispatchResult> {
    const command = asThreadUserInputRespondCommand({
      type: "thread.user-input.respond",
      commandId: (input.commandId ??
        createCommandId("user-input")) as ThreadUserInputRespondCommand["commandId"],
      threadId: input.threadId as ThreadUserInputRespondCommand["threadId"],
      requestId: input.requestId as ThreadUserInputRespondCommand["requestId"],
      answers: input.answers,
      createdAt: input.createdAt ?? nowIsoString(),
    });

    return this.dispatchCommand(command);
  }
}

export function createHarbordexMobileRpcClient(
  protocolOptions: CreateHarbordexRpcProtocolLayerOptions,
): HarbordexMobileRpcClient {
  return new HarbordexMobileRpcClient(protocolOptions);
}
