"use client";

export default function ErrorPage({ error }: { error: Error }) {
  return <div className="rounded-lg border border-border p-5 text-sm text-muted-foreground">{error.message}</div>;
}
