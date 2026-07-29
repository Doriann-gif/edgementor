import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCw, Home } from "lucide-react";

type Props = { children: ReactNode };
type State = { error: Error | null };

/**
 * Catches render-time crashes anywhere below it. Without this, a single
 * undefined field in one component blanks the entire page — the user sees a
 * white screen with no way back.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-background">
        <div className="max-w-md w-full text-center">
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <h1 className="font-heading text-2xl font-bold text-foreground mb-2">
            Something went wrong
          </h1>
          <p className="text-sm text-muted-foreground mb-6">
            This page hit an unexpected error. Your account and data are safe —
            reloading usually fixes it.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button onClick={() => window.location.reload()}>
              <RotateCw className="h-3.5 w-3.5 mr-1.5" /> Reload page
            </Button>
            <Button variant="outline" onClick={() => { window.location.href = "/"; }}>
              <Home className="h-3.5 w-3.5 mr-1.5" /> Go home
            </Button>
          </div>
          {import.meta.env.DEV && (
            <pre className="mt-6 text-left text-[11px] text-muted-foreground bg-muted rounded-lg p-3 overflow-auto max-h-40">
              {error.message}
            </pre>
          )}
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
