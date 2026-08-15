import { Clock3 } from "lucide-react";
import { ComingSoonPage } from "@/components/coming-soon-page";

export default function AttendancePage() {
  return (
    <ComingSoonPage
      title="Attendance"
      description="Track officer shift check-ins and attendance records."
      icon={Clock3}
      iconWrap="bg-blue-500/10 dark:bg-blue-500/20"
      iconClass="text-blue-600 dark:text-blue-400"
    />
  );
}
