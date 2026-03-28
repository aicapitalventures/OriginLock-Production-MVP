import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-secondary/30 border-t border-white/5 py-12 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span className="font-display font-bold text-lg text-foreground">OriginLock</span>
          </Link>
          <p className="text-muted-foreground text-sm max-w-xs">
            The infrastructure for creator trust. Cryptographic proof-of-existence and timestamped certificates for your valuable IP.
          </p>
          <p className="text-xs text-muted-foreground/60 mt-4">
            Disclaimer: OriginLock provides cryptographic evidence of existence. It is not a replacement for legal copyright registration.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-foreground mb-4">Product</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/verify" className="hover:text-primary transition-colors">Verify Certificate</Link></li>
            <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
            <li><Link href="/login" className="hover:text-primary transition-colors">Log In</Link></li>
            <li><Link href="/signup" className="hover:text-primary transition-colors">Sign Up</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-foreground mb-4">Legal</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link href="/legal" className="hover:text-primary transition-colors">Legal Disclaimer</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-white/5 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} OriginLock. All rights reserved.
      </div>
    </footer>
  );
}
