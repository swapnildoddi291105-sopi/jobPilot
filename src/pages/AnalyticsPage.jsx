import { Card, CardContent } from "@/components/ui/card"
import { ApplicationChart } from "@/components/analytics/ApplicationChart"
import { SourceChart } from "@/components/analytics/SourceChart"
import { StatusChart } from "@/components/analytics/StatusChart"
import { TrendingUp, Target, Percent, BarChart3 } from "lucide-react"

const kpis = [
  {
    label: "Avg. Response Time",
    value: "4.2 days",
    change: "-12%",
    positive: true,
    icon: TrendingUp,
  },
  {
    label: "Interview Rate",
    value: "26.8%",
    change: "+3.5%",
    positive: true,
    icon: Target,
  },
  {
    label: "Offer Rate",
    value: "11.4%",
    change: "+1.8%",
    positive: true,
    icon: Percent,
  },
  {
    label: "Total Applications",
    value: "315",
    change: "+22%",
    positive: true,
    icon: BarChart3,
  },
]

export default function AnalyticsPage() {
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
              <p className={`text-xs mt-2 font-medium ${kpi.positive ? "text-emerald-500" : "text-rose-500"}`}>
                {kpi.positive ? "↑" : "↓"} {kpi.change} from last period
              </p>
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
