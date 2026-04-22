import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Check, Clock, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

const plans = [
  {
    name: "Free",
    price: "$0",
    period: "forever",
    description: "Everything you need to establish immutable proof of your creative work.",
    features: [
      "SHA-256 cryptographic fingerprint",
      "UTC timestamp record",
      "Creator attribution profile",
      "Unique certificate ID (OL-YYYY-XXXX-NNNN)",
      "Downloadable PDF certificate",
      "Public verification page",
      "File type support: mp3, wav, mp4, pdf, png, jpg",
      "Hash-comparison verification tool",
      "Version chain (link revisions)",
      "Evidence package export (ZIP)",
    ],
    cta: "Get started free",
    ctaHref: "/signup",
    highlight: true,
    badge: null as string | null,
    comingSoon: false,
  },
  {
    name: "Creator",
    price: "$9",
    period: "/ month",
    description: "For active creators managing ongoing projects and client deliverables.",
    features: [
      "Everything in Free",
      "Unlimited file records",
      "Advanced project organisation",
      "Bulk certificate export",
      "Verification event log with timestamps",
      "Priority processing queue",
      "REST API access",
      "Custom claim statement per file",
    ],
    cta: "Join waitlist",
    ctaHref: "/signup",
    highlight: false,
    badge: "Coming soon" as string | null,
    comingSoon: true,
  },
  {
    name: "Studio",
    price: "$29",
    period: "/ month",
    description: "For agencies, labels, and professional teams protecting high-volume IP.",
    features: [
      "Everything in Creator",
      "Up to 10 team seats",
      "White-label PDF certificates",
      "Advanced immutable audit trail",
      "Dedicated account support",
      "Custom certificate branding",
      "SLA-backed response times",
      "Early access to new features",
    ],
    cta: "Join waitlist",
    ctaHref: "/signup",
    highlight: false,
    badge: "Coming soon" as string | null,
    comingSoon: true,
  },
];

const faqs = [
  {
    q: "Is the Free plan really free forever?",
    a: "Yes. The Free plan is permanently free with no time limits. You can protect files, generate certificates, and verify hashes indefinitely at no cost."
  },
  {
    q: "Does OriginLock store my files?",
    a: "No. Your file is hashed locally in your browser using the Web Crypto API. Only the SHA-256 fingerprint, timestamp, and metadata are stored on our servers. Your original file content never leaves your device."
  },
  {
    q: "Is this a substitute for copyright registration?",
    a: "No. OriginLock provides cryptographic proof of existence — evidence that a specific file with a specific hash existed at a specific time. It is not a legal copyright registration service and does not confer legal copyright ownership."
  },
  {
    q: "Can I use an OriginLock certificate in a legal dispute?",
    a: "A certificate may serve as supporting evidence, but its weight in legal proceedings depends on jurisdiction and circumstances. We recommend consulting a qualified IP attorney for any formal dispute. OriginLock does not provide legal advice."
  },
  {
    q: "What file types are supported?",
    a: "Currently: MP3, WAV, MP4, PDF, PNG, JPG/JPEG. Support for additional formats is planned for the Creator and Studio tiers."
  },
];

export function Pricing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 px-4">
          <div className="max-w-4xl mx-auto text-center mb-16">
            <p className="text-xs font-mono text-primary/70 uppercase tracking-widest mb-4">Pricing</p>
            <h1 className="text-5xl font-bold mb-5">Simple, honest pricing</h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              Start protecting your work for free. Upgrade when your volume or workflow demands more.
            </p>
          </div>

          <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-5">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border p-7 flex flex-col ${
                  plan.highlight
                    ? "border-primary/40 bg-primary/5 shadow-[0_0_40px_rgba(6,182,212,0.08)]"
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
                  <h3 className="text-base font-semibold mb-1 text-foreground/80 uppercase tracking-wider text-xs">{plan.name}</h3>
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
                      <span className={plan.comingSoon ? "text-muted-foreground" : "text-foreground/90"}>{feature}</span>
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

          {/* Legal disclaimer */}
          <div className="max-w-3xl mx-auto mt-14 text-center">
            <p className="text-sm text-muted-foreground/60">
              OriginLock is not a copyright registration service and does not provide legal protection or legal advice. 
              It provides timestamped cryptographic proof-of-existence records only.{" "}
              <Link href="/legal" className="text-primary/70 hover:text-primary underline underline-offset-2">Learn more</Link>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20 px-4 border-t border-white/5 bg-secondary/10">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
            <div className="space-y-3">
              {faqs.map((faq, i) => (
                <div
                  key={i}
                  className="border border-white/8 rounded-xl overflow-hidden bg-card/30"
                >
                  <button
                    className="w-full text-left p-5 flex items-center justify-between gap-4 hover:bg-white/5 transition-colors"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="font-medium text-sm">{faq.q}</span>
                    {openFaq === i 
                      ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                    }
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
