import { useState, useCallback } from "react";
import { useParams } from "wouter";
import { useVerifyCertificate } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatBytes, calculateFileHash } from "@/lib/hash";
import { useDropzone } from "react-dropzone";
import { CheckCircle2, XCircle, UploadCloud, File as FileIcon, Loader2, ShieldCheck, User, Calendar, Database } from "lucide-react";

export function VerifyDetail() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localHash, setLocalHash] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);

  const { data, isLoading, isError } = useVerifyCertificate(certificateId!);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setLocalFile(file);
      setIsHashing(true);
      try {
        const hash = await calculateFileHash(file);
        setLocalHash(hash);
      } catch (err) {
        console.error("Hashing failed", err);
      } finally {
        setIsHashing(false);
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 1 });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 py-16 px-4 container mx-auto max-w-5xl">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="w-10 h-10 animate-spin text-primary mb-4" />
            <p className="text-muted-foreground">Retrieving verification record...</p>
          </div>
        ) : isError || !data ? (
          <div className="text-center py-24">
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Certificate Not Found</h2>
            <p className="text-muted-foreground">The certificate ID {certificateId} does not match any public records.</p>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/10 pb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-display font-bold text-foreground">Proof Record</h1>
                  <Badge variant={data.status === 'valid' ? 'default' : 'destructive'} className={data.status === 'valid' ? 'bg-success hover:bg-success/90' : ''}>
                    {data.status.toUpperCase()}
                  </Badge>
                </div>
                <p className="text-muted-foreground font-mono bg-white/5 px-2 py-1 rounded inline-block text-sm">
                  {certificateId}
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Left Column: Metadata */}
              <div className="space-y-6">
                <Card className="p-6 border-white/10 bg-card">
                  <h3 className="font-semibold text-lg mb-6 flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-primary" />
                    Asset Details
                  </h3>
                  
                  <dl className="space-y-4">
                    <div>
                      <dt className="text-sm text-muted-foreground mb-1">File Title</dt>
                      <dd className="font-medium">{data.fileTitle}</dd>
                    </div>
                    {data.projectTitle && (
                      <div>
                        <dt className="text-sm text-muted-foreground mb-1">Project</dt>
                        <dd className="font-medium">{data.projectTitle}</dd>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <dt className="text-sm text-muted-foreground mb-1">Original Name</dt>
                        <dd className="font-medium truncate" title={data.originalFilename}>{data.originalFilename}</dd>
                      </div>
                      <div>
                        <dt className="text-sm text-muted-foreground mb-1">Size</dt>
                        <dd className="font-medium">{formatBytes(Number(data.fileSizeBytes))}</dd>
                      </div>
                    </div>
                    <div>
                      <dt className="text-sm text-muted-foreground mb-1">Stored SHA-256 Hash</dt>
                      <dd className="font-mono text-xs break-all bg-background p-3 rounded-md border border-white/5 text-primary">
                        {data.sha256Hash}
                      </dd>
                    </div>
                  </dl>
                </Card>

                <div className="grid grid-cols-2 gap-4">
                  <Card className="p-5 border-white/10 bg-card">
                    <User className="w-5 h-5 text-muted-foreground mb-3" />
                    <dt className="text-sm text-muted-foreground mb-1">Creator</dt>
                    <dd className="font-semibold truncate">{data.displayName}</dd>
                    <dd className="text-xs text-muted-foreground mt-1">@{data.creatorHandle}</dd>
                  </Card>
                  
                  <Card className="p-5 border-white/10 bg-card">
                    <Calendar className="w-5 h-5 text-muted-foreground mb-3" />
                    <dt className="text-sm text-muted-foreground mb-1">Timestamp (UTC)</dt>
                    <dd className="font-semibold text-sm">
                      {format(new Date(data.recordedAtUtc), "MMM d, yyyy HH:mm:ss")}
                    </dd>
                  </Card>
                </div>
              </div>

              {/* Right Column: Local Verification */}
              <div>
                <Card className="p-6 border-white/10 bg-card h-full flex flex-col">
                  <div className="mb-6">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <Database className="w-5 h-5 text-primary" />
                      Verify Local File
                    </h3>
                    <p className="text-sm text-muted-foreground mt-2">
                      Select a local file to compare its hash against this immutable record. We hash the file entirely in your browser—no data is uploaded.
                    </p>
                  </div>

                  {!localFile ? (
                    <div 
                      {...getRootProps()} 
                      className={`flex-1 min-h-[250px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 transition-colors cursor-pointer
                        ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-white/30 hover:bg-white/5'}`}
                    >
                      <input {...getInputProps()} />
                      <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                      <p className="font-medium text-center mb-1">Drag & drop the original file here</p>
                      <p className="text-sm text-muted-foreground text-center">or click to browse</p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-center space-y-6">
                      <div className="flex items-center gap-4 p-4 bg-background rounded-lg border border-white/5">
                        <FileIcon className="w-8 h-8 text-primary shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-medium truncate">{localFile.name}</p>
                          <p className="text-xs text-muted-foreground">{formatBytes(localFile.size)}</p>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => { setLocalFile(null); setLocalHash(null); }}>
                          Clear
                        </Button>
                      </div>

                      {isHashing ? (
                        <div className="text-center py-8">
                          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-3" />
                          <p className="text-sm text-muted-foreground">Computing SHA-256 locally...</p>
                        </div>
                      ) : localHash ? (
                        <div className={`p-6 rounded-xl border text-center ${localHash === data.sha256Hash ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
                          {localHash === data.sha256Hash ? (
                            <>
                              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
                              <h4 className="text-lg font-bold text-success mb-1">Authenticity Verified</h4>
                              <p className="text-sm text-success/80">
                                The selected file perfectly matches the timestamped record.
                              </p>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                              <h4 className="text-lg font-bold text-destructive mb-1">Mismatch Detected</h4>
                              <p className="text-sm text-destructive/80">
                                The file contents do not match the original timestamped record.
                              </p>
                            </>
                          )}
                          <div className="mt-4 pt-4 border-t border-current/10">
                            <p className="text-xs opacity-70 mb-1">Local File Hash:</p>
                            <p className="font-mono text-xs break-all">{localHash}</p>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                </Card>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
