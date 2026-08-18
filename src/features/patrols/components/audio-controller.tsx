import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Play, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  playIncidentSound,
  playViolationSound,
} from "@/features/patrols/lib/alert-sounds";

export function AudioController({
  isMuted,
  onToggleMuted,
  enableSOSEventSound,
  onEnableSOSEventSoundChange,
  enableViolationSound,
  onEnableViolationSoundChange,
  enableIncidentSound,
  onEnableIncidentSoundChange,
  onTestSOS,
}: {
  isMuted: boolean;
  onToggleMuted: () => void;
  enableSOSEventSound: boolean;
  onEnableSOSEventSoundChange: (value: boolean) => void;
  enableViolationSound: boolean;
  onEnableViolationSoundChange: (value: boolean) => void;
  enableIncidentSound: boolean;
  onEnableIncidentSoundChange: (value: boolean) => void;
  onTestSOS: () => void;
}) {
  return (
    <Card className="card-premium p-4 sm:p-6 bg-black/40 border-emerald-500/20 font-mono">
      <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-2">
        <div className="text-sm font-semibold tracking-wider text-emerald-400 flex items-center gap-2">
          <Volume2 className="h-4 w-4" /> AUDIO CONTROLLER
        </div>
        <Badge variant={isMuted ? "destructive" : "outline"} className="text-[10px] rounded-full px-2 py-0.5">
          {isMuted ? "MUTED" : "LIVE"}
        </Badge>
      </div>

      <div className="space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">SOS Siren Alarm</span>
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-red-500"
              onClick={onTestSOS}
              title="Test SOS Sound"
            >
              <Play className="h-3 w-3" />
            </Button>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableSOSEventSound}
                onChange={(e) => onEnableSOSEventSoundChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Violation Warning</span>
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-amber-500"
              onClick={() => playViolationSound()}
              title="Test Violation Sound"
            >
              <Play className="h-3 w-3" />
            </Button>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableViolationSound}
                onChange={(e) => onEnableViolationSoundChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Incident Chime</span>
          <div className="flex items-center gap-3">
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-muted-foreground hover:text-blue-500"
              onClick={() => playIncidentSound()}
              title="Test Incident Sound"
            >
              <Play className="h-3 w-3" />
            </Button>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enableIncidentSound}
                onChange={(e) => onEnableIncidentSoundChange(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-border rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-background after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
          </div>
        </div>

        <div className="pt-2 border-t border-border/40 flex justify-between items-center text-[10px] text-muted-foreground">
          <span>Global Mute Override</span>
          <button
            onClick={onToggleMuted}
            className={cn(
              "underline hover:text-foreground cursor-pointer font-semibold",
              isMuted ? "text-red-400" : "text-emerald-400"
            )}
          >
            {isMuted ? "UNMUTE SYSTEM" : "MUTE SYSTEM"}
          </button>
        </div>
      </div>
    </Card>
  );
}
