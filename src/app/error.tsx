"use client";

// Route-level error boundary, ALS branded recovery screen.
// A refresh almost always fixes this (stale cached chunks after an update).

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[ALS] view error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center rounded-2xl border bg-card p-8 shadow-sm">
        <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary text-xl font-bold">!</span>
        </div>
        <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
        <p className="text-sm text-muted-foreground mb-6">
          The page hit an unexpected error. If you just came back after an update, a refresh usually fixes it.
        </p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          <button
            onClick={reset}
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Try again
          </button>
          <button
            onClick={() => window.location.reload()}
            className="inline-flex h-10 items-center justify-center rounded-md border bg-background px-5 text-sm font-medium hover:bg-accent"
          >
            Reload page
          </button>
        </div>
        {error?.digest ? <p className="mt-4 text-xs text-muted-foreground/70">Ref: {error.digest}</p> : null}
      </div>
    </div>
  );
}
