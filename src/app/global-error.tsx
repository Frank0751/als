"use client";

// Global error boundary, replaces Next's bare "Application error" screen.
// Must render its own <html>/<body>; runs even when the root layout fails.

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#faf8f2",
          fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          color: "#1c2b2a",
          padding: "16px",
        }}
      >
        <div
          style={{
            maxWidth: 420,
            width: "100%",
            textAlign: "center",
            background: "#ffffff",
            border: "1px solid #e5e0d4",
            borderRadius: 16,
            padding: "32px 24px",
          }}
        >
          <div
            style={{
              margin: "0 auto 16px",
              height: 48,
              width: 48,
              borderRadius: 9999,
              background: "rgba(23,110,104,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              fontWeight: 700,
              color: "#176e68",
            }}
          >
            !
          </div>
          <h1 style={{ fontSize: 18, fontWeight: 600, margin: "0 0 8px" }}>
            Aquatic Link Solutions, something went wrong
          </h1>
          <p style={{ fontSize: 14, color: "#6b6a62", margin: "0 0 24px", lineHeight: 1.5 }}>
            The app could not load, usually because your browser is holding files from a previous version.
            A refresh will sort it out.
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={reset}
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 8,
                background: "#176e68",
                color: "#ffffff",
                fontSize: 14,
                fontWeight: 500,
                border: "none",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                height: 40,
                padding: "0 20px",
                borderRadius: 8,
                background: "#ffffff",
                color: "#1c2b2a",
                fontSize: 14,
                fontWeight: 500,
                border: "1px solid #d8d2c2",
                cursor: "pointer",
              }}
            >
              Reload page
            </button>
          </div>
          {error?.digest ? (
            <p style={{ marginTop: 16, fontSize: 11, color: "#a3a094" }}>Ref: {error.digest}</p>
          ) : null}
        </div>
      </body>
    </html>
  );
}
