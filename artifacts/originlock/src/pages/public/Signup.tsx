import { useState } from "react";
import { Link, useLocation } from "wouter";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignup } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const signup = useSignup();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signup.mutate(
      { data: { email, password } },
      {
        onSuccess: async () => {
          await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          setLocation("/dashboard/profile");
        },
        onError: (err) => {
          toast({
            title: "Signup Failed",
            description: err.error?.error || "Could not create account",
            variant: "destructive"
          });
        }
      }
    );
  };

  return (
    <AuthLayout 
      title="Create your account" 
      subtitle="Start protecting your intellectual property today."
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
          <Label htmlFor="password">Password (min 8 characters)</Label>
          <Input 
            id="password" 
            type="password" 
            required 
            minLength={8}
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="h-12 bg-background border-white/10"
          />
        </div>
        
        <Button 
          type="submit" 
          className="w-full h-12 font-semibold" 
          disabled={signup.isPending}
        >
          {signup.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : "Create Account"}
        </Button>
      </form>
      
      <p className="mt-8 text-center text-sm text-muted-foreground">
        By signing up, you agree to our <Link href="/terms" className="text-foreground hover:underline">Terms</Link> and <Link href="/privacy" className="text-foreground hover:underline">Privacy Policy</Link>.
      </p>
      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account? <Link href="/login" className="text-primary hover:underline font-medium">Log in</Link>
      </p>
    </AuthLayout>
  );
}
