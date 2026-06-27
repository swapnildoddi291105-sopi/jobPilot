import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useStatusBreakdown } from "@/hooks/useJobs"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts"

export function StatusChart() {
  const { data: statuses, isLoading } = useStatusBreakdown()

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
        <CardTitle className="text-base font-semibold">Application Funnel</CardTitle>
        <CardDescription>Breakdown by current status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={statuses} margin={{ top: 5, right: 10, left: -20, bottom: 5 }} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--color-border))" horizontal={false} />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--color-muted-foreground))" }}
              />
              <YAxis
                type="category"
                dataKey="status"
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 12, fill: "hsl(var(--color-muted-foreground))" }}
                width={90}
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
              <Bar dataKey="count" radius={[0, 6, 6, 0]} barSize={28}>
                {statuses.map((entry, idx) => (
                  <Cell key={idx} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
