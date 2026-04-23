import type { DesktopAppBranding, DesktopAppStageLabel } from "@t3tools/contracts";
import { HARBORDEX_BRANDING } from "@t3tools/harbordex-runtime";

import { isNightlyDesktopVersion } from "./updateChannels.ts";

const APP_BASE_NAME = HARBORDEX_BRANDING.productName;

export function resolveDesktopAppStageLabel(input: {
  readonly isDevelopment: boolean;
  readonly appVersion: string;
}): DesktopAppStageLabel {
  if (input.isDevelopment) {
    return "Dev";
  }

  return isNightlyDesktopVersion(input.appVersion) ? "Nightly" : "Alpha";
}

export function resolveDesktopAppBranding(input: {
  readonly isDevelopment: boolean;
  readonly appVersion: string;
}): DesktopAppBranding {
  const stageLabel = resolveDesktopAppStageLabel(input);
  return {
    baseName: APP_BASE_NAME,
    stageLabel,
    displayName: `${APP_BASE_NAME} (${stageLabel})`,
  };
}
