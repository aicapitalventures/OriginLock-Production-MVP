import { ReactNode } from "react";
import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-12 lg:px-24 py-12 relative z-10 bg-background">
        <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 group">
          <ShieldCheck className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
          <span className="font-display font-bold text-xl text-foreground">OriginLock</span>
        </Link>
        
        <div className="max-w-md w-full mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          
          {children}
        </div>
      </div>
      
      {/* Right Image Side */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden bg-secondary border-l border-white/5">
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 via-transparent to-transparent z-10 mix-blend-overlay" />
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Cryptographic hash visualization" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute bottom-12 left-12 right-12 z-20 p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
          <h3 className="font-display font-bold text-2xl text-white mb-2">Immutable Proof</h3>
          <p className="text-white/70">
            "OriginLock gave me the peace of mind to share my scripts securely. The cryptographic timestamp is undeniably mine."
          </p>
        </div>
      </div>
    </div>
  );
}
