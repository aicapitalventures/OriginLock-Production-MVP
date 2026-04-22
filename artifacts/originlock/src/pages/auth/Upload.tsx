import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetProfile, useListProjects, useListFiles, useUploadFile, UploadFileBodyPrivacyMode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X, Loader2, UserX, CheckCircle2, Lock, Globe, Share2, GitBranch, ShieldCheck, Hash, Clock } from "lucide-react";
import { formatBytes } from "@/lib/hash";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  notes: z.string().optional(),
  projectId: z.string().optional(),
  privacyMode: z.nativeEnum(UploadFileBodyPrivacyMode).default(UploadFileBodyPrivacyMode.private),
  parentFileId: z.string().optional(),
});

type UploadFormValues = z.infer<typeof uploadSchema>;

const PRIVACY_OPTIONS = [
  {
    value: "private",
    label: "Private",
    Icon: Lock,
    desc: "Only you can see this proof record. Certificate is stored but not shared.",
  },
  {
    value: "shareable_certificate",
    label: "Shareable",
    Icon: Share2,
    desc: "Anyone with the verification link can view the certificate and proof details.",
  },
  {
    value: "public_verification",
    label: "Public",
    Icon: Globe,
    desc: "Visible in the public verification directory. Recommended for work you want to openly attribute.",
  },
];

