export function StaticRoute({ title }: { title: string }) {
  return (
    <section className="static-route" aria-labelledby="route-title">
      <p className="eyebrow">Sitemap route</p>
      <h2 id="route-title">{title}</h2>
      <p>This route is reserved by the existing Eclipse Systems site map. The JSON workspace keeps it available while the main tool lives at the root route.</p>
      <a href="/">Return to the workspace</a>
    </section>
  );
}

export function NotFoundRoute() {
  return (
    <section className="static-route" aria-labelledby="missing-title">
      <p className="eyebrow">Not found</p>
      <h2 id="missing-title">404</h2>
      <p>The requested route is not in the Eclipse Systems site map.</p>
      <a href="/">Return to the workspace</a>
    </section>
  );
}
