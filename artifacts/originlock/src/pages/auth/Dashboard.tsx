import { Link } from "wouter";
import { useGetDashboardStats, useListFiles } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Shield, FolderKanban, FileBadge, CheckCircle, ArrowRight, Upload } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: files, isLoading: filesLoading } = useListFiles();

  const statCards = [
    { title: "Protected Files", value: stats?.protectedFiles ?? 0, icon: Shield, color: "text-blue-500" },
    { title: "Projects", value: stats?.projects ?? 0, icon: FolderKanban, color: "text-purple-500" },
    { title: "Certificates", value: stats?.certificates ?? 0, icon: FileBadge, color: "text-amber-500" },
    { title: "Verification Checks", value: stats?.verificationChecks ?? 0, icon: CheckCircle, color: "text-green-500" },
  ];

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your protected assets and activity.</p>
        </div>
        <Link href="/dashboard/upload">
          <Button className="shadow-lg shadow-primary/20">
            <Upload className="w-4 h-4 mr-2" />
            Protect New File
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <Card key={i} className="bg-card/50 backdrop-blur-sm border-white/5">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</p>
                {statsLoading ? (
                  <div className="h-8 w-16 bg-white/10 animate-pulse rounded" />
                ) : (
                  <h3 className="text-3xl font-bold font-display">{stat.value}</h3>
                )}
              </div>
              <div className={`p-3 rounded-full bg-white/5 ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Files */}
      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
          <CardTitle className="text-lg">Recent Protected Files</CardTitle>
          <Link href="/dashboard/files" className="text-sm text-primary hover:underline flex items-center">
            View All <ArrowRight className="w-4 h-4 ml-1" />
          </Link>
        </CardHeader>
        <CardContent className="p-0">
          {filesLoading ? (
            <div className="p-8 text-center text-muted-foreground animate-pulse">Loading files...</div>
          ) : !files || files.length === 0 ? (
            <div className="p-12 text-center">
              <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No files protected yet</h3>
              <p className="text-muted-foreground text-sm mb-6">Upload your first asset to secure its proof of existence.</p>
              <Link href="/dashboard/upload">
                <Button variant="outline">Upload File</Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {files.slice(0, 5).map((file) => (
                <Link key={file.id} href={`/dashboard/files/${file.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-white/5 transition-colors group">
                  <div className="min-w-0 flex-1 mb-2 sm:mb-0">
                    <h4 className="font-medium truncate text-foreground group-hover:text-primary transition-colors">{file.title}</h4>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                      <span className="uppercase">{file.fileType}</span>
                      {file.projectTitle && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="truncate max-w-[120px]">{file.projectTitle}</span>
                        </>
                      )}
                      <span className="w-1 h-1 rounded-full bg-white/20" />
                      <span>{format(new Date(file.createdAt), 'MMM d, yyyy')}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className="bg-background text-xs">
                      {file.privacyMode.replace('_', ' ')}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
