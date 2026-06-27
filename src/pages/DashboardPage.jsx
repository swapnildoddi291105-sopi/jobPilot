import { useDashboardStats } from "@/hooks/useJobs"
import { useAuth } from "@/hooks/useAuth"
import { StatsCard } from "@/components/dashboard/StatsCard"
import { ActivityChart } from "@/components/dashboard/ActivityChart"
import { RecentJobs } from "@/components/dashboard/RecentJobs"
import { UpcomingTasks } from "@/components/dashboard/UpcomingTasks"
import { Briefcase, Calendar, Award, TrendingUp, Loader2 } from "lucide-react"

export default function DashboardPage() {
  const { data: stats, isLoading } = useDashboardStats()
  const { user, profile } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  // Real backend returns: jobsApplied, interviewsScheduled, offersReceived,
  // responseRate, recentJobs, weeklyActivity
  const safeStats = {
    jobsApplied: stats?.jobsApplied ?? 0,
    interviewsScheduled: stats?.interviewsScheduled ?? 0,
    offersReceived: stats?.offersReceived ?? 0,
    responseRate: stats?.responseRate ?? 0,
  }
  const hasData = safeStats.jobsApplied > 0

  const displayName =
    profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there"
  const firstName = displayName.split(" ")[0]

  return (
    <div className="space-y-6">
      {/* Welcome banner */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-background border border-primary/20 p-6">
        <h2 className="text-2xl font-bold tracking-tight">
          Welcome back, {firstName} 👋
        </h2>
        <p className="text-muted-foreground mt-1">
          {hasData ? (
            <>
              You've applied to{" "}
              <span className="font-semibold text-foreground">{safeStats.jobsApplied} jobs</span>,
              with{" "}
              <span className="font-semibold text-foreground">
                {safeStats.interviewsScheduled} active interviews
              </span>{" "}
              and a{" "}
              <span className="font-semibold text-foreground">{safeStats.responseRate}%</span>{" "}
              response rate.
            </>
          ) : (
            <>
              You're all set up. Head to{" "}
              <span className="font-semibold text-foreground">Job History</span> to search for roles
              and track your applications.
            </>
          )}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Jobs Applied"
          value={safeStats.jobsApplied}
          trend={0}
          trendLabel="all time"
          icon={Briefcase}
        />
        <StatsCard
          title="Active Interviews"
          value={safeStats.interviewsScheduled}
          trend={0}
          trendLabel="in pipeline"
          icon={Calendar}
        />
        <StatsCard
          title="Offers Received"
          value={safeStats.offersReceived}
          trend={0}
          trendLabel="all time"
          icon={Award}
        />
        <StatsCard
          title="Response Rate"
          value={`${safeStats.responseRate}%`}
          trend={0}
          trendLabel="of applications"
          icon={TrendingUp}
        />
      </div>

      {/* Charts + Side Panels */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart />
        </div>
        <div className="space-y-6">
          <UpcomingTasks />
        </div>
      </div>

      {/* Recent Jobs */}
      <RecentJobs />
    </div>
  )
}
