import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useDashboardStats } from "@/hooks/useJobs"
import { formatRelativeTime } from "@/lib/utils"
import { MapPin, ArrowRight, Briefcase } from "lucide-react"
import { Link } from "react-router-dom"

const statusVariantMap = {
  Applied: "info",
  Interviewing: "warning",
  Offer: "success",
  Rejected: "destructive",
  Saved: "secondary",
  "Phone Screen": "default",
}

export function RecentJobs() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base font-semibold">Recent Applications</CardTitle>
            <CardDescription>Your latest job submissions</CardDescription>
          </div>
          <Link to="/jobs">
            <Button variant="ghost" size="sm" className="text-primary gap-1">
              View All <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {(stats?.recentJobs || []).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Briefcase className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No applications yet</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">
              Head to Job History to search for roles and track your first application.
            </p>
            <Link to="/jobs">
              <Button variant="outline" size="sm" className="mt-4 gap-1">
                Browse Jobs <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {stats.recentJobs.map((job) => (
            <div
              key={job.id}
              className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              {/* Company initial avatar */}
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold text-muted-foreground">
                {job.company.slice(0, 2).toUpperCase()}
              </div>

              {/* Job info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium truncate">{job.title}</p>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
                  <span>{job.company}</span>
                  <span>·</span>
                  <MapPin className="h-3 w-3" />
                  <span className="truncate">{job.location}</span>
                </div>
              </div>

              {/* Status + time */}
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge variant={statusVariantMap[job.status] || "secondary"} className="text-[10px]">
                  {job.status}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(job.dateApplied)}
                </span>
              </div>
            </div>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  )
}
