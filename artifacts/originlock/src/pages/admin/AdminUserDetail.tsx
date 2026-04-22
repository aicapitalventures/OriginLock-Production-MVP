import { useQuery } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { ArrowLeft } from "lucide-react";

export function AdminUserDetail() {
  const [, params] = useRoute("/admin/users/:id");
  const id = params?.id;

  const { data, isLoading } = useQuery<any>({
    queryKey: ["admin", "user", id],
    queryFn: () => customFetch(`/api/admin/users/${id}`),
    enabled: !!id,
  });

  return (
    <DashboardLayout>
      <Link href="/admin/users" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center mb-4">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to users
      </Link>

      {isLoading || !data ? (
        <p className="text-muted-foreground">Loading…</p>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-display font-bold flex items-center gap-3">
              {data.user.email}
              {data.user.isAdmin && <Badge variant="outline">admin</Badge>}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Joined {format(new Date(data.user.createdAt), "PPP")} ·{" "}
              <span className="capitalize">{data.user.tier}</span>
              {data.user.status ? ` · ${data.user.status}` : ""}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <Card className="bg-card/50 border-white/5">
              <CardHeader><CardTitle className="text-base">Profile</CardTitle></CardHeader>
              <CardContent>
                {data.profile ? (
                  <dl className="space-y-1.5 text-sm">
                    <div><dt className="text-muted-foreground inline">Display:</dt> {data.profile.displayName}</div>
                    <div><dt className="text-muted-foreground inline">Handle:</dt> @{data.profile.creatorHandle}</div>
                    <div><dt className="text-muted-foreground inline">Public:</dt> {data.profile.profileIsPublic ? "yes" : "no"}</div>
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">No creator profile set</p>
                )}
              </CardContent>
            </Card>

            <Card className="bg-card/50 border-white/5">
              <CardHeader><CardTitle className="text-base">Activity</CardTitle></CardHeader>
              <CardContent>
                <dl className="space-y-1.5 text-sm">
                  <div><dt className="text-muted-foreground inline">Files:</dt> {data.counts.files}</div>
                  <div><dt className="text-muted-foreground inline">Projects:</dt> {data.counts.projects}</div>
                </dl>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}
