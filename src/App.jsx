import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import { ThemeProvider } from "@/hooks/useTheme"
import { QueryProvider } from "@/providers/QueryProvider"
import { AuthProvider, useAuth } from "@/hooks/useAuth"
import { AppLayout } from "@/components/layout/AppLayout"
import { ErrorBoundary } from "@/components/ErrorBoundary"
import AuthPage from "@/pages/AuthPage"
import DashboardPage from "@/pages/DashboardPage"
import JobHistoryPage from "@/pages/JobHistoryPage"
import ResumeLibraryPage from "@/pages/ResumeLibraryPage"
import AnalyticsPage from "@/pages/AnalyticsPage"
import SettingsPage from "@/pages/SettingsPage"
import { Loader2 } from "lucide-react"

function ProtectedRoutes() {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <AuthPage />
  }

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/jobs" element={<JobHistoryPage />} />
        <Route path="/resumes" element={<ResumeLibraryPage />} />
        <Route path="/analytics" element={<AnalyticsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <QueryProvider>
          <BrowserRouter>
            <AuthProvider>
              <ProtectedRoutes />
            </AuthProvider>
          </BrowserRouter>
        </QueryProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App
