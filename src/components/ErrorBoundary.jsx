import { Component } from "react"

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const msg = this.state.error?.message || ""
      const isConfigError = msg.includes("supabaseUrl") || msg.includes("VITE_SUPABASE")
      return (
        <div className="flex h-screen items-center justify-center bg-background p-8">
          <div className="max-w-md text-center space-y-4">
            <div className="text-4xl">⚠️</div>
            <h2 className="text-xl font-bold text-foreground">Something went wrong</h2>
            <p className="text-sm text-muted-foreground">
              {isConfigError
                ? "The app is not configured correctly. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment."
                : "An unexpected error occurred. Please try refreshing the page."}
            </p>
            <p className="text-xs text-muted-foreground/60 font-mono">{msg}</p>
            <button
              onClick={() => { this.setState({ hasError: false, error: null }); window.location.reload() }}
              className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              Reload Page
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}