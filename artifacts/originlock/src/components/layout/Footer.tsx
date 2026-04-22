import { Link } from "wouter";
import logoWordmark from "@assets/originlock_wordmark_1776836712881.png";
import logoIcon from "@assets/originlock_logo_1776836712880.png";

export function Footer() {
  return (
    <footer className="bg-background border-t border-white/5 py-14 mt-auto">
      <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-10">
        <div className="col-span-1 md:col-span-2">
          <Link href="/" className="flex items-center gap-2.5 mb-5">
            <img src={logoIcon} alt="OriginLock" className="h-6 w-auto" />
            <img src={logoWordmark} alt="ORIGINLOCK" className="h-3.5 w-auto" />
          </Link>
          <p className="text-muted-foreground text-sm max-w-xs leading-relaxed">
            The infrastructure for creator trust. Cryptographic proof-of-existence and timestamped certificates for your intellectual property.
          </p>
          <p className="text-xs text-muted-foreground/50 mt-5 leading-relaxed max-w-xs">
            OriginLock provides cryptographic evidence of file existence at a point in time. It is not a substitute for formal copyright registration or legal advice.
          </p>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-4">Product</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/verify" className="hover:text-primary transition-colors">Verify Certificate</Link></li>
            <li><Link href="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
            <li><Link href="/login" className="hover:text-primary transition-colors">Log In</Link></li>
            <li><Link href="/signup" className="hover:text-primary transition-colors">Sign Up Free</Link></li>
          </ul>
        </div>
        
        <div>
          <h4 className="font-semibold text-sm text-foreground mb-4">Legal</h4>
          <ul className="space-y-2.5 text-sm text-muted-foreground">
            <li><Link href="/terms" className="hover:text-primary transition-colors">Terms of Service</Link></li>
            <li><Link href="/privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            <li><Link href="/legal" className="hover:text-primary transition-colors">Legal Disclaimer</Link></li>
          </ul>
        </div>
      </div>
      
      <div className="container mx-auto px-4 mt-12 pt-8 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-muted-foreground/50">
        <span>© {new Date().getFullYear()} OriginLock. All rights reserved.</span>
        <span>Not a legal service. Not a copyright registration. Cryptographic evidence only.</span>
      </div>
    </footer>
  );
}
