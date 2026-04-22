import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useGetProfile, useCreateProfile, useUpdateProfile } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Loader2, Save, Globe, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  creatorHandle: z.string().min(1, "Handle is required").regex(/^[a-z0-9_]+$/, "Handle: lowercase letters, numbers, underscores only"),
  legalName: z.string().optional(),
  pseudonym: z.string().optional(),
  bio: z.string().max(400, "Bio must be 400 characters or fewer").optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  claimStatement: z.string().optional(),
  profileIsPublic: z.boolean().default(false),
});

export function Profile() {
  const { data: profile, isLoading } = useGetProfile({ query: { retry: false } });
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const isEditing = !!profile;

  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isDirty } } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { profileIsPublic: false }
  });

  const profileIsPublic = watch("profileIsPublic");
  const bioValue = watch("bio") || "";

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName,
        creatorHandle: profile.creatorHandle,
        legalName: profile.legalName || "",
        pseudonym: profile.pseudonym || "",
        bio: profile.bio || "",
        websiteUrl: profile.websiteUrl || "",
        claimStatement: profile.claimStatement || "",
        profileIsPublic: (profile as any).profileIsPublic ?? false,
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === "" ? undefined : v])
    ) as any;

    if (isEditing) {
      updateProfile.mutate({ data: cleanData }, {
        onSuccess: () => toast({ title: "Profile updated", description: "Your creator profile has been saved." })
      });
    } else {
      createProfile.mutate({ data: cleanData }, {
        onSuccess: () => toast({ title: "Profile created", description: "Welcome to OriginLock." })
      });
    }
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold mb-2">Creator Profile</h1>
          <p className="text-muted-foreground text-sm">
            This information is embedded in your certificates and optionally displayed on your public creator page.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="p-6 bg-card/50 border-white/5 space-y-6">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-4">Identity</h3>
              <div className="grid sm:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Public Display Name <span className="text-destructive">*</span></Label>
                  <Input id="displayName" {...register("displayName")} className="bg-background border-white/10" placeholder="Jane Doe" />
                  {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="creatorHandle">Creator Handle <span className="text-destructive">*</span></Label>
                  <div className="flex items-center">
                    <span className="text-muted-foreground text-sm px-3 h-10 flex items-center bg-background border border-white/10 border-r-0 rounded-l-md">@</span>
                    <Input id="creatorHandle" {...register("creatorHandle")} className="bg-background border-white/10 rounded-l-none" placeholder="jane_creates" />
                  </div>
                  {errors.creatorHandle && <p className="text-xs text-destructive">{errors.creatorHandle.message}</p>}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-5 pt-2 border-t border-white/5">
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name <span className="text-xs text-muted-foreground font-normal">(private)</span></Label>
                <Input id="legalName" {...register("legalName")} className="bg-background border-white/10" placeholder="Your full legal name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website</Label>
                <Input id="websiteUrl" type="url" {...register("websiteUrl")} className="bg-background border-white/10" placeholder="https://yoursite.com" />
                {errors.websiteUrl && <p className="text-xs text-destructive">{errors.websiteUrl.message}</p>}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <div className="flex justify-between items-center">
                <Label htmlFor="bio">Bio</Label>
                <span className={`text-xs ${bioValue.length > 360 ? 'text-amber-400' : 'text-muted-foreground'}`}>{bioValue.length}/400</span>
              </div>
              <Textarea id="bio" {...register("bio")} className="bg-background border-white/10 resize-none" rows={3} placeholder="Briefly describe your creative work..." />
              {errors.bio && <p className="text-xs text-destructive">{errors.bio.message}</p>}
            </div>

            <div className="space-y-2 pt-2 border-t border-white/5">
              <Label htmlFor="claimStatement">Default Claim Statement</Label>
              <Textarea id="claimStatement" {...register("claimStatement")} className="bg-background border-white/10 resize-none" rows={2} placeholder="All rights reserved. Unauthorized reproduction prohibited." />
              <p className="text-xs text-muted-foreground">Embedded in your PDF certificates. Leave blank to omit.</p>
            </div>
          </Card>

          {/* Public Profile Toggle */}
          <Card className="p-6 bg-card/50 border-white/5">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-sm">Public Creator Profile</h3>
                  <Badge variant="outline" className={`text-xs ${profileIsPublic ? 'border-primary/40 text-primary' : 'border-white/10 text-muted-foreground'}`}>
                    {profileIsPublic ? <><Globe className="w-3 h-3 mr-1" />Public</> : <><Lock className="w-3 h-3 mr-1" />Private</>}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  When enabled, your display name, handle, bio, and public proofs are visible at{" "}
                  <span className="font-mono text-xs bg-white/5 px-1.5 py-0.5 rounded">/creators/{watch("creatorHandle") || "your-handle"}</span>
                </p>
                <p className="text-xs text-muted-foreground/60 mt-1.5">
                  Your legal name and private notes are never exposed. Private records remain private regardless of this setting.
                </p>
              </div>
              <Switch
                id="profileIsPublic"
                checked={profileIsPublic}
                onCheckedChange={(checked) => setValue("profileIsPublic", checked, { shouldDirty: true })}
              />
            </div>
          </Card>

          <Button type="submit" disabled={!isDirty || createProfile.isPending || updateProfile.isPending}>
            {(createProfile.isPending || updateProfile.isPending) 
              ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Saving...</>
              : <><Save className="w-4 h-4 mr-2" /> Save Profile</>
            }
          </Button>
        </form>
      </div>
    </DashboardLayout>
  );
}
