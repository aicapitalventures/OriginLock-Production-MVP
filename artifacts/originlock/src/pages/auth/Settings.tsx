import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useForgotPassword } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { KeyRound, ShieldAlert } from "lucide-react";

export function Settings() {
  const { user } = useAuth();
  const resetPassword = useForgotPassword();
  const { toast } = useToast();

  const handleResetRequest = () => {
    if (user?.email) {
      resetPassword.mutate({ data: { email: user.email } }, {
        onSuccess: () => toast({ title: "Reset Link Sent", description: "Check your email for instructions." })
      });
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-display font-bold mb-8">Account Settings</h1>

        <div className="space-y-6">
          <Card className="bg-card/50 border-white/5">
            <CardHeader>
              <CardTitle className="text-lg">Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email Address</p>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div className="pt-4 border-t border-white/5">
                <Button variant="outline" onClick={handleResetRequest} disabled={resetPassword.isPending}>
                  <KeyRound className="w-4 h-4 mr-2" /> 
                  Change Password
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-destructive/5 border-destructive/20">
            <CardHeader>
              <CardTitle className="text-lg text-destructive flex items-center gap-2">
                <ShieldAlert className="w-5 h-5" /> Danger Zone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Deleting your account is permanent. All your proof records will remain cryptographically valid, but your access to the dashboard and management of public links will be lost.
              </p>
              <Button variant="destructive">Delete Account</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
