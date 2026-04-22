// Centralized plan configuration. Mirror in artifacts/originlock/src/lib/plans.ts.
export type PlanTier = "free" | "creator" | "studio";

export interface PlanLimits {
  tier: PlanTier;
  name: string;
  monthlyPriceUsd: number;
  yearlyPriceUsd: number;
  maxFiles: number;            // -1 = unlimited
  maxProjects: number;         // -1 = unlimited
  maxFileSizeMb: number;
  evidencePackageEnabled: boolean;
  versionChainEnabled: boolean;
  publicProfileEnabled: boolean;
  verificationLogVisibility: "none" | "summary" | "full";
  prioritySupport: boolean;
  stripePriceIdEnv?: string;
}

export const PLANS: Record<PlanTier, PlanLimits> = {
  free: {
    tier: "free",
    name: "Free",
    monthlyPriceUsd: 0,
    yearlyPriceUsd: 0,
    maxFiles: 3,
    maxProjects: 1,
    maxFileSizeMb: 25,
    evidencePackageEnabled: false,
    versionChainEnabled: false,
    publicProfileEnabled: false,
    verificationLogVisibility: "none",
    prioritySupport: false,
  },
  creator: {
    tier: "creator",
    name: "Creator",
    monthlyPriceUsd: 12,
    yearlyPriceUsd: 120,
    maxFiles: 100,
    maxProjects: 10,
    maxFileSizeMb: 200,
    evidencePackageEnabled: true,
    versionChainEnabled: true,
    publicProfileEnabled: true,
    verificationLogVisibility: "summary",
    prioritySupport: false,
    stripePriceIdEnv: "STRIPE_PRICE_CREATOR",
  },
  studio: {
    tier: "studio",
    name: "Studio",
    monthlyPriceUsd: 39,
    yearlyPriceUsd: 390,
    maxFiles: -1,
    maxProjects: -1,
    maxFileSizeMb: 1024,
    evidencePackageEnabled: true,
    versionChainEnabled: true,
    publicProfileEnabled: true,
    verificationLogVisibility: "full",
    prioritySupport: true,
    stripePriceIdEnv: "STRIPE_PRICE_STUDIO",
  },
};

export function getPlan(tier: string | null | undefined): PlanLimits {
  if (tier && tier in PLANS) return PLANS[tier as PlanTier];
  return PLANS.free;
}

export function isUnlimited(value: number): boolean {
  return value < 0;
}
