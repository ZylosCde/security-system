import { DoorOpen } from "lucide-react";
import { ComingSoonPage } from "@/components/coming-soon-page";

export default function GatepassPage() {
  return (
    <ComingSoonPage
      title="Gate Pass"
      description="Issue and track visitor and vehicle gate passes."
      icon={DoorOpen}
      iconWrap="bg-amber-500/10 dark:bg-amber-500/20"
      iconClass="text-amber-600 dark:text-amber-400"
    />
  );
}
