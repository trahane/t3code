export interface HarbordexBranding {
  readonly productName: string;
  readonly attribution: string;
  readonly upstreamName: string;
  readonly upstreamRepositoryUrl: string;
}

export const HARBORDEX_BRANDING: HarbordexBranding = {
  productName: "Harbordex",
  attribution: "Harbordex is a fork of t3code.",
  upstreamName: "t3code",
  upstreamRepositoryUrl: "https://github.com/pingdotgg/t3code",
};
