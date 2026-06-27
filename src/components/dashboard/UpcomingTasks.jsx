import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useDashboardStats } from "@/hooks/useJobs"
import { Calendar, Clock, Video, Phone, Briefcase } from "lucide-react"

const typeIcons = {
  Technical: Video,
  Behavioral: Phone,
  "System Design": Clock,
  Interviewing: Video,
  "Phone Screen": Phone,
}

const typeColors = {
  Technical: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  Behavioral: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "System Design": "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Interviewing: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
  "Phone Screen": "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
}

export function UpcomingTasks() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse bg-muted rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Active-stage jobs (Interviewing / Phone Screen) act as upcoming tasks.
  // The backend returns recentJobs; filter to active-stage ones.
  const activeJobs = (stats?.recentJobs || []).filter(
    (j) => j.status === "Interviewing" || j.status === "Phone Screen"
  )

  const formatDate = (dateStr) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Active Interviews</CardTitle>
        <CardDescription>Jobs currently in the interview pipeline</CardDescription>
      </CardHeader>
      <CardContent>
        {activeJobs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
              <Calendar className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No active interviews</p>
            <p className="text-xs text-muted-foreground mt-1 max-w-[220px]">
              Once you land a phone screen or interview, it will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeJobs.map((job) => {
              const TypeIcon = typeIcons[job.status] || Clock
              return (
                <div
                  key={job.id}
                  className="flex items-center gap-4 p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                >
                  <div className="flex flex-col items-center gap-1 px-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-bold">{formatDate(job.dateApplied)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{job.company}</p>
                    <p className="text-xs text-muted-foreground truncate">{job.title}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Badge variant="outline" className={typeColors[job.status]}>
                      <TypeIcon className="h-3 w-3 mr-1" />
                      {job.status}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
