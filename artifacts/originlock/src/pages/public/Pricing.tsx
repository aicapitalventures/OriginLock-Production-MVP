import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check, Clock } from "lucide-react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "For independent creators protecting their work.",
    features: [
      "SHA-256 file fingerprint",
      "UTC timestamp record",
      "Creator claim profile",
      "Unique certificate ID",
      "Downloadable PDF certificate",
      "Public verification page",
      "Supports mp3, wav, mp4, pdf, png, jpg, jpeg",
      "Hash comparison verification",
    ],
    cta: "Get started free",
    ctaHref: "/signup",
    highlight: true,
    badge: null,
    comingSoon: false,
  },
  {
    name: "Creator",
    price: "$9",
    period: "/ month",
    description: "For active creators managing multiple projects.",
    features: [
      "Everything in Free",
      "Unlimited file records",
      "Project organization",
      "Bulk upload",
      "Priority processing",
      "Verification event logs",
      "API access",
    ],
    cta: "Join waitlist",
    ctaHref: "/signup",
    highlight: false,
    badge: "Coming soon",
    comingSoon: true,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/ month",
    description: "For agencies, labels, and professional teams.",
    features: [
      "Everything in Creator",
      "Team seats",
      "White-label certificates",
      "Advanced audit trail",
      "Dedicated support",
      "Custom claim statements",
      "SLA guarantee",
    ],
    cta: "Join waitlist",
    ctaHref: "/signup",
    highlight: false,
    badge: "Coming soon",
    comingSoon: true,
  },
];

export function Pricing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="py-24 px-4">
          <div className="max-w-5xl mx-auto text-center mb-16">
            <p className="text-sm font-mono text-primary uppercase tracking-widest mb-4">Pricing</p>
            <h1 className="text-5xl font-bold mb-6">Simple, transparent pricing</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start protecting your creative work for free. Upgrade when your workflow demands more.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-8 flex flex-col ${
                  plan.highlight
                    ? "border-primary/40 bg-primary/5 ring-1 ring-primary/20"
                    : "border-white/8 bg-card/40"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1.5 bg-secondary text-secondary-foreground text-xs font-medium px-3 py-1 rounded-full border border-white/10">
                      <Clock className="w-3 h-3" />
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span className={plan.comingSoon ? "text-muted-foreground" : ""}>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link href={plan.ctaHref}>
                  <Button
                    className="w-full"
                    variant={plan.highlight ? "default" : "outline"}
                    disabled={plan.comingSoon}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </div>
            ))}
          </div>

          <div className="max-w-3xl mx-auto mt-16 text-center">
            <p className="text-sm text-muted-foreground">
              OriginLock is not a copyright registration service and does not provide legal protection. 
              It provides timestamped proof of existence and creator claim documentation.{" "}
              <Link href="/legal" className="text-primary hover:underline">Learn more</Link>
            </p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
