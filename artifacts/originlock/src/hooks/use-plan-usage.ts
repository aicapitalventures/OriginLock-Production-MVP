import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import type { PlanLimits } from "@/lib/plans";

export interface PlanUsageResponse {
  plan: PlanLimits;
  subscriptionStatus: string | null;
  subscriptionCurrentPeriodEnd: string | null;
  files: { used: number; limit: number };
  projects: { used: number; limit: number };
}

export function usePlanUsage() {
  return useQuery<PlanUsageResponse>({
    queryKey: ["plan", "usage"],
    queryFn: () => customFetch<PlanUsageResponse>("/api/plan/usage"),
    staleTime: 60_000,
  });
}

export interface BillingStatus {
  stripeEnabled: boolean;
}

export function useBillingStatus() {
  return useQuery<BillingStatus>({
    queryKey: ["billing", "status"],
    queryFn: () => customFetch<BillingStatus>("/api/billing/status"),
    staleTime: 5 * 60_000,
  });
}

export async function startCheckout(tier: "creator" | "studio"): Promise<{ url: string }> {
  return customFetch<{ url: string }>("/api/billing/checkout-session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier }),
  });
}

export async function openBillingPortal(): Promise<{ url: string }> {
  return customFetch<{ url: string }>("/api/billing/portal-session", {
    method: "POST",
  });
}
