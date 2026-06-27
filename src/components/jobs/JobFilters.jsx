import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Search, X, Filter } from "lucide-react"

const statuses = ["Applied", "Interviewing", "Offer", "Rejected", "Saved", "Phone Screen"]
const sources = ["LinkedIn", "Indeed", "Referral", "Company Site", "Glassdoor", "AngelList"]

export function JobFilters({ search, status, source, onSearchChange, onStatusChange, onSourceChange, onClear }) {
  const hasFilters = search || status || source

  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px] max-w-sm">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by title or company..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 h-9"
        />
      </div>

      {/* Status filter */}
      <div className="flex flex-wrap gap-1.5">
        {statuses.map((s) => (
          <Badge
            key={s}
            variant={status === s ? "default" : "outline"}
            className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1"
            onClick={() => onStatusChange(status === s ? "" : s)}
          >
            {s}
          </Badge>
        ))}
      </div>

      {/* Source filter */}
      <div className="flex flex-wrap gap-1.5">
        {sources.map((s) => (
          <Badge
            key={s}
            variant={source === s ? "default" : "secondary"}
            className="cursor-pointer hover:bg-primary/10 transition-colors px-3 py-1"
            onClick={() => onSourceChange(source === s ? "" : s)}
          >
            {s}
          </Badge>
        ))}
      </div>

      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onClear} className="gap-1 text-muted-foreground">
          <X className="h-3.5 w-3.5" />
          Clear filters
        </Button>
      )}
    </div>
  )
}
