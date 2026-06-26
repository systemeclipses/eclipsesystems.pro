import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream px-6 text-ink">
      <section className="w-full max-w-lg rounded-md border border-border bg-white/80 p-6 text-center shadow-xl shadow-primary/10">
        <p className="text-sm font-semibold text-primary">404</p>
        <h1 className="mt-3 font-title text-5xl leading-none">Page not found.</h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground">
          The page you are looking for does not exist, or it may have moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
            Go home
          </Link>
          <Link href="/pay-invoice" className="inline-flex h-10 items-center rounded-md border border-border px-4 text-sm font-semibold text-primary">
            Pay invoice
          </Link>
        </div>
      </section>
    </main>
  );
}
