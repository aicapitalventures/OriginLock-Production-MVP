import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLogin, useGetMe } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const login = useLogin();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login.mutate(
      { data: { email, password } },
      {
        onSuccess: async (res) => {
          // Invalidate and refetch me
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          if (res.user.hasProfile) {
            setLocation("/dashboard");
          } else {
            setLocation("/dashboard/profile");
          }
        },
        onError: (err) => {
          toast({
            title: "Login Failed",
            description: err.error?.error || "Invalid credentials",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <AuthLayout 
      title="Welcome back" 
      subtitle="Log in to access your proof records and certificates."
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input 
            id="email" 
            type="email" 
            required 
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="h-12 bg-background border-white/10"
          />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
          <Input 
            id="password" 
            type="password" 
            required 
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="h-12 bg-background border-white/10"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-12 font-semibold" 
          disabled={login.isPending}
        >
          {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Log In"}
        </Button>
      </form>
      
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Don't have an account? <Link href="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
      </p>
    </AuthLayout>
  );
}
