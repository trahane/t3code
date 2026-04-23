import { execFile } from "node:child_process";
import { promisify } from "node:util";

import type {
  DesktopNetworkDiagnostics,
  DesktopServerExposureMode,
  DesktopTailscaleDiagnostics,
} from "@t3tools/contracts";

const execFileAsync = promisify(execFile);
const COMMAND_TIMEOUT_MS = 4_000;

type TailscaleStatusJson = {
  readonly BackendState?: string;
  readonly TailscaleIPs?: readonly string[];
  readonly Health?: readonly string[];
  readonly Self?: {
    readonly TailscaleIPs?: readonly string[];
    readonly Online?: boolean;
    readonly HostName?: string;
    readonly DNSName?: string;
  };
};

async function runCommand(command: string, args: readonly string[]) {
  try {
    const { stdout } = await execFileAsync(command, [...args], { timeout: COMMAND_TIMEOUT_MS });
    return {
      ok: true as const,
      stdout: String(stdout).trim(),
    };
  } catch {
    return {
      ok: false as const,
      stdout: "",
    };
  }
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function normalizeDnsName(value: unknown): string | null {
  const normalized = normalizeString(value);
  if (!normalized) {
    return null;
  }
  return normalized.endsWith(".") ? normalized.slice(0, -1) : normalized;
}

function parseVersion(output: string): string | null {
  const firstLine = output.split(/\r?\n/, 1)[0] ?? "";
  return normalizeString(firstLine);
}

function unavailableTailscaleDiagnostics(
  message: string,
  version: string | null,
): DesktopTailscaleDiagnostics {
  return {
    available: false,
    version,
    backendState: null,
    ip: null,
    hostname: null,
    dnsName: null,
    message,
  };
}

async function collectTailscaleDiagnostics(): Promise<DesktopTailscaleDiagnostics> {
  const versionResult = await runCommand("tailscale", ["--version"]);
  const version = versionResult.ok ? parseVersion(versionResult.stdout) : null;

  const statusResult = await runCommand("tailscale", ["status", "--json"]);
  if (!statusResult.ok) {
    return unavailableTailscaleDiagnostics(
      version
        ? "Tailscale is installed, but status could not be retrieved."
        : "Tailscale CLI is unavailable on this desktop.",
      version,
    );
  }

  try {
    const status = JSON.parse(statusResult.stdout) as TailscaleStatusJson;
    const backendState = normalizeString(status.BackendState);
    const ip =
      normalizeString(status.Self?.TailscaleIPs?.[0]) ?? normalizeString(status.TailscaleIPs?.[0]);
    const hostname = normalizeString(status.Self?.HostName);
    const dnsName = normalizeDnsName(status.Self?.DNSName);
    const healthMessage = normalizeString(status.Health?.[0]);
    const isOnline = status.Self?.Online;
    const available = backendState === "Running" && ip !== null && isOnline !== false;

    let message: string | null = null;
    if (!available) {
      if (healthMessage) {
        message = healthMessage;
      } else if (backendState !== null && backendState !== "Running") {
        message = `Tailscale state: ${backendState}`;
      } else if (isOnline === false) {
        message = "Tailscale is not currently connected.";
      } else if (!ip) {
        message = "No Tailscale IP address is currently assigned.";
      } else {
        message = "Tailscale is unavailable.";
      }
    }

    return {
      available,
      version,
      backendState,
      ip,
      hostname,
      dnsName,
      message,
    };
  } catch {
    return unavailableTailscaleDiagnostics("Unable to parse tailscale status output.", version);
  }
}

export async function collectDesktopNetworkDiagnostics(input: {
  readonly localHttpUrl: string | null;
  readonly localWsUrl: string | null;
  readonly exposureMode: DesktopServerExposureMode;
  readonly exposureEndpointUrl: string | null;
  readonly exposureAdvertisedHost: string | null;
}): Promise<DesktopNetworkDiagnostics> {
  const tailscale = await collectTailscaleDiagnostics();

  return {
    generatedAt: new Date().toISOString(),
    localHttpUrl: input.localHttpUrl,
    localWsUrl: input.localWsUrl,
    exposureMode: input.exposureMode,
    exposureEndpointUrl: input.exposureEndpointUrl,
    exposureAdvertisedHost: input.exposureAdvertisedHost,
    tailscale,
  };
}
