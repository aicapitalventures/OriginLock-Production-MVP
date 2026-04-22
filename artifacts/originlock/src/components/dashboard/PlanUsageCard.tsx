import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight } from "lucide-react";
import { usePlanUsage } from "@/hooks/use-plan-usage";
import { formatLimit, isUnlimited } from "@/lib/plans";

function PercentBar({ used, limit }: { used: number; limit: number }) {
  if (isUnlimited(limit)) {
    return <div className="h-1.5 rounded-full bg-primary/20"><div className="h-full rounded-full bg-primary/60 w-full" /></div>;
  }
  const pct = Math.min(100, Math.round((used / Math.max(limit, 1)) * 100));
  const color = pct >= 90 ? "bg-destructive" : pct >= 70 ? "bg-amber-500" : "bg-primary";
  return (
    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
      <div className={`h-full ${color} transition-all`} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function PlanUsageCard() {
  const { data, isLoading } = usePlanUsage();
  if (isLoading || !data) {
    return (
      <Card className="bg-card/50 backdrop-blur-sm border-white/5">
        <CardContent className="p-6 h-32 animate-pulse" />
      </Card>
    );
  }
  const isFree = data.plan.tier === "free";
  return (
    <Card className="bg-card/50 backdrop-blur-sm border-white/5">
      <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          {data.plan.name} plan
        </CardTitle>
        {isFree && (
          <Link href="/pricing">
            <Button size="sm" variant="outline" className="text-xs">Upgrade <ArrowRight className="w-3 h-3 ml-1" /></Button>
          </Link>
        )}
      </CardHeader>
      <CardContent className="p-6 space-y-5">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-sm text-muted-foreground">Files</p>
            <p className="text-sm font-mono">{data.files.used} / {formatLimit(data.files.limit)}</p>
          </div>
          <PercentBar used={data.files.used} limit={data.files.limit} />
        </div>
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <p className="text-sm text-muted-foreground">Projects</p>
            <p className="text-sm font-mono">{data.projects.used} / {formatLimit(data.projects.limit)}</p>
          </div>
          <PercentBar used={data.projects.used} limit={data.projects.limit} />
        </div>
        <div className="text-xs text-muted-foreground border-t border-white/5 pt-3">
          File size limit: <span className="text-foreground font-mono">{data.plan.maxFileSizeMb}MB</span>
        </div>
      </CardContent>
    </Card>
  );
}
