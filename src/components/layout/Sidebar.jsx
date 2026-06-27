import { cn } from "@/lib/utils"
import { NavLink, useLocation } from "react-router-dom"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useAuth } from "@/hooks/useAuth"
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  BarChart3,
  Settings,
  Bot,
  ChevronLeft,
  ChevronRight,
  Zap,
} from "lucide-react"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/jobs", icon: Briefcase, label: "Job History" },
  { to: "/resumes", icon: FileText, label: "Resume Library" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
]

export function Sidebar({ collapsed, onToggle }) {
  const location = useLocation()
  const { user, profile } = useAuth()

  const displayName = profile?.full_name || user?.user_metadata?.full_name || "User"
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden lg:flex flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out h-screen sticky top-0",
          collapsed ? "w-[72px]" : "w-[256px]"
        )}
      >
        {/* Logo */}
        <div className={cn("flex items-center h-16 px-4 border-b border-sidebar-border", collapsed && "justify-center px-2")}>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Bot className="h-5 w-5" />
            </div>
            {!collapsed && (
              <span className="font-bold text-lg tracking-tight flex items-center gap-1">
                Job<span className="text-primary">Pilot</span>
              </span>
            )}
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4">
          <nav className="flex flex-col gap-1 px-3">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to))
              return (
                <Tooltip key={to}>
                  <TooltipTrigger asChild>
                    <NavLink
                      to={to}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm"
                          : "text-sidebar-muted-foreground hover:bg-sidebar-muted hover:text-sidebar-foreground",
                        collapsed && "justify-center px-2"
                      )}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span>{label}</span>}
                    </NavLink>
                  </TooltipTrigger>
                  {collapsed && (
                    <TooltipContent side="right" sideOffset={8}>
                      <p>{label}</p>
                    </TooltipContent>
                  )}
                </Tooltip>
              )
            })}
          </nav>

          {!collapsed && (
            <div className="mx-3 mt-6 rounded-lg border border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-4 w-4 text-primary" />
                <span className="text-xs font-semibold text-primary">AI Auto-Apply</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">
                Let AI find and apply to matching jobs automatically.
              </p>
              <button className="w-full rounded-md bg-primary text-primary-foreground text-xs font-medium py-1.5 hover:bg-primary/90 transition-colors cursor-pointer">
                Activate
              </button>
            </div>
          )}
        </ScrollArea>

        {/* User profile + collapse toggle */}
        <div className="border-t border-sidebar-border p-3">
          <div className={cn("flex items-center gap-3 rounded-lg p-2", collapsed && "justify-center")}>
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            )}
          </div>

          <Separator className="my-2" />

          <button
            onClick={onToggle}
            className="flex items-center justify-center w-full rounded-lg py-1.5 text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-muted transition-colors cursor-pointer"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span className="text-xs ml-2">Collapse</span>}
          </button>
        </div>
      </aside>
    </TooltipProvider>
  )
}
