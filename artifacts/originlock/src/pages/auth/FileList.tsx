import { Link } from "wouter";
import { useListFiles } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Shield, Upload, Loader2, FileText } from "lucide-react";
import { format } from "date-fns";
import { formatBytes } from "@/lib/hash";

const FILE_TYPE_COLORS: Record<string, string> = {
  mp3: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  wav: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  mp4: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pdf: "bg-red-500/10 text-red-400 border-red-500/20",
  png: "bg-green-500/10 text-green-400 border-green-500/20",
  jpg: "bg-green-500/10 text-green-400 border-green-500/20",
};

const PRIVACY_LABELS: Record<string, string> = {
  private: "Private",
  shareable_certificate: "Shareable",
  public_verification: "Public",
};

export function FileList() {
  const { data: files, isLoading } = useListFiles();

  return (
    <DashboardLayout>
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-display font-bold">Protected Files</h1>
          <p className="text-muted-foreground mt-1">
            All your cryptographically timestamped assets.
          </p>
        </div>
        <Link href="/dashboard/upload">
          <Button className="shadow-lg shadow-primary/20">
            <Upload className="w-4 h-4 mr-2" />
            Protect New File
          </Button>
        </Link>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !files || files.length === 0 ? (
        <Card className="p-12 text-center bg-card/50 border-white/5">
          <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-medium mb-2">No files protected yet</h3>
          <p className="text-muted-foreground text-sm mb-6">
            Upload your first asset to generate an immutable proof record.
          </p>
          <Link href="/dashboard/upload">
            <Button>Upload File</Button>
          </Link>
        </Card>
      ) : (
        <Card className="bg-card/50 border-white/5 overflow-hidden">
          <div className="divide-y divide-white/5">
            {files.map((file) => (
              <Link
                key={file.id}
                href={`/dashboard/files/${file.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 hover:bg-white/5 transition-colors group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 mb-2 sm:mb-0">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium truncate text-foreground group-hover:text-primary transition-colors">
                      {file.title}
                    </h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                      <span className="truncate max-w-[160px]">
                        {file.originalFilename}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                      <span>{formatBytes(Number(file.fileSizeBytes))}</span>
                      {file.projectTitle && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20 shrink-0" />
                          <span className="truncate max-w-[100px]">
                            {file.projectTitle}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-13 sm:ml-0">
                  {file.fileType && (
                    <Badge
                      variant="outline"
                      className={`text-xs uppercase hidden sm:flex ${FILE_TYPE_COLORS[file.fileType] ?? ""}`}
                    >
                      {file.fileType}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs">
                    {PRIVACY_LABELS[file.privacyMode] || file.privacyMode.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground hidden md:block whitespace-nowrap">
                    {format(new Date(file.createdAt), "MMM d, yyyy")}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </Card>
      )}
    </DashboardLayout>
  );
}
