import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";

interface LegalPageProps {
  title: string;
  lastUpdated: string;
  content: React.ReactNode;
}

function LegalPage({ title, lastUpdated, content }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      <main className="flex-1">
        <div className="max-w-3xl mx-auto px-4 py-24">
          <div className="mb-10">
            <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-3">Legal</p>
            <h1 className="text-4xl font-bold mb-3">{title}</h1>
            <p className="text-sm text-muted-foreground">Last updated: {lastUpdated}</p>
          </div>
          <div className="prose prose-invert prose-sm max-w-none space-y-6 text-muted-foreground leading-relaxed">
            {content}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

const LAST_UPDATED = "March 28, 2026";

export function Terms() {
  return (
    <LegalPage
      title="Terms of Service"
      lastUpdated={LAST_UPDATED}
      content={
        <>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">1. What OriginLock Is</h2>
            <p>OriginLock is a proof-of-existence and creator documentation platform. When you upload a file, OriginLock records a SHA-256 cryptographic fingerprint of that file, a UTC timestamp, and your creator claim profile. This creates a verifiable evidence record that a specific file existed at a specific time and was claimed by a specific creator.</p>
            <p>OriginLock is <strong className="text-foreground">not a copyright registration service</strong>. OriginLock is <strong className="text-foreground">not a substitute for legal advice</strong>. OriginLock does not guarantee legal ownership or court-proof protection of any kind.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">2. Acceptable Use</h2>
            <p>You may use OriginLock to document your own original creative work. You may not upload files you do not own or have the rights to, use OriginLock to make false creator claims, or use the platform for any unlawful purpose.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">3. Account Responsibility</h2>
            <p>You are responsible for maintaining the security of your account credentials and for all activity under your account.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">4. Limitation of Liability</h2>
            <p>OriginLock provides documentation tools on an as-is basis. We make no warranties regarding the legal validity or enforceability of any certificate or proof record in any jurisdiction. Your use of OriginLock certificates as evidence in any dispute is entirely at your own discretion and risk.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">5. Changes to Terms</h2>
            <p>We may update these terms at any time. Continued use of OriginLock after changes constitutes acceptance of the updated terms.</p>
          </section>
        </>
      }
    />
  );
}

export function Privacy() {
  return (
    <LegalPage
      title="Privacy Policy"
      lastUpdated={LAST_UPDATED}
      content={
        <>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">1. Information We Collect</h2>
            <p>We collect your email address and password (hashed) when you create an account. We collect your creator profile information (display name, handle, optional legal name, bio, website). We collect file metadata: filename, file type, size, and SHA-256 hash. We do not permanently store the content of your uploaded files beyond what is needed to compute the hash.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">2. How We Use Information</h2>
            <p>We use your information to generate proof records, certificates, and verification pages. We log verification events (IP address, user agent, timestamp) to maintain audit trails.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">3. Data Retention</h2>
            <p>Certificate and proof records are retained for as long as your account is active. You may request deletion of your account and associated data at any time.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">4. Third Parties</h2>
            <p>We do not sell your personal information. We may use third-party hosting infrastructure to operate the platform.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">5. Security</h2>
            <p>Passwords are stored as bcrypt hashes. Session cookies are httpOnly and secure. We take reasonable measures to protect your data.</p>
          </section>
        </>
      }
    />
  );
}

export function LegalDisclaimer() {
  return (
    <LegalPage
      title="Legal Disclaimer"
      lastUpdated={LAST_UPDATED}
      content={
        <>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">OriginLock is not a copyright registry</h2>
            <p>OriginLock does not register copyright on your behalf. Copyright in most jurisdictions arises automatically upon creation of an original work. OriginLock provides evidence that a file with a specific cryptographic fingerprint was claimed by a specific creator at a specific point in time. This is distinct from copyright registration.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">No legal advice</h2>
            <p>Nothing on this platform constitutes legal advice. If you need to protect your intellectual property legally, consult a qualified attorney in your jurisdiction.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">What OriginLock certificates are</h2>
            <p>An OriginLock certificate is a documentation artifact that records: (1) a SHA-256 hash of a file, (2) the UTC timestamp at which that record was created in our system, and (3) the creator profile associated with the upload. This creates a timestamped, verifiable evidence trail that can support your case in informal disputes, collaboration agreements, or as supplementary documentation.</p>
          </section>
          <section className="space-y-3">
            <h2 className="text-foreground text-xl font-semibold">What OriginLock certificates are not</h2>
            <p>OriginLock certificates do not guarantee legal ownership of any creative work. They are not equivalent to registration with the US Copyright Office, WIPO, or any other official copyright registry. They do not constitute court-proof evidence of ownership in any jurisdiction. They are not a substitute for formal copyright registration or legal advice.</p>
          </section>
        </>
      }
    />
  );
}
