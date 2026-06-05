# Architecture

## Stack
- Next.js 16 App Router
- React 19
- Supabase SSR + service-role admin access
- Server actions and App Router API routes
- PDF / PPTX generation via `pdf-lib`, `docxtemplater`, `pptxgenjs`, `html2canvas`, and `puppeteer-core`

## Package Shape
- Protected GF1 app routes: `source/src/app/(protected)/gf1`
- Public GF1 forms: `source/src/app/gf1`
- GF1 API routes: `source/src/app/api/gf1`
- Shared auth / sign / support / Microsoft dependencies are copied where GF1 references them
- GF1 domain logic: `source/src/lib/gf1`
- GF1 shared components: `source/src/components/gf1`
- Supabase schema and migrations: `source/supabase`

## Cross-Cutting Patterns
- Access is role-gated through `source/src/lib/gf1/auth.ts` and `profiles.role`.
- Organizations are the central business object across dashboard, pipeline, proposals, pricing, renewals, and reporting.
- Public intake/questionnaire routes feed sales workflows rather than living as a separate product.
- Proposal and agreement generation depend on copied public assets and document templates under `source/public`.
- Support, auth, sign, and Microsoft email routes are auxiliary dependencies of the GF1 surface.

## Export Scope Notes
- Total copied files: 228
- The package favors completeness over minimalism so another model can reconstruct working behavior instead of guessing at missing dependencies.
