# SEO Implementation Decisions

- Content sources are YAML plus typed loaders instead of runtime MDX compilation. This keeps Phase 1 deployable without adding an MDX bundling pipeline, while preserving the requested `content/` taxonomy and allowing human editors to own the copy.
- Competitor pricing data is stored with `last_verified` fields and conservative caveats. Pages avoid unsupported claims and include correction language because pricing and feature packaging change frequently.
- The Phase 1 sitemap emits a normal sitemap because the current URL count is far below 10,000. The loader layer is structured so a sitemap index can be added when programmatic expansion crosses that threshold.
- `AggregateRating` is intentionally omitted from global product schema until real third-party reviews exist. Fake review schema creates manual-action risk.
- Birmingham content uses service-area positioning rather than claiming a public storefront address.
- Programmatic pages use static generation from local content files rather than Edge runtime. This favors deterministic builds and typed file loaders for Phase 1; the routes can move to Edge once content is bundled or fetched from a CMS/API.
