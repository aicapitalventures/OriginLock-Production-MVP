import { Link, useParams } from "wouter";
import { useGetProject } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, Loader2, FolderKanban } from "lucide-react";
import { format } from "date-fns";

function formatFileSize(bytes: string): string {
  const n = Number(bytes);
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

const PRIVACY_LABELS: Record<string, string> = {
  private: "Private",
  shareable_certificate: "Shareable Certificate",
  public_verification: "Public Verification",
};

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: project, isLoading, isError } = useGetProject(id);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (isError || !project) {
    return (
      <DashboardLayout>
        <div className="text-center p-12">
          <p className="text-muted-foreground">Project not found.</p>
          <Link href="/dashboard/projects">
            <Button variant="outline" className="mt-4">Back to Projects</Button>
          </Link>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-8">
        <Link href="/dashboard/projects" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          All Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <FolderKanban className="w-6 h-6 text-primary" />
              <h1 className="text-3xl font-bold">{project.title}</h1>
            </div>
            {project.description && (
              <p className="text-muted-foreground mt-1 max-w-2xl">{project.description}</p>
            )}
            <p className="text-xs text-muted-foreground mt-3">
              Updated {format(new Date(project.updatedAt), "MMM d, yyyy")} · {project.fileCount} {project.fileCount === 1 ? "file" : "files"}
            </p>
          </div>
          <Link href="/dashboard/upload">
            <Button variant="outline">Add File</Button>
          </Link>
        </div>
      </div>

      {!project.files || project.files.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 border-white/5">
          <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No files in this project</h3>
          <p className="text-muted-foreground text-sm mb-6">Upload a file and assign it to this project.</p>
          <Link href="/dashboard/upload">
            <Button>Upload File</Button>
          </Link>
        </Card>
      ) : (
        <div className="space-y-3">
          {project.files.map((file) => (
            <Link key={file.id} href={`/dashboard/files/${file.id}`}>
              <Card className="hover:bg-card/80 border-white/5 hover:border-primary/20 transition-all cursor-pointer">
                <CardContent className="flex items-center justify-between p-4 gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{file.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{file.originalFilename}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <Badge variant="outline" className="hidden sm:flex text-xs font-mono">
                      {file.fileType?.toUpperCase()}
                    </Badge>
                    <Badge
                      variant="outline"
                      className="text-xs"
                    >
                      {PRIVACY_LABELS[file.privacyMode] || file.privacyMode}
                    </Badge>
                    <span className="text-xs text-muted-foreground hidden md:block">
                      {format(new Date(file.createdAt), "MMM d, yyyy")}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
