import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { customFetch } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Globe, ExternalLink, ShieldCheck, FileText, Calendar } from "lucide-react";
import { format } from "date-fns";

const FILE_TYPE_COLORS: Record<string, string> = {
  mp3: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  wav: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  mp4: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  pdf: "bg-red-500/10 text-red-400 border-red-500/20",
  png: "bg-green-500/10 text-green-400 border-green-500/20",
  jpg: "bg-green-500/10 text-green-400 border-green-500/20",
};

export function CreatorProfile() {
  const { handle } = useParams<{ handle: string }>();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["/api/creators", handle],
    queryFn: () => customFetch<any>(`/api/creators/${handle}`),
    retry: false,
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 py-16 px-4 container mx-auto max-w-4xl">
        {isLoading ? (
          <div className="flex justify-center p-24">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : isError || !data ? (
          <div className="text-center py-24">
            <ShieldCheck className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-30" />
            <h2 className="text-2xl font-bold mb-2">Creator Not Found</h2>
            <p className="text-muted-foreground text-sm">
              This creator profile is private or does not exist.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Profile header */}
            <div className="flex flex-col sm:flex-row items-start gap-6 border-b border-white/8 pb-8">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-2xl font-bold text-primary shrink-0">
                {data.profile.displayName?.[0]?.toUpperCase() ?? "?"}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-display font-bold">{data.profile.displayName}</h1>
                <p className="text-muted-foreground text-sm font-mono">@{data.profile.creatorHandle}</p>
                {data.profile.bio && (
                  <p className="text-sm text-foreground/80 mt-3 leading-relaxed max-w-xl">{data.profile.bio}</p>
                )}
                <div className="flex flex-wrap items-center gap-3 mt-4">
                  {data.profile.websiteUrl && (
                    <a href={data.profile.websiteUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                      <Globe className="w-3.5 h-3.5" />
                      {data.profile.websiteUrl.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  {data.profile.memberSince && (
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" />
                      Member since {format(new Date(data.profile.memberSince), "MMMM yyyy")}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Public proofs */}
            <div>
              <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Public Proof Records
                <Badge variant="outline" className="text-xs ml-1">{data.publicProofs?.length ?? 0}</Badge>
              </h2>

              {!data.publicProofs || data.publicProofs.length === 0 ? (
                <Card className="p-8 text-center bg-card/40 border-white/5">
                  <FileText className="w-8 h-8 text-muted-foreground mx-auto mb-3 opacity-40" />
                  <p className="text-muted-foreground text-sm">No public proof records yet.</p>
                </Card>
              ) : (
                <Card className="bg-card/40 border-white/5 overflow-hidden">
                  <div className="divide-y divide-white/5">
                    {data.publicProofs.map((proof: any) => (
                      <div key={proof.id} className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{proof.title}</p>
                          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground flex-wrap">
                            {proof.fileType && (
                              <Badge variant="outline" className={`text-[10px] uppercase ${FILE_TYPE_COLORS[proof.fileType] ?? ""}`}>
                                {proof.fileType}
                              </Badge>
                            )}
                            {proof.projectTitle && <span>{proof.projectTitle}</span>}
                            {proof.certificateId && <span className="font-mono">{proof.certificateId}</span>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-4 shrink-0">
                          <span className="text-xs text-muted-foreground hidden sm:block">
                            {format(new Date(proof.createdAt), "MMM d, yyyy")}
                          </span>
                          {proof.verificationUrl && (
                            <a href={proof.verificationUrl} target="_blank" rel="noreferrer">
                              <Button variant="ghost" size="sm" className="h-7 text-xs text-primary">
                                <ExternalLink className="w-3 h-3 mr-1" /> Verify
                              </Button>
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>

            {/* Legal disclaimer */}
            <p className="text-xs text-muted-foreground/50 text-center">
              OriginLock provides cryptographic evidence of file existence at a point in time. It is not a copyright registration service.{" "}
              <Link href="/legal" className="hover:text-muted-foreground underline">Learn more</Link>
            </p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
