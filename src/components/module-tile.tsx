import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function ModuleTile({
  href,
  label,
  description,
  icon: Icon,
  iconWrap,
  iconClass,
}: {
  href: string;
  label: string;
  description: string;
  icon: LucideIcon;
  iconWrap: string;
  iconClass: string;
}) {
  return (
    <Link href={href} className="group block">
      <Card className="card-premium flex h-full flex-col justify-between gap-6 p-6 transition-all group-hover:-translate-y-0.5 group-hover:shadow-lg sm:p-8">
        <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl", iconWrap)}>
          <Icon className={cn("h-6 w-6", iconClass)} />
        </div>
        <div>
          <div className="flex items-center gap-2 text-xl font-semibold tracking-tight">
            {label}
            <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1" />
          </div>
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        </div>
      </Card>
    </Link>
  );
}
