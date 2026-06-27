import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useSourceBreakdown } from "@/hooks/useJobs"
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts"

export function SourceChart() {
  const { data: sources, isLoading } = useSourceBreakdown()

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
        <CardTitle className="text-base font-semibold">Job Sources</CardTitle>
        <CardDescription>Where your applications come from</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={sources}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={4}
                dataKey="value"
                nameKey="name"
              >
                {sources.map((entry, idx) => (
                  <Cell key={idx} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--color-popover))",
                  border: "1px solid hsl(var(--color-border))",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "hsl(var(--color-popover-foreground))",
                }}
                formatter={(value) => [`${value}%`, "Percentage"]}
              />
              <Legend
                verticalAlign="middle"
                align="right"
                layout="vertical"
                iconType="circle"
                iconSize={8}
                formatter={(value) => (
                  <span style={{ fontSize: "13px", color: "hsl(var(--color-foreground))" }}>{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
