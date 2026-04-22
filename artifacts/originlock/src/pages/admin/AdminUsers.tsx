import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { customFetch } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AdminUser {
  id: string;
  email: string;
  tier: string;
  status: string | null;
  isAdmin: boolean;
  createdAt: string;
  handle: string | null;
  displayName: string | null;
}

export function AdminUsers() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery<AdminUser[]>({
    queryKey: ["admin", "users", q],
    queryFn: () => customFetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`),
  });

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-display font-bold mb-1">Users</h1>
        <p className="text-muted-foreground text-sm">Search and inspect user accounts.</p>
      </div>

      <Input
        placeholder="Search by email or handle..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="max-w-md mb-4 bg-card/50 border-white/10"
      />

      <Card className="bg-card/50 border-white/5">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-muted-foreground">Loading...</div>
          ) : !data || data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No users found</div>
          ) : (
            <div className="divide-y divide-white/5">
              {data.map((u) => (
                <Link
                  key={u.id}
                  href={`/admin/users/${u.id}`}
                  className="flex items-center justify-between p-4 hover:bg-white/5 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium truncate">{u.email}</span>
                      {u.isAdmin && <Badge variant="outline" className="text-xs">admin</Badge>}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {u.displayName ? `${u.displayName} · @${u.handle}` : "no profile"}
                      {" · joined "}
                      {format(new Date(u.createdAt), "MMM d, yyyy")}
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize text-xs shrink-0 ml-2">
                    {u.tier}{u.status === "active" ? " · active" : ""}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
