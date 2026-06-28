import { Card, CardContent } from "@/components/ui/card"
import { ApplicationChart } from "@/components/analytics/ApplicationChart"
import { SourceChart } from "@/components/analytics/SourceChart"
import { StatusChart } from "@/components/analytics/StatusChart"
import { useMonthlyTrend } from "@/hooks/useJobs"
import { TrendingUp, Target, Percent, BarChart3 } from "lucide-react"

export default function AnalyticsPage() {
  const { data: trend } = useMonthlyTrend()

  const totalApplications = trend?.reduce((sum, m) => sum + m.applications, 0) || 0
  const totalInterviews = trend?.reduce((sum, m) => sum + m.interviews, 0) || 0
  const totalOffers = trend?.reduce((sum, m) => sum + m.offers, 0) || 0
  const interviewRate = totalApplications > 0 ? ((totalInterviews / totalApplications) * 100).toFixed(1) : "0.0"
  const offerRate = totalApplications > 0 ? ((totalOffers / totalApplications) * 100).toFixed(1) : "0.0"

  const kpis = [
    {
      label: "Interview Rate",
      value: `${interviewRate}%`,
      change: "",
      positive: true,
      icon: Target,
    },
    {
      label: "Offer Rate",
      value: `${offerRate}%`,
      change: "",
      positive: true,
      icon: Percent,
    },
    {
      label: "Total Applications",
      value: String(totalApplications),
      change: "",
      positive: true,
      icon: BarChart3,
    },
    {
      label: "Active Interviews",
      value: String(totalInterviews),
      change: "",
      positive: true,
      icon: TrendingUp,
    },
  ]

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Charts Row */}
      <div className="grid gap-6 lg:grid-cols-2">
        <ApplicationChart />
        <SourceChart />
      </div>

      {/* Funnel */}
      <StatusChart />
    </div>
  )
}
