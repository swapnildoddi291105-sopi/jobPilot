import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useWeeklyActivity } from "@/hooks/useJobs"
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"

export function ActivityChart() {
  const { data: activity, isLoading } = useWeeklyActivity()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[300px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Weekly Activity</CardTitle>
        <CardDescription>Applications and responses this week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={activity} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorApplications" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorResponses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" vertical={false} />
              <XAxis
                dataKey="day"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--color-muted-foreground))" }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--color-muted-foreground))" }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--color-popover))",
                  border: "1px solid hsl(var(--color-border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--color-popover-foreground))",
                }}
              />
              <Area
                type="monotone"
                dataKey="applications"
                stroke="#6366f1"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorApplications)"
                name="Applications"
              />
              <Area
                type="monotone"
                dataKey="responses"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorResponses)"
                name="Responses"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center gap-6 mt-2">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#6366f1]" />
            <span className="text-sm text-muted-foreground">Applications</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded-full bg-[#10b981]" />
            <span className="text-sm text-muted-foreground">Responses</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
