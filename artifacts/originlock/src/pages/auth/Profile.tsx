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
import { Loader2, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const profileSchema = z.object({
  displayName: z.string().min(1, "Display name is required"),
  creatorHandle: z.string().min(1, "Handle is required"),
  legalName: z.string().optional(),
  pseudonym: z.string().optional(),
  bio: z.string().optional(),
  websiteUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  claimStatement: z.string().optional()
});

export function Profile() {
  const { data: profile, isLoading } = useGetProfile({ query: { retry: false } });
  const createProfile = useCreateProfile();
  const updateProfile = useUpdateProfile();
  const { toast } = useToast();

  const isEditing = !!profile;

  const { register, handleSubmit, reset, formState: { errors, isDirty } } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema)
  });

  useEffect(() => {
    if (profile) {
      reset({
        displayName: profile.displayName,
        creatorHandle: profile.creatorHandle,
        legalName: profile.legalName || "",
        pseudonym: profile.pseudonym || "",
        bio: profile.bio || "",
        websiteUrl: profile.websiteUrl || "",
        claimStatement: profile.claimStatement || ""
      });
    }
  }, [profile, reset]);

  const onSubmit = (data: z.infer<typeof profileSchema>) => {
    // clean empty strings to undefined to match API expectations
    const cleanData = Object.fromEntries(
      Object.entries(data).map(([k, v]) => [k, v === "" ? undefined : v])
    ) as any;

    if (isEditing) {
      updateProfile.mutate({ data: cleanData }, {
        onSuccess: () => toast({ title: "Success", description: "Profile updated" })
      });
    } else {
      createProfile.mutate({ data: cleanData }, {
        onSuccess: () => toast({ title: "Success", description: "Profile created" })
      });
    }
  };

  if (isLoading) return <DashboardLayout><div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div></DashboardLayout>;

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-display font-bold mb-2">Creator Profile</h1>
        <p className="text-muted-foreground mb-8">
          This information is embedded in your public certificates to establish attribution.
        </p>

        <Card className="p-6 bg-card/50 border-white/5">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="displayName">Public Display Name <span className="text-destructive">*</span></Label>
                <Input id="displayName" {...register("displayName")} className="bg-background border-white/10" placeholder="Jane Doe" />
                {errors.displayName && <p className="text-xs text-destructive">{errors.displayName.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="creatorHandle">Creator Handle <span className="text-destructive">*</span></Label>
                <Input id="creatorHandle" {...register("creatorHandle")} className="bg-background border-white/10" placeholder="jane_creates" />
                {errors.creatorHandle && <p className="text-xs text-destructive">{errors.creatorHandle.message}</p>}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name (Private/Optional)</Label>
                <Input id="legalName" {...register("legalName")} className="bg-background border-white/10" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="websiteUrl">Website URL</Label>
                <Input id="websiteUrl" type="url" {...register("websiteUrl")} className="bg-background border-white/10" placeholder="https://" />
                {errors.websiteUrl && <p className="text-xs text-destructive">{errors.websiteUrl.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea id="bio" {...register("bio")} className="bg-background border-white/10 resize-none" rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="claimStatement">Default Copyright / Claim Statement</Label>
              <Textarea id="claimStatement" {...register("claimStatement")} className="bg-background border-white/10 resize-none" rows={2} placeholder="All rights reserved. Unauthorized reproduction prohibited." />
            </div>

            <Button type="submit" disabled={!isDirty || createProfile.isPending || updateProfile.isPending}>
              {(createProfile.isPending || updateProfile.isPending) ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              Save Profile
            </Button>
          </form>
        </Card>
      </div>
    </DashboardLayout>
  );
}
