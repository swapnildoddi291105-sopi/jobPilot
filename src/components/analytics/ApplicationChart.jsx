import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useMonthlyTrend } from "@/hooks/useJobs"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts"

export function ApplicationChart() {
  const { data: trend, isLoading } = useMonthlyTrend()

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-[320px] animate-pulse bg-muted rounded-lg" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-semibold">Application Trend</CardTitle>
        <CardDescription>Monthly applications, interviews, and offers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" vertical={false} />
              <XAxis
                dataKey="month"
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
              <Legend />
              <Line
                type="monotone"
                dataKey="applications"
                stroke="#6366f1"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Applications"
              />
              <Line
                type="monotone"
                dataKey="interviews"
                stroke="#10b981"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Interviews"
              />
              <Line
                type="monotone"
                dataKey="offers"
                stroke="#f59e0b"
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
                name="Offers"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
