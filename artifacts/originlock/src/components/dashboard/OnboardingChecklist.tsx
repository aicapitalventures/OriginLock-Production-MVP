import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useGetDashboardStats } from "@workspace/api-client-react";

export function OnboardingChecklist() {
  const { user } = useAuth();
  const { data: stats } = useGetDashboardStats();

  const hasProfile = !!user?.hasProfile;
  const hasProject = (stats?.projects ?? 0) > 0;
  const hasFile = (stats?.protectedFiles ?? 0) > 0;
  const allDone = hasProfile && hasProject && hasFile;

  if (allDone) return null;

  const steps = [
    { done: hasProfile, label: "Set up your creator profile", href: "/dashboard/profile" },
    { done: hasProject, label: "Create your first project", href: "/dashboard/projects" },
    { done: hasFile, label: "Protect your first file", href: "/dashboard/upload" },
  ];

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Get started — {steps.filter((s) => s.done).length} of 3 complete</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex items-center justify-between gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors group"
          >
            <div className="flex items-center gap-3">
              {s.done ? (
                <CheckCircle2 className="w-5 h-5 text-primary" />
              ) : (
                <Circle className="w-5 h-5 text-muted-foreground" />
              )}
              <span className={s.done ? "text-muted-foreground line-through" : "font-medium"}>{s.label}</span>
            </div>
            {!s.done && <ArrowRight className="w-4 h-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />}
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
