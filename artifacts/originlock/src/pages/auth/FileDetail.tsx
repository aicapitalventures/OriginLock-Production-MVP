import { useParams } from "wouter";
import { useGetFile, downloadCertificate } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Copy, ExternalLink, ShieldCheck, FileText, Clock, Hash } from "lucide-react";
import { format } from "date-fns";
import { formatBytes } from "@/lib/hash";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function FileDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetFile(id!);
  const { toast } = useToast();
  const [isDownloading, setIsDownloading] = useState(false);

  if (isLoading) return <DashboardLayout><div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;
  if (isError || !data) return <DashboardLayout><div className="p-12 text-center text-destructive">Record not found.</div></DashboardLayout>;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const blob = await downloadCertificate(id!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OriginLock_Cert_${data.certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      toast({ title: "Error", description: "Failed to download certificate.", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-6">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-3xl font-display font-bold">{data.title}</h1>
              <Badge variant="outline" className="uppercase text-[10px]">{data.privacyMode.replace('_', ' ')}</Badge>
            </div>
            <p className="text-muted-foreground flex items-center gap-2 text-sm">
              <FileText className="w-4 h-4" /> {data.originalFilename} • {formatBytes(Number(data.fileSizeBytes))}
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" className="flex-1 sm:flex-none" onClick={handleDownload} disabled={isDownloading}>
              {isDownloading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              PDF Certificate
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-2 p-6 bg-card border-white/10 space-y-6">
            <h3 className="font-semibold text-lg flex items-center gap-2 border-b border-white/5 pb-4">
              <ShieldCheck className="w-5 h-5 text-primary" /> Cryptographic Proof
            </h3>
            
            <div>
              <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><Hash className="w-3 h-3"/> SHA-256 Hash</p>
              <div className="flex gap-2">
                <code className="flex-1 bg-background p-3 rounded-md border border-white/5 text-primary text-xs break-all">
                  {data.sha256Hash}
                </code>
                <Button variant="ghost" size="icon" onClick={() => handleCopy(data.sha256Hash, "Hash")}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Timestamp (UTC)</p>
                <p className="font-medium">{format(new Date(data.recordedAtUtc || data.createdAt), "MMM d, yyyy HH:mm:ss")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1"><FileText className="w-3 h-3"/> File Type</p>
                <p className="font-medium">{data.mimeType}</p>
              </div>
            </div>

            {data.notes && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Internal Notes</p>
                <p className="text-sm p-4 bg-background rounded-md border border-white/5 whitespace-pre-wrap">{data.notes}</p>
              </div>
            )}
          </Card>

          <div className="space-y-6">
            <Card className="p-6 bg-card border-white/10">
              <h3 className="font-semibold mb-4">Certificate</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">ID</p>
                  <p className="font-mono text-sm">{data.certificateId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className="bg-success">{data.certificateStatus?.toUpperCase()}</Badge>
                </div>
                {data.verificationUrl && (
                  <div className="pt-4 border-t border-white/5">
                    <Button variant="secondary" className="w-full text-xs" onClick={() => handleCopy(data.verificationUrl!, "URL")}>
                      <Copy className="w-3 h-3 mr-2" /> Copy Verify Link
                    </Button>
                    <Button variant="ghost" className="w-full text-xs mt-2" asChild>
                      <a href={data.verificationUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3 h-3 mr-2" /> Open Verification
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {data.projectId && (
              <Card className="p-6 bg-card border-white/10">
                <h3 className="font-semibold mb-2">Project</h3>
                <p className="text-sm">{data.projectTitle}</p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
