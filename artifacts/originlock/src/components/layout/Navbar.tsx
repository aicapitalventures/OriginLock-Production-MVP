import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function Navbar() {
  const { isAuthenticated, isLoading } = useAuth();
  const [location] = useLocation();

  const isActive = (path: string) => location === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 group">
            <ShieldCheck className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
            <span className="font-display font-bold text-xl tracking-wide text-foreground">OriginLock</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/verify" 
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/verify') ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Verify Certificate
            </Link>
            <Link 
              href="/pricing" 
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive('/pricing') ? 'text-primary' : 'text-muted-foreground'}`}
            >
              Pricing
            </Link>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {!isLoading && (
            isAuthenticated ? (
              <Link href="/dashboard">
                <Button className="font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
                  Log in
                </Link>
                <Link href="/signup">
                  <Button className="font-semibold shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                    Start Protecting
                  </Button>
                </Link>
              </>
            )
          )}
        </div>
      </div>
    </header>
  );
}
