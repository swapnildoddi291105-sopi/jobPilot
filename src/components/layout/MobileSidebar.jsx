import { NavLink, useLocation } from "react-router-dom"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
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
  Zap,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/jobs", icon: Briefcase, label: "Job History" },
  { to: "/resumes", icon: FileText, label: "Resume Library" },
  { to: "/analytics", icon: BarChart3, label: "Analytics" },
  { to: "/settings", icon: Settings, label: "Settings" },
]

export function MobileSidebar({ open, onClose }) {
  const location = useLocation()
  const { user, profile } = useAuth()
  const displayName = profile?.full_name || user?.user_metadata?.full_name || "User"
  const initials = displayName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-[280px] p-0">
        <SheetHeader className="flex flex-row items-center gap-3 h-16 px-4 border-b rounded-none">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Bot className="h-5 w-5" />
          </div>
          <SheetTitle className="font-bold text-lg tracking-tight flex items-center gap-1">
            Job<span className="text-primary">Pilot</span>
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100%-4rem)]">
          <nav className="flex flex-col gap-1 p-3">
            {navItems.map(({ to, icon: Icon, label }) => {
              const isActive = location.pathname === to || (to !== "/" && location.pathname.startsWith(to))
              return (
                <NavLink
                  key={to}
                  to={to}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" />
                  <span>{label}</span>
                </NavLink>
              )
            })}
          </nav>

          <div className="mt-auto p-3">
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 mb-3">
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

            <Separator className="mb-3" />

            <div className="flex items-center gap-3 rounded-lg p-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{displayName}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
