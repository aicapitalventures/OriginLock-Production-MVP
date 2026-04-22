import { useState } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, ShieldAlert, Trash2, Loader2, AlertTriangle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { customFetch } from "@workspace/api-client-react";

export function Settings() {
  const { user } = useAuth();
  const resetPassword = useForgotPassword();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  const handleResetRequest = () => {
    if (user?.email) {
      resetPassword.mutate({ data: { email: user.email } }, {
        onSuccess: () => toast({ 
          title: "Password Reset Requested", 
          description: "A reset link has been generated. Check your email (delivery pending configuration)." 
        })
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

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-display font-bold mb-2">Account Settings</h1>
        <p className="text-muted-foreground mb-8">Manage your account credentials and security.</p>

        <div className="space-y-6">
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-base font-semibold">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label className="text-xs text-muted-foreground uppercase tracking-wide">Email Address</Label>
                <p className="font-medium mt-1">{user?.email}</p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <p className="text-sm text-muted-foreground mb-4">
                  Password changes are handled via email link. We'll send a reset token to your registered address.
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleResetRequest} 
                  disabled={resetPassword.isPending}
                  className="border-white/10"
                >
                  {resetPassword.isPending 
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sending...</> 
                    : <><KeyRound className="w-4 h-4 mr-2" /> Request Password Change</>
                  }
                </Button>
              </div>
            </CardContent>
          </Card>

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
                    Your account, creator profile, and all project records will be permanently deleted. Any public verification pages for your certificates will become unavailable.
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
                    Delete My Account
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-background border-white/10">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                      <ShieldAlert className="w-5 h-5" />
                      Confirm Account Deletion
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
                    onChange={e => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    className="mt-2 bg-background border-white/10 font-mono"
                  />
                  <AlertDialogFooter className="mt-4">
                    <AlertDialogCancel 
                      className="border-white/10" 
                      onClick={() => setDeleteConfirmText("")}
                    >
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      disabled={deleteConfirmText !== "DELETE" || isDeleting}
                      onClick={handleDeleteAccount}
                    >
                      {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
                      Permanently Delete Account
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
