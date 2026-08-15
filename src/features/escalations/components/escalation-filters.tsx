import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function EscalationFilters({
  searchQuery,
  onSearchChange,
  selectedSite,
  onSiteChange,
  selectedType,
  onTypeChange,
  sites,
}: {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedSite: string;
  onSiteChange: (value: string) => void;
  selectedType: string;
  onTypeChange: (value: string) => void;
  sites: string[];
}) {
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-muted/30 p-4 rounded-2xl border border-border">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by route, officer or ID..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 bg-background/50 rounded-xl"
        />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <select
          value={selectedSite}
          onChange={(e) => onSiteChange(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none"
        >
          <option value="all">All Sites</option>
          {sites.map((site) => (
            <option key={site} value={site}>
              {site}
            </option>
          ))}
        </select>

        <select
          value={selectedType}
          onChange={(e) => onTypeChange(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background/50 px-3 py-2 text-sm focus:outline-none"
        >
          <option value="all">All Types</option>
          <option value="MISSED START">Missed Start</option>
          <option value="OVERDUE SESSION">Overdue Session</option>
        </select>
      </div>
    </div>
  );
}
