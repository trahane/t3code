import type {
  AuthBearerBootstrapResult,
  AuthSessionState,
  AuthWebSocketTokenResult,
  ExecutionEnvironmentDescriptor,
} from "@t3tools/contracts";

export class RemoteEnvironmentAuthHttpError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "RemoteEnvironmentAuthHttpError";
    this.status = status;
  }
}

export interface RemoteAuthTransportOptions {
  readonly fetchImpl?: typeof fetch;
}

const MOBILE_DEVICE_HINT_HEADER = "x-harbordex-client-device";

function remoteEndpointUrl(httpBaseUrl: string, pathname: string): string {
  const url = new URL(httpBaseUrl);
  url.pathname = pathname;
  url.search = "";
  url.hash = "";
  return url.toString();
}

async function readRemoteAuthErrorMessage(
  response: Response,
  fallbackMessage: string,
): Promise<string> {
  const text = await response.text();
  if (!text) {
    return fallbackMessage;
  }

  try {
    const parsed = JSON.parse(text) as { readonly error?: string };
    if (typeof parsed.error === "string" && parsed.error.length > 0) {
      return parsed.error;
    }
  } catch {
    // Fall back to raw text.
  }

  return text;
}

function resolveFetchImpl(fetchImpl?: typeof fetch): typeof fetch {
  if (fetchImpl) {
    return fetchImpl;
  }

  if (typeof globalThis.fetch === "function") {
    return globalThis.fetch.bind(globalThis);
  }

  throw new Error("No fetch implementation available. Provide fetchImpl explicitly.");
}

async function fetchRemoteJson<T>(input: {
  readonly httpBaseUrl: string;
  readonly pathname: string;
  readonly method?: "GET" | "POST";
  readonly bearerToken?: string;
  readonly body?: unknown;
  readonly headers?: Record<string, string>;
  readonly fetchImpl?: typeof fetch;
}): Promise<T> {
  const requestUrl = remoteEndpointUrl(input.httpBaseUrl, input.pathname);
  const fetcher = resolveFetchImpl(input.fetchImpl);

  let response: Response;
  try {
    response = await fetcher(requestUrl, {
      method: input.method ?? "GET",
      headers: {
        ...(input.body !== undefined ? { "content-type": "application/json" } : {}),
        ...(input.bearerToken ? { authorization: `Bearer ${input.bearerToken}` } : {}),
        ...(input.headers ?? {}),
      },
      ...(input.body !== undefined ? { body: JSON.stringify(input.body) } : {}),
    });
  } catch (error) {
    throw new Error(
      `Failed to fetch remote auth endpoint ${requestUrl} (${(error as Error).message}).`,
      { cause: error },
    );
  }

  if (!response.ok) {
    throw new RemoteEnvironmentAuthHttpError(
      await readRemoteAuthErrorMessage(
        response,
        `Remote auth request failed (${response.status}).`,
      ),
      response.status,
    );
  }

  return (await response.json()) as T;
}

export async function bootstrapRemoteBearerSession(input: {
  readonly httpBaseUrl: string;
  readonly credential: string;
  readonly transport?: RemoteAuthTransportOptions;
}): Promise<AuthBearerBootstrapResult> {
  const fetchImpl = input.transport?.fetchImpl;
  return fetchRemoteJson<AuthBearerBootstrapResult>({
    httpBaseUrl: input.httpBaseUrl,
    pathname: "/api/auth/bootstrap/bearer",
    method: "POST",
    body: {
      credential: input.credential,
    },
    headers: {
      [MOBILE_DEVICE_HINT_HEADER]: "mobile",
    },
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}

export async function fetchRemoteSessionState(input: {
  readonly httpBaseUrl: string;
  readonly bearerToken: string;
  readonly transport?: RemoteAuthTransportOptions;
}): Promise<AuthSessionState> {
  const fetchImpl = input.transport?.fetchImpl;
  return fetchRemoteJson<AuthSessionState>({
    httpBaseUrl: input.httpBaseUrl,
    pathname: "/api/auth/session",
    bearerToken: input.bearerToken,
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}

export async function fetchRemoteEnvironmentDescriptor(input: {
  readonly httpBaseUrl: string;
  readonly transport?: RemoteAuthTransportOptions;
}): Promise<ExecutionEnvironmentDescriptor> {
  const fetchImpl = input.transport?.fetchImpl;
  return fetchRemoteJson<ExecutionEnvironmentDescriptor>({
    httpBaseUrl: input.httpBaseUrl,
    pathname: "/.well-known/t3/environment",
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}

export async function issueRemoteWebSocketToken(input: {
  readonly httpBaseUrl: string;
  readonly bearerToken: string;
  readonly transport?: RemoteAuthTransportOptions;
}): Promise<AuthWebSocketTokenResult> {
  const fetchImpl = input.transport?.fetchImpl;
  return fetchRemoteJson<AuthWebSocketTokenResult>({
    httpBaseUrl: input.httpBaseUrl,
    pathname: "/api/auth/ws-token",
    method: "POST",
    bearerToken: input.bearerToken,
    ...(fetchImpl ? { fetchImpl } : {}),
  });
}

export async function resolveRemoteWebSocketConnectionUrl(input: {
  readonly wsBaseUrl: string;
  readonly httpBaseUrl: string;
  readonly bearerToken: string;
  readonly transport?: RemoteAuthTransportOptions;
}): Promise<string> {
  const issued = await issueRemoteWebSocketToken({
    httpBaseUrl: input.httpBaseUrl,
    bearerToken: input.bearerToken,
    ...(input.transport ? { transport: input.transport } : {}),
  });
  const url = new URL(input.wsBaseUrl);
  url.pathname = "/";
  url.search = "";
  url.hash = "";
  url.searchParams.set("wsToken", issued.token);
  return url.toString();
}

export async function bootstrapRemoteMobileSession(input: {
  readonly httpBaseUrl: string;
  readonly wsBaseUrl: string;
  readonly credential: string;
  readonly transport?: RemoteAuthTransportOptions;
}): Promise<{
  readonly bearerToken: string;
  readonly wsUrl: string;
  readonly role: AuthBearerBootstrapResult["role"];
  readonly expiresAt: AuthBearerBootstrapResult["expiresAt"];
}> {
  const bootstrap = await bootstrapRemoteBearerSession({
    httpBaseUrl: input.httpBaseUrl,
    credential: input.credential,
    ...(input.transport ? { transport: input.transport } : {}),
  });

  const wsUrl = await resolveRemoteWebSocketConnectionUrl({
    wsBaseUrl: input.wsBaseUrl,
    httpBaseUrl: input.httpBaseUrl,
    bearerToken: bootstrap.sessionToken,
    ...(input.transport ? { transport: input.transport } : {}),
  });

  return {
    bearerToken: bootstrap.sessionToken,
    wsUrl,
    role: bootstrap.role,
    expiresAt: bootstrap.expiresAt,
  };
}
