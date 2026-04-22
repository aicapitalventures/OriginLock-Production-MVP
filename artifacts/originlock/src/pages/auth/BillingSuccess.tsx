import { useEffect } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function BillingSuccess() {
  const qc = useQueryClient();
  useEffect(() => {
    // Refresh user + plan data after checkout
    qc.invalidateQueries();
  }, [qc]);
  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto pt-12">
        <Card className="bg-card/50 border-primary/20">
          <CardContent className="p-10 text-center">
            <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold mb-2">Subscription active</h1>
            <p className="text-muted-foreground mb-6">
              Thanks for upgrading. Your new plan limits are in effect. It may take up to a minute for the changes to fully sync.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard"><Button>Go to dashboard</Button></Link>
              <Link href="/dashboard/settings"><Button variant="outline">View billing</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
