import { Link, useLocation } from "wouter";
import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useBillingStatus, startCheckout } from "@/hooks/use-plan-usage";
import { useToast } from "@/hooks/use-toast";
import { trackEvent } from "@/lib/analytics";
import { PLANS, type PlanTier } from "@/lib/plans";

interface DisplayPlan {
  tier: PlanTier;
  price: string;
  period: string;
  description: string;
  features: string[];
  highlight: boolean;
}

const displayPlans: DisplayPlan[] = [
  {
    tier: "free",
    price: "$0",
    period: "forever",
    description: "Establish proof of existence for your work — no credit card required.",
    features: [
      "Up to 3 protected files",
      "1 project",
      "Files up to 25MB",
      "SHA-256 fingerprint + UTC timestamp",
      "Public verification page",
      "Downloadable PDF certificate",
      "Hash-comparison verification",
    ],
    highlight: false,
  },
  {
    tier: "creator",
    price: `$${PLANS.creator.monthlyPriceUsd}`,
    period: "/ month",
    description: "For active creators managing ongoing work.",
    features: [
      "Up to 100 protected files",
      "10 projects",
      "Files up to 200MB",
      "Evidence Package export (ZIP)",
      "Version chains (link revisions)",
      "Public creator profile",
      "Verification log access",
    ],
    highlight: true,
  },
  {
    tier: "studio",
    price: `$${PLANS.studio.monthlyPriceUsd}`,
    period: "/ month",
    description: "For agencies, labels, and high-volume IP.",
    features: [
      "Unlimited files & projects",
      "Files up to 1GB",
      "Full verification log",
      "Priority support",
      "Everything in Creator",
    ],
    highlight: false,
  },
];

const faqs = [
  {
    q: "Is the Free plan really free forever?",
    a: "Yes. The Free plan is permanently free, with limits on file count, project count, and file size. No credit card required.",
  },
  {
    q: "Does OriginLock store my files?",
    a: "No. Your file is hashed locally in your browser using the Web Crypto API. Only the SHA-256 fingerprint, timestamp, and metadata are stored. Your original file content never leaves your device.",
  },
  {
    q: "Can I cancel my subscription at any time?",
    a: "Yes. You can cancel from Settings → Billing. Your plan stays active until the end of the current billing period, after which you revert to Free.",
  },
  {
    q: "Is this a substitute for copyright registration?",
    a: "No. OriginLock provides cryptographic proof of existence — evidence that a specific file with a specific hash existed at a specific time. It is not a legal copyright registration service and does not confer legal copyright ownership.",
  },
  {
    q: "Can I use an OriginLock certificate in a legal dispute?",
    a: "A certificate may serve as supporting evidence, but its weight in legal proceedings depends on jurisdiction and circumstances. We recommend consulting a qualified IP attorney for any formal dispute. OriginLock does not provide legal advice.",
  },
];

export function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const { data: billing } = useBillingStatus();
  const { toast } = useToast();
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  useEffect(() => {
    trackEvent("pricing_viewed");
  }, []);

  const handleCta = async (tier: PlanTier) => {
    if (tier === "free") {
      setLocation(isAuthenticated ? "/dashboard" : "/signup");
      return;
    }
    if (!isAuthenticated) {
      setLocation(`/signup?next=/pricing`);
      return;
    }
    if (!billing?.stripeEnabled) {
      toast({
        title: "Coming soon",
        description: "Paid plans aren't live yet. We'll email you when checkout opens.",
      });
      return;
    }
    setLoadingTier(tier);
    try {
      const { url } = await startCheckout(tier as "creator" | "studio");
      window.location.href = url;
    } catch (err: any) {
      toast({
        title: "Could not start checkout",
        description: err?.message || "Please try again in a moment.",
        variant: "destructive",
      });
      setLoadingTier(null);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <p className="text-xs font-mono text-primary/70 uppercase tracking-widest mb-4">Pricing</p>
            <h1 className="text-5xl font-bold mb-5">Simple, honest pricing</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start protecting your work for free. Upgrade when your volume or workflow needs more.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
            {displayPlans.map((plan) => {
              const ctaLabel = plan.tier === "free"
                ? (isAuthenticated ? "Go to dashboard" : "Get started free")
                : `Choose ${plan.tier === "creator" ? "Creator" : "Studio"}`;
              return (
                <div
                  key={plan.tier}
                  className={`relative rounded-2xl border p-7 flex flex-col ${
                    plan.highlight
                      ? "border-primary/40 bg-primary/5 shadow-[0_0_40px_rgba(6,182,212,0.08)]"
                      : "border-white/8 bg-card/40"
                  }`}
                >
                  {plan.highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <h3 className="text-base font-semibold mb-1 text-foreground/80 uppercase tracking-wider text-xs">
                      {plan.tier}
                    </h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{plan.description}</p>
                  </div>

                  <ul className="space-y-2.5 mb-8 flex-1">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2.5 text-sm">
                        <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                        <span className="text-foreground/90">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => handleCta(plan.tier)}
                    disabled={loadingTier === plan.tier}
                  >
                    {loadingTier === plan.tier ? <Loader2 className="w-4 h-4 animate-spin" /> : ctaLabel}
                  </Button>
                </div>
              );
            })}
          </div>

          <div className="max-w-3xl mx-auto mt-14 text-center">
            <p className="text-sm text-muted-foreground/60">
              OriginLock is not a copyright registration service and does not provide legal protection or legal advice.
              It provides timestamped cryptographic proof-of-existence records only.{" "}
              <Link href="/legal" className="text-primary/70 hover:text-primary underline underline-offset-2">Learn more</Link>
            </p>
          </div>
        </section>

        <section className="py-20 px-4 border-t border-white/5 bg-secondary/10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div key={i} className="border border-white/8 rounded-xl overflow-hidden bg-card/30">
                  <button
                    className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium text-sm">{faq.q}</span>
                    {openFaq === i
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-5">
                      <p className="text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
