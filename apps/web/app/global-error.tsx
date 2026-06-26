"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="grid min-h-screen place-items-center bg-cream px-6 text-ink">
          <section className="w-full max-w-lg rounded-md border border-border bg-white/80 p-6 shadow-xl shadow-primary/10">
            <p className="text-sm font-semibold text-primary">Something went wrong</p>
            <h1 className="mt-3 font-title text-5xl leading-none">We hit a page error.</h1>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {error.message || "The page could not finish loading. Try again, or return to the main site."}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={reset} className="h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
                Try again
              </button>
              <a href="/" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary">
                Go home
              </a>
            </div>
          </section>
        </main>
      </body>
    </html>
  );
}
