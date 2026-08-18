import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ComingSoonPage({
  title,
  description,
  icon: Icon,
  iconWrap,
  iconClass,
}: {
  title: string;
  description: string;
  icon: LucideIcon;
  iconWrap: string;
  iconClass: string;
}) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-background p-4">
      <Card className="card-premium w-full max-w-md p-8 text-center">
        <div className={cn("mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl", iconWrap)}>
          <Icon className={cn("h-7 w-7", iconClass)} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        <p className="mt-6 font-mono text-xs uppercase tracking-widest text-muted-foreground">
          Coming soon
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex h-11 items-center justify-center gap-2 rounded-2xl border border-border bg-background px-6 text-sm font-medium transition-colors hover:bg-muted"
        >
          <ArrowLeft className="h-4 w-4" /> Back to modules
        </Link>
      </Card>
    </div>
  );
}
