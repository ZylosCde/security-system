import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatDateTime, formatTime } from "@/features/schedules/lib/format";
import type { Schedule, ScheduleHistory } from "@/lib/types";

export function ScheduleHistoryDialog({
  scheduleId,
  schedule,
  historyItems,
  onClose,
}: {
  scheduleId: string;
  schedule: Schedule | undefined;
  historyItems: ScheduleHistory[];
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <h2 className="mb-1 text-xl font-semibold">Schedule history</h2>
        <p className="mb-4 text-sm text-muted-foreground">
          {schedule?.siteName ?? scheduleId} · current v{schedule?.version ?? "—"}
        </p>

        {historyItems.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No previous versions yet. Renew or pause to create history entries.
          </p>
        ) : (
          <div className="space-y-3">
            {historyItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs text-muted-foreground">v{item.version}</span>
                  <Badge variant="outline" className="text-xs capitalize">
                    {item.changeReason}
                  </Badge>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Start</span>
                    <div className="font-mono">{formatTime(item.startTime)}</div>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">End</span>
                    <div className="font-mono">{formatTime(item.endTime)}</div>
                  </div>
                </div>
                <div className="mt-2 text-muted-foreground">{item.recurrence}</div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Archived {formatDateTime(item.archivedAt)}
                </div>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" className="mt-6 w-full" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  );
}
