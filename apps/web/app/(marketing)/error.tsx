"use client";

export default function ErrorPage({ error }: { error: Error }) {
  return <div className="p-6 text-sm text-muted-foreground">{error.message}</div>;
}
