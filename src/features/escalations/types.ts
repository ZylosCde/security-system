export interface EscalatedSchedule {
  id: string;
  siteName: string;
  routeName: string;
  officerName: string;
  timeRange: string;
  type: "MISSED START" | "OVERDUE SESSION";
  severity: "High" | "Critical";
  delayMinutes: number;
  resolved: boolean;
}
