import type {
  Checkpoint,
  Route,
  Schedule,
  ScheduleFrequencyPreset,
  ScheduleHistory,
} from "./types";

const FREQUENCY_MINUTES: Record<ScheduleFrequencyPreset, number> = {
  hourly: 60,
  "every-2h": 120,
  "every-4h": 240,
  "every-6h": 360,
  daily: 1440,
};

export function frequencyPresetToMinutes(preset: ScheduleFrequencyPreset): number {
  return FREQUENCY_MINUTES[preset];
}

export function formatRecurrenceLabel(intervalMinutes: number): string {
  if (intervalMinutes === 60) return "Every hour";
  if (intervalMinutes === 120) return "Every 2 hours";
  if (intervalMinutes === 240) return "Every 4 hours";
  if (intervalMinutes === 360) return "Every 6 hours";
  if (intervalMinutes === 1440) return "Daily";
  if (intervalMinutes < 60) return `Every ${intervalMinutes} minutes`;
  const hours = intervalMinutes / 60;
  return Number.isInteger(hours) ? `Every ${hours} hours` : `Every ${intervalMinutes} minutes`;
}

export function presetFromIntervalMinutes(
  minutes: number
): ScheduleFrequencyPreset | "custom" {
  const entry = Object.entries(FREQUENCY_MINUTES).find(([, m]) => m === minutes);
  return (entry?.[0] as ScheduleFrequencyPreset) ?? "custom";
}

/** Combine today's date with HH:mm into an ISO string (local). */
export function timeStringToIso(time: string, baseDate = new Date()): string {
  const [hours, minutes] = time.split(":").map(Number);
  const d = new Date(baseDate);
  d.setHours(hours, minutes, 0, 0);
  return d.toISOString();
}

export function isoToTimeString(iso: string): string {
  const d = new Date(iso);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export function buildRouteFromSite(
  siteId: number,
  siteName: string,
  checkpoints: Checkpoint[],
  routeId: string
): Route {
  const siteCheckpoints = checkpoints
    .filter((cp) => cp.siteId === siteId || cp.premises === siteName)
    .sort((a, b) => (a.routeOrder ?? 0) - (b.routeOrder ?? 0));

  const expectedDuration = Math.max(siteCheckpoints.length * 8, 15);

  return {
    id: routeId,
    name: `${siteName} Patrol Route`,
    checkpoints: siteCheckpoints.map((cp) => cp.id),
    expectedDuration,
    recurrence: `Auto-generated from ${siteCheckpoints.length} checkpoints`,
  };
}

export function scheduleToHistory(
  schedule: Schedule,
  changeReason: ScheduleHistory["changeReason"]
): ScheduleHistory {
  return {
    id: `SH-${schedule.id}-v${schedule.version}`,
    scheduleId: schedule.id,
    version: schedule.version,
    siteId: schedule.siteId,
    siteName: schedule.siteName,
    routeId: schedule.routeId,
    officerId: schedule.officerId,
    startTime: schedule.startTime,
    endTime: schedule.endTime,
    frequencyIntervalMinutes: schedule.frequencyIntervalMinutes,
    recurrence: schedule.recurrence,
    status: schedule.status === "archived" ? "paused" : schedule.status,
    archivedAt: new Date().toISOString(),
    changeReason,
  };
}

export function nextScheduleId(existing: Schedule[]): string {
  const nums = existing
    .map((s) => Number(s.id.replace(/^S-/, "")))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `S-${String(next).padStart(3, "0")}`;
}

export function nextRouteId(existing: Route[]): string {
  const nums = existing
    .map((r) => Number(r.id.replace(/^R-/, "")))
    .filter((n) => !Number.isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `R-${String(next).padStart(2, "0")}`;
}
