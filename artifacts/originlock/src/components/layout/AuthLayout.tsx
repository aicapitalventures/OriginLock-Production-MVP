import { ReactNode } from "react";
import { Link } from "wouter";
import logoLockup from "@assets/originlock_lockup_1776836712879.png";

export function AuthLayout({ children, title, subtitle }: { children: ReactNode, title: string, subtitle: string }) {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-12 lg:px-20 py-12 relative z-10 bg-background">
        <Link href="/" className="absolute top-8 left-8">
          <img src={logoLockup} alt="OriginLock" className="h-9 w-auto" />
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
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[#080d14] border-l border-white/5 flex-col items-center justify-center">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.12)_0%,transparent_70%)]" />
        <img 
          src={`${import.meta.env.BASE_URL}images/auth-bg.png`}
          alt="Background" 
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
        <div className="relative z-10 flex flex-col items-center text-center px-12">
          <img src={logoLockup} alt="OriginLock" className="w-44 mb-12 opacity-95" />
          <p className="text-2xl font-display font-bold text-white leading-snug mb-4">
            Prove what existed,<br/>when it existed.
          </p>
          <p className="text-white/50 text-sm max-w-xs leading-relaxed">
            Cryptographic proof of existence and timestamped records for creators.
          </p>
        </div>
        <div className="absolute bottom-10 left-10 right-10 z-10 p-6 rounded-xl bg-white/5 backdrop-blur-sm border border-white/8">
          <p className="text-white/70 text-sm italic leading-relaxed">
            "OriginLock gave me peace of mind to share my scripts securely. The cryptographic timestamp is undeniably mine."
          </p>
        </div>
      </div>
    </div>
  );
}
