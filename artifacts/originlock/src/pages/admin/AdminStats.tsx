import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Shield, FileBadge, CheckCircle, Download, CreditCard } from "lucide-react";
import { format } from "date-fns";

interface AdminStats {
  totals: {
    users: number;
    files: number;
    certificates: number;
    verificationEvents: number;
    evidenceExports: number;
    activeSubscriptions: number;
  };
  planDistribution: Array<{ tier: string; count: number }>;
  recentSignups: Array<{ id: string; email: string; createdAt: string; tier: string }>;
  recentFiles: Array<{ id: string; title: string; fileType: string; createdAt: string; userId: string }>;
}

export function AdminStats() {
  const { data, isLoading, error } = useQuery<AdminStats>({
    queryKey: ["admin", "stats"],
    queryFn: () => customFetch("/api/admin/stats"),
  });

  if (error) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl">
          <h1 className="text-2xl font-bold mb-2">Admin</h1>
          <p className="text-destructive">{(error as Error).message || "Forbidden"}</p>
        </div>
      </DashboardLayout>
    );
  }

  const cards = [
    { title: "Users", value: data?.totals.users ?? 0, icon: Users, color: "text-blue-500" },
    { title: "Active subs", value: data?.totals.activeSubscriptions ?? 0, icon: CreditCard, color: "text-green-500" },
    { title: "Files protected", value: data?.totals.files ?? 0, icon: Shield, color: "text-cyan-500" },
    { title: "Certificates", value: data?.totals.certificates ?? 0, icon: FileBadge, color: "text-amber-500" },
    { title: "Verifications", value: data?.totals.verificationEvents ?? 0, icon: CheckCircle, color: "text-purple-500" },
    { title: "Evidence exports", value: data?.totals.evidenceExports ?? 0, icon: Download, color: "text-pink-500" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-display font-bold">Admin</h1>
          <p className="text-muted-foreground mt-1">Internal product overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/users" className="text-sm text-primary hover:underline">Users →</Link>
          <Link href="/admin/analytics" className="text-sm text-primary hover:underline">Analytics →</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {cards.map((c) => (
          <Card key={c.title} className="bg-card/50 border-white/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-muted-foreground">{c.title}</p>
                <c.icon className={`w-4 h-4 ${c.color}`} />
              </div>
              <p className="text-2xl font-bold font-display">{isLoading ? "—" : c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="bg-card/50 border-white/5">
          <CardHeader><CardTitle className="text-base">Plan distribution</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> :
              data?.planDistribution.map((p) => (
                <div key={p.tier} className="flex justify-between py-1.5 border-b border-white/5 last:border-0">
                  <span className="capitalize">{p.tier}</span>
                  <span className="font-mono">{p.count}</span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5">
          <CardHeader><CardTitle className="text-base">Recent signups</CardTitle></CardHeader>
          <CardContent className="space-y-1.5">
            {isLoading ? <p className="text-sm text-muted-foreground">Loading...</p> :
              data?.recentSignups.map((u) => (
                <Link key={u.id} href={`/admin/users/${u.id}`} className="flex justify-between text-sm py-1.5 hover:bg-white/5 rounded px-2 -mx-2">
                  <span className="truncate">{u.email}</span>
                  <span className="text-muted-foreground text-xs shrink-0 ml-2">{format(new Date(u.createdAt), "MMM d")}</span>
                </Link>
              ))}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
