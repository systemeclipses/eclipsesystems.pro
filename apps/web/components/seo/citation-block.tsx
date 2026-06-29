export function CitationBlock({ source, url, accessedOn }: { source: string; url: string; accessedOn: string }) {
  return (
    <aside className="my-8 rounded-[1rem] border border-[#cbd3b0] bg-[#eef1e5] p-5 text-sm">
      <p className="font-medium">Source</p>
      <p className="mt-1 font-semibold text-[#314839]/68">
        <a className="underline" href={url} rel="noopener noreferrer" target="_blank">{source}</a>
        {" "}accessed on {accessedOn}.
      </p>
    </aside>
  );
}
