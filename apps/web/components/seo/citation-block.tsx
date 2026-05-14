export function CitationBlock({ source, url, accessedOn }: { source: string; url: string; accessedOn: string }) {
  return (
    <aside className="my-6 rounded-lg border border-border bg-muted/50 p-4 text-sm">
      <p className="font-medium">Source</p>
      <p className="mt-1 text-muted-foreground">
        <a className="underline" href={url} rel="noopener noreferrer" target="_blank">{source}</a>
        {" "}accessed on {accessedOn}.
      </p>
    </aside>
  );
}
