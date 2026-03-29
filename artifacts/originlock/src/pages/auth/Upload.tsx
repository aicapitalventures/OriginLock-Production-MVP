import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetProfile, useListProjects, useUploadFile, UploadFileBodyPrivacyMode } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File as FileIcon, X, Loader2, UserX, CheckCircle, Shield } from "lucide-react";
import { formatBytes } from "@/lib/hash";

const uploadSchema = z.object({
  title: z.string().min(1, "Title is required"),
  notes: z.string().optional(),
  projectId: z.string().optional(),
  privacyMode: z.nativeEnum(UploadFileBodyPrivacyMode).default(UploadFileBodyPrivacyMode.private)
});

type UploadFormValues = z.infer<typeof uploadSchema>;

export function Upload() {
  const [, setLocation] = useLocation();
  const { data: profile, isLoading: profileLoading, isError: profileError } = useGetProfile({ query: { retry: false }});
  const { data: projects } = useListProjects();
  const upload = useUploadFile();
  
  const [file, setFile] = useState<File | null>(null);
  const [successData, setSuccessData] = useState<any>(null);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<UploadFormValues>({
    resolver: zodResolver(uploadSchema),
    defaultValues: { privacyMode: UploadFileBodyPrivacyMode.private }
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) {
      setFile(acceptedFiles[0]);
    }
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

  const onSubmit = (data: UploadFormValues) => {
    if (!file) return;
    
    upload.mutate({
      data: {
        file,
        title: data.title,
        notes: data.notes || undefined,
        projectId: data.projectId || undefined,
        privacyMode: data.privacyMode
      }
    }, {
      onSuccess: (res) => {
        setSuccessData(res);
      }
    });
  };

  if (profileLoading) return <DashboardLayout><div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;

  // Must have a profile to upload
  if (profileError || !profile) {
    return (
      <DashboardLayout>
        <Card className="p-12 text-center max-w-lg mx-auto mt-12 bg-card/50 border-white/5">
          <UserX className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold mb-2">Creator Profile Required</h2>
          <p className="text-muted-foreground mb-8">
            Before protecting assets, you must configure your creator profile. This ensures your certificates are properly attributed to your legal or professional identity.
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
        <Card className="p-8 max-w-2xl mx-auto mt-8 bg-card/50 border-success/30 text-center">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h2 className="text-2xl font-display font-bold text-success mb-2">Asset Protected Successfully</h2>
          <p className="text-muted-foreground mb-6">Your file has been cryptographically hashed and indelibly timestamped.</p>
          
          <div className="bg-background p-4 rounded-xl border border-white/5 text-left mb-8 space-y-3">
            <div>
              <span className="text-xs text-muted-foreground">Certificate ID</span>
              <p className="font-mono text-sm">{successData.certificateId}</p>
            </div>
            <div>
              <span className="text-xs text-muted-foreground">SHA-256 Hash</span>
              <p className="font-mono text-xs break-all text-primary">{successData.sha256Hash}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={`/dashboard/files/${successData.fileId}`}>
              <Button className="w-full sm:w-auto">View Full Record</Button>
            </Link>
            <Button variant="outline" className="w-full sm:w-auto" onClick={() => {
              setSuccessData(null);
              setFile(null);
            }}>
              Protect Another File
            </Button>
          </div>
        </Card>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-display font-bold mb-2">Protect a File</h1>
        <p className="text-muted-foreground mb-8">Generate an immutable proof record for your asset.</p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Dropzone */}
          <Card className={`p-1 border-dashed transition-all duration-200 ${!file && isDragActive ? 'border-primary bg-primary/5' : 'border-white/20 hover:border-white/40'}`}>
            {!file ? (
              <div {...getRootProps()} className="min-h-[200px] flex flex-col items-center justify-center p-8 cursor-pointer">
                <input {...getInputProps()} />
                <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="font-medium mb-1">Drag & drop your file here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <div className="flex gap-2 text-xs text-muted-foreground">
                  <span className="bg-white/5 px-2 py-1 rounded">MP3/WAV</span>
                  <span className="bg-white/5 px-2 py-1 rounded">MP4</span>
                  <span className="bg-white/5 px-2 py-1 rounded">PDF</span>
                  <span className="bg-white/5 px-2 py-1 rounded">JPG/PNG</span>
                </div>
              </div>
            ) : (
              <div className="p-6 flex flex-col sm:flex-row items-center gap-4 bg-background/50 rounded-lg">
                <FileIcon className="w-10 h-10 text-primary shrink-0" />
                <div className="min-w-0 flex-1 text-center sm:text-left">
                  <p className="font-medium truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => setFile(null)}>
                  <X className="w-4 h-4 mr-2" /> Remove
                </Button>
              </div>
            )}
          </Card>

          {/* Form Fields */}
          <div className="grid gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Asset Title <span className="text-destructive">*</span></Label>
              <Input id="title" {...register("title")} className="bg-card border-white/10" placeholder="e.g. Symphony No. 9 Draft" />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectId">Project (Optional)</Label>
              <Select onValueChange={(val) => setValue("projectId", val)}>
                <SelectTrigger className="bg-card border-white/10">
                  <SelectValue placeholder="Select a project folder" />
                </SelectTrigger>
                <SelectContent>
                  {projects?.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Privacy & Sharing</Label>
              <RadioGroup defaultValue="private" onValueChange={(v) => setValue("privacyMode", v as UploadFileBodyPrivacyMode)} className="grid sm:grid-cols-3 gap-4">
                {[
                  { value: "private", label: "Private", desc: "Only you can see this record" },
                  { value: "shareable_certificate", label: "Shareable", desc: "Anyone with the link can view" },
                  { value: "public_verification", label: "Public", desc: "Searchable in verification directory" },
                ].map((opt) => (
                  <div key={opt.value}>
                    <RadioGroupItem value={opt.value} id={opt.value} className="peer sr-only" />
                    <Label
                      htmlFor={opt.value}
                      className="flex flex-col items-center justify-between rounded-xl border-2 border-white/5 bg-card p-4 hover:bg-white/5 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer text-center h-full"
                    >
                      <span className="font-semibold mb-1">{opt.label}</span>
                      <span className="text-xs text-muted-foreground font-normal">{opt.desc}</span>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes (Optional)</Label>
              <Textarea id="notes" {...register("notes")} className="bg-card border-white/10 resize-none" rows={3} placeholder="Add any private context..." />
            </div>
          </div>

          <Button type="submit" disabled={!file || upload.isPending} className="w-full h-12 text-base font-semibold">
            {upload.isPending ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Shield className="w-5 h-5 mr-2" />}
            {upload.isPending ? "Generating Proof..." : "Generate Proof Record"}
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
