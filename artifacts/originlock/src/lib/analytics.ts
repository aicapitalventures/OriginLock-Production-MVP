import { customFetch } from "@workspace/api-client-react";

export function trackEvent(eventType: string, properties: Record<string, unknown> = {}): void {
  customFetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ eventType, properties }),
  }).catch(() => {});
}
