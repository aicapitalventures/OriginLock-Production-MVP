import { useParams, Link } from "wouter";
import { useGetFile, downloadCertificate } from "@workspace/api-client-react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, Copy, ExternalLink, ShieldCheck, FileText, Clock, Hash, PackageOpen, GitBranch, Lock, Share2, Globe } from "lucide-react";
import { format } from "date-fns";
import { formatBytes } from "@/lib/hash";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { customFetch } from "@workspace/api-client-react";

const PRIVACY_LABELS: Record<string, { label: string; Icon: any; color: string }> = {
  private: { label: "Private", Icon: Lock, color: "text-muted-foreground" },
  shareable_certificate: { label: "Shareable", Icon: Share2, color: "text-blue-400" },
  public_verification: { label: "Public", Icon: Globe, color: "text-green-400" },
};

export function FileDetail() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError } = useGetFile(id!);
  const { toast } = useToast();
  const [isDownloadingCert, setIsDownloadingCert] = useState(false);
  const [isDownloadingEvidence, setIsDownloadingEvidence] = useState(false);

  if (isLoading) return <DashboardLayout><div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;
  if (isError || !data) return <DashboardLayout><div className="p-12 text-center text-muted-foreground">Record not found.</div></DashboardLayout>;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ description: `${label} copied to clipboard.` });
  };

  const handleDownloadCert = async () => {
    setIsDownloadingCert(true);
    try {
      const blob = await downloadCertificate(id!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OriginLock_${data.certificateId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Error", description: "Failed to download certificate.", variant: "destructive" });
    } finally {
      setIsDownloadingCert(false);
    }
  };

  const handleDownloadEvidence = async () => {
    setIsDownloadingEvidence(true);
    try {
      const resp = await customFetch(`/api/files/${id}/evidence-package`, { method: "GET" });
      const blob = await (resp as any).blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `OriginLock_Evidence_${data.certificateId}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      toast({ title: "Error", description: "Failed to download evidence package.", variant: "destructive" });
    } finally {
      setIsDownloadingEvidence(false);
    }
  };

  const privacy = PRIVACY_LABELS[data.privacyMode] ?? PRIVACY_LABELS.private;
  const PrivacyIcon = privacy.Icon;

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/8 pb-6">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 mb-1.5 flex-wrap">
              <h1 className="text-2xl font-display font-bold">{data.title}</h1>
              <Badge variant="outline" className={`uppercase text-[10px] shrink-0 ${privacy.color} border-current/20`}>
                <PrivacyIcon className="w-3 h-3 mr-1" />
                {privacy.label}
              </Badge>
              {(data as any).parentFileId && (
                <Badge variant="outline" className="text-[10px] text-primary/80 border-primary/20 shrink-0">
                  <GitBranch className="w-3 h-3 mr-1" />Revision
                </Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <FileText className="w-3.5 h-3.5" />
              {data.originalFilename}
              <span className="w-1 h-1 rounded-full bg-white/20" />
              {formatBytes(Number(data.fileSizeBytes))}
              {data.projectTitle && (
                <>
                  <span className="w-1 h-1 rounded-full bg-white/20" />
                  {data.projectTitle}
                </>
              )}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/10 flex-1 sm:flex-none" 
              onClick={handleDownloadCert} 
              disabled={isDownloadingCert}
            >
              {isDownloadingCert ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
              PDF Certificate
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-primary/30 text-primary hover:bg-primary/5 flex-1 sm:flex-none"
              onClick={handleDownloadEvidence} 
              disabled={isDownloadingEvidence}
            >
              {isDownloadingEvidence ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <PackageOpen className="w-4 h-4 mr-2" />}
              Evidence Package
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {/* Cryptographic Proof */}
          <Card className="md:col-span-2 p-6 bg-card border-white/8 space-y-5">
            <h3 className="font-semibold flex items-center gap-2 text-sm border-b border-white/5 pb-4">
              <ShieldCheck className="w-4 h-4 text-primary" /> Cryptographic Proof Record
            </h3>
            
            <div>
              <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1">
                <Hash className="w-3 h-3"/> SHA-256 Hash
              </p>
              <div className="flex gap-2">
                <code className="flex-1 bg-background p-3 rounded-lg border border-white/5 text-primary text-xs break-all font-mono">
                  {data.sha256Hash}
                </code>
                <Button variant="ghost" size="icon" className="shrink-0" onClick={() => handleCopy(data.sha256Hash, "Hash")}>
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-5">
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/> Timestamp (UTC)</p>
                <p className="font-medium text-sm">{format(new Date(data.recordedAtUtc || data.createdAt), "MMM d, yyyy HH:mm:ss")}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">File Type</p>
                <Badge variant="outline" className="uppercase text-xs">{data.fileType}</Badge>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">MIME Type</p>
                <p className="font-medium text-sm font-mono text-xs">{data.mimeType}</p>
              </div>
            </div>

            {data.displayName && (
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-muted-foreground mb-1">Creator Attribution</p>
                <p className="font-medium text-sm">{data.displayName} <span className="text-muted-foreground font-normal">@{data.creatorHandle}</span></p>
              </div>
            )}

            {data.notes && (
              <div className="pt-4 border-t border-white/5">
                <p className="text-xs text-muted-foreground mb-1.5">Internal Notes</p>
                <p className="text-sm p-4 bg-background rounded-lg border border-white/5 whitespace-pre-wrap text-muted-foreground">{data.notes}</p>
              </div>
            )}
          </Card>

          {/* Right column */}
          <div className="space-y-4">
            <Card className="p-5 bg-card border-white/8">
              <h3 className="font-semibold text-sm mb-4">Certificate</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Certificate ID</p>
                  <p className="font-mono text-sm font-medium">{data.certificateId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Status</p>
                  <Badge className="bg-success/90 hover:bg-success/90 text-xs">
                    {data.certificateStatus?.toUpperCase() ?? "VALID"}
                  </Badge>
                </div>
                {data.verificationUrl && (
                  <div className="pt-3 border-t border-white/5 space-y-2">
                    <Button variant="secondary" className="w-full text-xs h-8" onClick={() => handleCopy(data.verificationUrl!, "Verification URL")}>
                      <Copy className="w-3 h-3 mr-2" /> Copy Verify Link
                    </Button>
                    <Button variant="ghost" className="w-full text-xs h-8" asChild>
                      <a href={data.verificationUrl} target="_blank" rel="noreferrer">
                        <ExternalLink className="w-3 h-3 mr-2" /> Open Verification Page
                      </a>
                    </Button>
                  </div>
                )}
              </div>
            </Card>

            {data.projectId && (
              <Card className="p-5 bg-card border-white/8">
                <h3 className="font-semibold text-sm mb-2">Project</h3>
                <Link href={`/dashboard/projects/${data.projectId}`}>
                  <p className="text-sm text-primary hover:underline">{data.projectTitle}</p>
                </Link>
              </Card>
            )}

            {/* Version chain indicator */}
            {(data as any).parentFileId && (
              <Card className="p-5 bg-card border-primary/15">
                <h3 className="font-semibold text-sm mb-2 flex items-center gap-2 text-primary">
                  <GitBranch className="w-4 h-4" /> Version Chain
                </h3>
                <p className="text-xs text-muted-foreground mb-3">This is a revision linked to an earlier proof record.</p>
                <Link href={`/dashboard/files/${(data as any).parentFileId}`}>
                  <Button variant="outline" size="sm" className="w-full text-xs border-white/10">
                    View Prior Version →
                  </Button>
                </Link>
              </Card>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
