import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown } from "lucide-react"

export function StatsCard({ title, value, trend, icon: Icon, trendLabel, className }) {
  const isPositive = trend >= 0

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold tracking-tight">{value}</p>
          </div>
          <div
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-xl",
              "bg-primary/10"
            )}
          >
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-rose-500" />
          )}
          <span
            className={cn(
              "text-sm font-medium",
              isPositive ? "text-emerald-500" : "text-rose-500"
            )}
          >
            {isPositive ? "+" : ""}{trend}%
          </span>
          <span className="text-sm text-muted-foreground">{trendLabel}</span>
        </div>
      </CardContent>
      {/* Decorative gradient accent */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-primary/5 to-transparent rounded-bl-full" />
    </Card>
  )
}
