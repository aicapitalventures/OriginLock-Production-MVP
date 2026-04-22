import { Link } from "wouter";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { XCircle } from "lucide-react";

export function BillingCancel() {
  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto pt-12">
        <Card className="bg-card/50 border-white/5">
          <CardContent className="p-10 text-center">
            <XCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-2xl font-display font-bold mb-2">Checkout cancelled</h1>
            <p className="text-muted-foreground mb-6">
              No charges were made. You can return to pricing whenever you're ready.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/pricing"><Button>Back to pricing</Button></Link>
              <Link href="/dashboard"><Button variant="outline">Dashboard</Button></Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
