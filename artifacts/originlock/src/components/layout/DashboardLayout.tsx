import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { 
  LayoutDashboard, 
  Upload, 
  Files, 
  FolderKanban, 
  User, 
  Settings, 
  LogOut,
  Menu,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLogout } from "@workspace/api-client-react";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import logoIcon from "@assets/originlock_logo_1776836712880.png";
import logoWordmark from "@assets/originlock_wordmark_1776836712881.png";

export function DashboardLayout({ children }: { children: ReactNode }) {
  const [location, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const logout = useLogout();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.clear();
        setLocation("/login");
      }
    });
  };

  const { user } = useAuth();
  const isAdmin = (user as any)?.isAdmin === true;
  const navItems = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/upload", label: "Protect File", icon: Upload },
    { href: "/dashboard/files", label: "My Files", icon: Files },
    { href: "/dashboard/projects", label: "Projects", icon: FolderKanban },
    { href: "/dashboard/profile", label: "Creator Profile", icon: User },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", icon: Shield }] : []),
  ];

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b border-white/8">
        <Link href="/" className="flex items-center gap-2.5">
          <img src={logoIcon} alt="OriginLock" className="h-7 w-auto" />
          <img src={logoWordmark} alt="ORIGINLOCK" className="h-3.5 w-auto" />
        </Link>
      </div>
      
      <div className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href));
          
          return (
            <Link key={item.href} href={item.href} className="block">
              <div className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-150 ${
                isActive 
                  ? 'bg-primary/10 text-primary font-medium border border-primary/20' 
                  : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'
              }`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="text-sm">{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>
      
      <div className="p-3 border-t border-white/8">
        <Button 
          variant="ghost" 
          className="w-full justify-start text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-3" />
          Log out
        </Button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Mobile Sidebar */}
      <div className="lg:hidden absolute top-4 left-4 z-50">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-background/50 backdrop-blur-md border-white/10">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64 border-r border-white/8 bg-background">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-64 border-r border-white/8 bg-background/80 z-10 shrink-0">
        <NavContent />
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="absolute inset-0 pointer-events-none -z-10 bg-[radial-gradient(ellipse_800px_600px_at_80%_0%,rgba(6,182,212,0.04),transparent)]" />
        <div className="container mx-auto p-4 lg:p-8 pt-16 lg:pt-8 min-h-full max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
