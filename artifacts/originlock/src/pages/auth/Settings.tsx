import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useForgotPassword, customFetch } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  KeyRound, ShieldAlert, Trash2, Loader2, AlertTriangle,
  CreditCard, Download, Bell, ExternalLink, Sparkles,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader,
  AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { usePlanUsage, useBillingStatus, openBillingPortal } from "@/hooks/use-plan-usage";
import { formatLimit } from "@/lib/plans";

interface NotifPrefs {
  emailEnabled: boolean;
  preferences: {
    emailWelcome: boolean;
    emailBilling: boolean;
    emailCertGenerated: boolean;
  };
}

export function Settings() {
  const { user } = useAuth();
  const resetPassword = useForgotPassword();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const { data: usage } = usePlanUsage();
  const { data: billing } = useBillingStatus();
  const { data: notifs } = useQuery<NotifPrefs>({
    queryKey: ["notifications", "preferences"],
    queryFn: () => customFetch("/api/notifications/preferences"),
  });

  const togglePref = async (key: keyof NotifPrefs["preferences"], value: boolean) => {
    await customFetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    queryClient.invalidateQueries({ queryKey: ["notifications", "preferences"] });
  };

  const handleResetRequest = () => {
    if (user?.email) {
      resetPassword.mutate({ data: { email: user.email } }, {
        onSuccess: () => toast({
          title: "Password reset requested",
          description: "If your account exists, a reset link has been sent.",
        }),
      });
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "DELETE") return;
    setIsDeleting(true);
    try {
      await customFetch("/api/auth/account", { method: "DELETE" });
      queryClient.clear();
      setLocation("/");
      toast({ title: "Account deleted", description: "Your account has been permanently removed." });
    } catch {
      toast({ title: "Error", description: "Failed to delete account. Please try again.", variant: "destructive" });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleManageBilling = async () => {
    setPortalLoading(true);
    try {
      const { url } = await openBillingPortal();
      window.location.href = url;
    } catch (err: any) {
      toast({ title: "Could not open billing portal", description: err?.message || "Please try again.", variant: "destructive" });
      setPortalLoading(false);
    }
  };

  const handleExport = (path: string, filename: string) => {
    const a = document.createElement("a");
    a.href = path;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const tier = usage?.plan.tier ?? "free";
  const status = usage?.subscriptionStatus;
  const hasStripeCustomer = (user as any)?.subscriptionTier && (user as any)?.subscriptionTier !== "free";

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-display font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account, plan, and preferences.</p>

        <div className="space-y-6">
          {/* Billing */}
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <CreditCard className="w-4 h-4" /> Plan & Billing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    {usage?.plan.name ?? "Free"} plan
                    {status === "active" && <Badge variant="outline" className="text-xs">active</Badge>}
                  </p>
                  {usage && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {usage.files.used} / {formatLimit(usage.files.limit)} files ·{" "}
                      {usage.projects.used} / {formatLimit(usage.projects.limit)} projects ·{" "}
                      Up to {usage.plan.maxFileSizeMb}MB per file
                    </p>
                  )}
                </div>
                {tier === "free" ? (
                  <Link href="/pricing"><Button size="sm">Upgrade</Button></Link>
                ) : hasStripeCustomer && billing?.stripeEnabled ? (
                  <Button size="sm" variant="outline" onClick={handleManageBilling} disabled={portalLoading}>
                    {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Manage <ExternalLink className="w-3 h-3 ml-1.5" /></>}
                  </Button>
                ) : null}
              </div>
              {!billing?.stripeEnabled && tier === "free" && (
                <p className="text-xs text-muted-foreground border-t border-white/5 pt-3">
                  Paid plans coming soon. We'll let you know when checkout is live.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notifications */}
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Bell className="w-4 h-4" /> Email Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!notifs?.emailEnabled && (
                <p className="text-xs text-muted-foreground bg-amber-500/5 border border-amber-500/20 rounded-md p-2.5">
                  Email delivery is not yet configured. Your preferences will apply once it's available.
                </p>
              )}
              {[
                { key: "emailWelcome" as const, label: "Welcome and onboarding" },
                { key: "emailBilling" as const, label: "Billing and subscription updates" },
                { key: "emailCertGenerated" as const, label: "Notify me when a certificate is generated" },
              ].map((pref) => (
                <div key={pref.key} className="flex items-center justify-between">
                  <Label htmlFor={pref.key} className="text-sm font-normal cursor-pointer">{pref.label}</Label>
                  <Switch
                    id={pref.key}
                    checked={notifs?.preferences?.[pref.key] ?? false}
                    onCheckedChange={(v) => togglePref(pref.key, v)}
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Export data */}
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-base font-semibold flex items-center gap-2">
                <Download className="w-4 h-4" /> Export your data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Download a portable JSON copy of your account, profile, projects, files, certificates, and verification events.
              </p>
              <Button variant="outline" size="sm" onClick={() => handleExport("/api/export/account", "originlock-account.json")}>
                <Download className="w-4 h-4 mr-2" />
                Download account export (JSON)
              </Button>
            </CardContent>
          </Card>

          {/* Account */}
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Account</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email</Label>
                <p className="font-medium mt-1">{user?.email}</p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-sm text-muted-foreground mb-4">
                  Password changes are handled via email link.
                </p>
                <Button
                  variant="outline" size="sm"
                  onClick={handleResetRequest}
                  disabled={resetPassword.isPending}
                  className="border-white/10"
                >
                  {resetPassword.isPending
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</>
                    : <><KeyRound className="w-4 h-4 mr-2" /> Request password change</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Danger zone */}
          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-destructive flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-5 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <div className="text-sm text-destructive/90 space-y-1">
                  <p className="font-medium">This action is permanent and cannot be undone.</p>
                  <p className="text-destructive/70">
                    Your account, creator profile, and all project records will be permanently deleted. Public verification pages for your certificates will become unavailable.
                  </p>
                  <p className="text-destructive/70">
                    Note: Certificate IDs previously shared with third parties cannot be invalidated retroactively.
                  </p>
                </div>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete my account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background border-white/10">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                      <ShieldAlert className="w-5 h-5" />
                      Confirm account deletion
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground space-y-3">
                      <p>This will permanently delete your account and all associated data. This cannot be undone.</p>
                      <p className="font-medium text-foreground">
                        To confirm, type <span className="font-mono bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">DELETE</span> below:
                      </p>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <Input
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="mt-2 bg-background border-white/10 font-mono"
                  />
                  <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel className="border-white/10" onClick={() => setDeleteConfirmText("")}>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleteConfirmText !== "DELETE" || isDeleting}
                      onClick={handleDeleteAccount}
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Permanently delete account
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
