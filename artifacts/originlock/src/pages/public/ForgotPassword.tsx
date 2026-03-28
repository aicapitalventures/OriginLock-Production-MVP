import { useState } from "react";
import { Link } from "wouter";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForgotPassword } from "@workspace/api-client-react";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const forgotPassword = useForgotPassword();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    forgotPassword.mutate(
      { data: { email } },
      {
        onSuccess: () => setSubmitted(true),
      }
    );
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-sm space-y-8">
        <div>
          <Link href="/login" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to login
          </Link>
          <h1 className="text-3xl font-bold mb-2">Reset your password</h1>
          <p className="text-muted-foreground text-sm">
            Enter your email address and we'll send you a reset link.
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-primary mx-auto" />
            <p className="font-medium">Check your inbox</p>
            <p className="text-sm text-muted-foreground">
              If <strong>{email}</strong> is registered, a password reset link has been sent.
            </p>
            <Link href="/login">
              <Button variant="outline" className="mt-2 w-full">Return to login</Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="pl-10 bg-background/60 border-white/10"
                  autoComplete="email"
                />
              </div>
            </div>

            {forgotPassword.isError && (
              <p className="text-sm text-red-400">Something went wrong. Please try again.</p>
            )}

            <Button type="submit" className="w-full" disabled={forgotPassword.isPending}>
              {forgotPassword.isPending ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}
      </div>
    </AuthLayout>
  );
}