export function Upload() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetProfile({ query: { retry: false }});
  const { data: projects } = useListProjects();
  const { data: allFiles } = useListFiles();
  const upload = useUploadFile();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [successData, setSuccessData] = useState<any>(null);
  const [planError, setPlanError] = useState<{ code: string; message: string } | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { privacyMode: UploadFileBodyPrivacyMode.private }
  });

  const selectedPrivacy = watch("privacyMode") || "private";
  const selectedParent = watch("parentFileId");

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) setFile(acceptedFiles[0]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop, 
    maxFiles: 1,
    accept: {
      'audio/mpeg': ['.mp3'],
      'audio/wav': ['.wav'],
      'video/mp4': ['.mp4'],
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    }
  });

  const parseErrorBody = (err: any): { code?: string; error?: string; message?: string } => {
    try {
      if (err?.body) return typeof err.body === "string" ? JSON.parse(err.body) : err.body;
      if (typeof err?.message === "string" && err.message.trim().startsWith("{")) {
        return JSON.parse(err.message);
      }
    } catch {}
    return {};
  };

  const onSubmit = (data: UploadFormValues) => {
    if (!file) return;
    setPlanError(null);
    upload.mutate({
      data: {
        file,
        title: data.title,
        notes: data.notes || undefined,
        projectId: data.projectId || undefined,
        privacyMode: data.privacyMode,
        parentFileId: data.parentFileId || undefined,
      }
    }, {
      onSuccess: (res) => setSuccessData(res),
      onError: (err: any) => {
        const body = parseErrorBody(err);
        const code = body?.code || body?.error;
        const planCodes = ["PLAN_LIMIT_REACHED", "PLAN_FILE_SIZE_EXCEEDED", "PLAN_FEATURE_LOCKED"];
        if (code && planCodes.includes(code)) {
          const msg =
            code === "PLAN_LIMIT_REACHED" ? "You've reached your plan's file limit. Upgrade to protect more files." :
            code === "PLAN_FILE_SIZE_EXCEEDED" ? "This file exceeds your plan's size limit. Upgrade for larger files." :
            "This feature requires a higher plan.";
          setPlanError({ code, message: msg });
        } else {
          toast({
            title: "Upload failed",
            description: body?.error || err?.message || "Please try again.",
            variant: "destructive",
          });
        }
      },
    });
  };

  if (profileLoading) return <DashboardLayout><div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;

  if (profileError || !profile) {
    return (
      <DashboardLayout>
        <Card className="p-12 text-center max-w-lg mx-auto mt-12 bg-card/50 border-white/5">
          <UserX className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-display font-bold mb-2">Creator Profile Required</h2>
          <p className="text-muted-foreground mb-8 text-sm">
            Before protecting assets, you must configure your creator profile. This ensures your certificates are properly attributed to your identity.
          </p>
          <Link href="/dashboard/profile">
            <Button size="lg">Create Profile Now</Button>
          </Link>
        </Card>
      </DashboardLayout>
    );
  }

  if (successData) {
    return (
      <DashboardLayout>
        <Card className="p-8 max-w-2xl mx-auto mt-8 bg-card/50 border-success/20">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-9 h-9 text-success" />
            </div>
            <h2 className="text-2xl font-display font-bold text-success mb-2">Proof Record Generated</h2>
            <p className="text-muted-foreground text-sm">Your file has been cryptographically fingerprinted and indelibly timestamped.</p>
          </div>
          
          <div className="bg-background/80 p-5 rounded-xl border border-white/5 text-left space-y-4 mb-8">
            <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wide border-b border-white/5 pb-3">
              <ShieldCheck className="w-4 h-4 text-primary" />
              Certificate Summary
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Hash className="w-3 h-3"/>Certificate ID</p>
                <p className="font-mono text-sm font-medium">{successData.certificateId}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1"><Clock className="w-3 h-3"/>Timestamp (UTC)</p>
                <p className="text-sm font-medium">{new Date(successData.recordedAtUtc).toUTCString()}</p>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">SHA-256 Hash</p>
              <p className="font-mono text-xs break-all text-primary bg-primary/5 p-2 rounded">{successData.sha256Hash}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/dashboard/files/${successData.fileId}`}>
              <Button className="w-full sm:w-auto">View Full Record</Button>
            </Link>
            <Button variant="outline" className="w-full sm:w-auto border-white/10" onClick={() => { setSuccessData(null); setFile(null); }}>
              Protect Another File
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Protect a File</h1>
          <p className="text-muted-foreground text-sm">
            Generate an immutable cryptographic proof record. Your file is hashed locally — only the fingerprint and metadata are stored.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Dropzone */}
          <Card className={`border-dashed transition-all duration-200 ${file ? 'border-success/40' : isDragActive ? 'border-primary bg-primary/5' : 'border-white/15 hover:border-white/30'}`}>
            {!file ? (
              <div {...getRootProps()} className="min-h-[200px] flex flex-col items-center justify-center p-8 cursor-pointer rounded-lg">
                <input {...getInputProps()} />
                <UploadCloud className="w-10 h-10 text-muted-foreground mb-4 opacity-50" />
                <p className="font-medium mb-1">{isDragActive ? "Drop to hash" : "Drag & drop your file here"}</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <div className="flex flex-wrap gap-1.5 justify-center text-xs text-muted-foreground">
                  {["MP3", "WAV", "MP4", "PDF", "PNG", "JPG"].map(t => (
                    <span key={t} className="bg-white/5 px-2 py-1 rounded-md border border-white/5">{t}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-5 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <FileIcon className="w-5 h-5 text-success" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate text-sm">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <Button type="button" variant="ghost" size="sm" className="text-muted-foreground" onClick={() => setFile(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
          </Card>

          <div className="space-y-5">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Asset Title <span className="text-destructive">*</span></Label>
              <Input id="title" {...register("title")} className="bg-card border-white/10" placeholder="e.g. Symphony No. 9 — Final Draft" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            {/* Project */}
            {projects && projects.length > 0 && (
              <div className="space-y-2">
                <Label htmlFor="projectId">Project <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                <Select onValueChange={(val) => setValue("projectId", val === "__none__" ? "" : val)}>
                  <SelectTrigger className="bg-card border-white/10">
                    <SelectValue placeholder="Group under a project..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">No project</SelectItem>
                    {projects.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Version Chain */}
            {allFiles && allFiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="parentFileId">Prior Version <span className="text-xs text-muted-foreground font-normal">(optional)</span></Label>
                  <Badge variant="outline" className="text-xs border-primary/20 text-primary/80 bg-primary/5">
                    <GitBranch className="w-3 h-3 mr-1" />Version chain
                  </Badge>
                </div>
                <Select onValueChange={(val) => setValue("parentFileId", val === "__none__" ? "" : val)}>
                  <SelectTrigger className="bg-card border-white/10">
                    <SelectValue placeholder="Link to an earlier version of this work..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Original work (no prior version)</SelectItem>
                    {allFiles.map(f => (
                      <SelectItem key={f.id} value={f.id}>
                        {f.title} {f.certificateId ? `(${f.certificateId})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Creates a verifiable chain: earlier proof → this proof. Establishes evolution continuity without overwriting the original record.
                </p>
              </div>
            )}

            {/* Privacy Mode */}
            <div className="space-y-3">
              <Label>Privacy Level</Label>
              <RadioGroup 
                defaultValue="private" 
                onValueChange={(v) => setValue("privacyMode", v as UploadFileBodyPrivacyMode)} 
                className="space-y-2"
              >
                {PRIVACY_OPTIONS.map((opt) => {
                  const Icon = opt.Icon;
                  const isSelected = selectedPrivacy === opt.value;
                  return (
                    <div key={opt.value} className="relative">
                      <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                      <Label
                        htmlFor={opt.value}
                        className={`flex items-start gap-4 rounded-xl border p-4 cursor-pointer transition-all ${
                          isSelected 
                            ? 'border-primary/40 bg-primary/5' 
                            : 'border-white/8 bg-card/40 hover:border-white/20'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isSelected ? 'bg-primary/15' : 'bg-white/5'}`}>
                          <Icon className={`w-4 h-4 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{opt.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                        </div>
                        {isSelected && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                      </Label>
                    </div>
                  );
                })}
              </RadioGroup>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes <span className="text-xs text-muted-foreground font-normal">(private, optional)</span></Label>
              <Textarea id="notes" {...register("notes")} className="bg-card border-white/10 resize-none" rows={3} placeholder="Private context about this file..." />
              <p className="text-xs text-muted-foreground">Never shown publicly. Only visible to you.</p>
            </div>
          </div>

          {/* Trust footer */}
          <div className="bg-card/30 border border-white/5 rounded-xl p-4 flex gap-3 text-sm text-muted-foreground">
            <ShieldCheck className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <p>Your file is hashed in your browser using SHA-256. The raw file is never sent to our servers. Only the fingerprint, size, and type metadata are stored.</p>
          </div>

          {planError && (
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex-1">
                <p className="font-medium text-amber-500 mb-1">Upgrade required</p>
                <p className="text-sm text-muted-foreground">{planError.message}</p>
              </div>
              <Link href="/pricing">
                <Button variant="outline" className="border-amber-500/40 text-amber-500 hover:bg-amber-500/10 shrink-0">
                  View plans
                </Button>
              </Link>
            </div>
          )}

          <Button type="submit" disabled={!file || upload.isPending} size="lg" className="w-full font-semibold">
            {upload.isPending 
              ? <><Loader2 className="w-5 h-5 animate-spin mr-2" /> Generating Proof Record...</>
              : <><ShieldCheck className="w-5 h-5 mr-2" /> Generate Proof Record</>
            }
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
