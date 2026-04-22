import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Shield, Clock, FileText, CheckCircle2, ChevronRight, Lock, ChevronDown } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Does OriginLock register my copyright?",
    a: "No. OriginLock creates cryptographic proof that a specific file existed at a specific moment in time. It does not register or transfer copyright. Copyright is automatically granted to creators at the moment of creation — OriginLock provides evidence to support that timeline.",
  },
  {
    q: "What exactly gets stored on OriginLock's servers?",
    a: "We store a SHA-256 hash of your file, not the file itself. The hash is a unique 64-character fingerprint of the contents. Your raw media data never leaves your device.",
  },
  {
    q: "Can I use an OriginLock certificate in a legal dispute?",
    a: "OriginLock certificates provide verifiable, timestamped evidence of prior possession. They have been used in licensing disputes and DMCA counter-claims. We strongly recommend consulting a qualified attorney for legal strategy specific to your situation.",
  },
  {
    q: "What happens if I modify my file after uploading?",
    a: "Any change to the file — even adding a single space — produces a completely different SHA-256 hash. The original certificate will no longer match the modified version, which is by design. Upload a new version to add it to the chain.",
  },
  {
    q: "How is OriginLock different from just emailing myself a file?",
    a: "Email timestamps are easily manipulated, not cryptographically bound, and can be backdated. OriginLock records are immutable, independently verifiable, and produce a formal certificate tied to a specific hash — not just a date.",
  },
  {
    q: "What file types does OriginLock support?",
    a: "Any file type up to the plan limit: audio (mp3, wav, flac), video (mp4, mov), documents (pdf, docx), images (png, jpg), archives (zip), and more. The hash is computed the same way regardless of format.",
  },
];

function FaqAccordion() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="space-y-3 max-w-3xl mx-auto">
      {FAQ_ITEMS.map((item, i) => (
        <div key={i} className="border border-white/8 rounded-xl overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-white/5 transition-colors"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-medium text-sm pr-4">{item.q}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform duration-200 ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && (
            <div className="px-6 pb-5 text-sm text-muted-foreground leading-relaxed border-t border-white/5 pt-4">
              {item.a}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function Landing() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-24 pb-32 lg:pt-36 lg:pb-48 overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
              alt="Background" 
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          </div>

          <div className="container mx-auto px-4 relative z-10 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8">
                <Lock className="w-4 h-4" />
                <span>The new standard for creator IP protection</span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-bold tracking-tight mb-6 leading-tight">
                Prove what existed, <br className="hidden md:block"/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-400">when it existed.</span>
              </h1>
              <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
                Upload your files to generate a cryptographically secure, timestamped proof record. Receive a verifiable PDF certificate instantly.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link href="/signup">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-8 text-base font-semibold shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all duration-300">
                    Protect a File Now
                    <ChevronRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link href="/verify">
                  <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-base font-semibold border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-sm">
                    Verify a Certificate
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Value Props */}
        <section className="py-24 bg-secondary/20 border-y border-white/5">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-display font-bold mb-4">Ironclad Proof for Creators</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                OriginLock provides undeniable evidence that you possessed a specific file at a specific point in time, without exposing the contents of the file.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {[
                {
                  icon: Shield,
                  title: "SHA-256 Fingerprint",
                  desc: "We generate a unique cryptographic hash of your file in the browser. The hash is stored, not the raw file data, ensuring complete privacy."
                },
                {
                  icon: Clock,
                  title: "Timestamped Evidence",
                  desc: "Your hash is permanently recorded with a UTC timestamp. You have verifiable proof of exact possession time."
                },
                {
                  icon: FileText,
                  title: "Downloadable Certificate",
                  desc: "Instantly receive a beautifully formatted PDF certificate detailing your proof record, ready to share with clients or legal counsel."
                }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.2 }}
                  className="bg-card border border-white/5 p-8 rounded-2xl hover:border-primary/30 transition-colors duration-300"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-6">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-24">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-display font-bold mb-16">How OriginLock Works</h2>
            <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-4 max-w-4xl mx-auto">
              {[
                { step: "1", title: "Upload & Hash", desc: "Select your file (mp3, pdf, mp4, etc). We hash it locally." },
                { step: "2", title: "Timestamp Record", desc: "The hash is sent to our servers and indelibly timestamped." },
                { step: "3", title: "Get Certificate", desc: "Receive a shareable link and a formal PDF certificate." }
              ].map((item, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-secondary border border-white/10 flex items-center justify-center text-xl font-bold text-primary mb-6 relative">
                    {item.step}
                    {i < 2 && <div className="hidden md:block absolute top-1/2 left-full w-full h-[1px] bg-white/10 -z-10" />}
                  </div>
                  <h4 className="font-bold text-lg mb-2">{item.title}</h4>
                  <p className="text-muted-foreground text-sm max-w-[200px]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Use Cases */}
        <section className="py-24 bg-primary/5 border-y border-primary/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-display font-bold text-center mb-16">Who is OriginLock For?</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                "Musicians protecting demos and masters before pitching.",
                "Writers establishing proof of draft completion.",
                "Designers sharing concepts with new clients.",
                "Filmmakers registering scripts and treatments."
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3 p-6 bg-background rounded-xl border border-white/5">
                  <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground/80">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Straight answers about what OriginLock does — and doesn't do — for your work.
              </p>
            </div>
            <FaqAccordion />
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 bg-secondary/20 border-t border-white/5">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h2 className="text-3xl font-display font-bold mb-4">Start protecting your work today.</h2>
            <p className="text-muted-foreground mb-8">
              Free for your first record. No credit card required.
            </p>
            <Link href="/signup">
              <Button size="lg" className="h-14 px-10 text-base font-semibold shadow-[0_0_30px_rgba(6,182,212,0.3)] hover:shadow-[0_0_40px_rgba(6,182,212,0.4)] transition-all duration-300">
                Create Free Account
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
          </div>
        </section>

      </main>

      <Footer />
    </div>
  );
}
