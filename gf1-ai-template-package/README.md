# GF1 AI Template Package

This package is a white-label handoff kit for the GF1 CRM inside this repo. It includes the GF1 source surface, traced local dependencies, selected runtime assets, the Supabase schema/migrations that shape GF1, and a prompt package for Claude/Codex rebuilds.

## What Is Included
- `source/`: copied code, config, schema, and assets needed to understand GF1 without handing over the rest of the repo
- `docs/`: architecture, workflows, data model, customization guide, route map, and brand touchpoints
- `branding/brand-config.example.json`: client-facing override template for feel, style, logos, colors, and naming
- `HANDOFF_PROMPT.md`: ready-to-paste prompt for another model
- `manifest.json`: machine-readable index of the package

## Package Snapshot
- Source files copied: 267
- GF1 page routes indexed: 27
- API routes indexed: 34
- Supabase migrations included: 28
- Manifest path: `manifest.json`

## How To Use
1. Create a client-specific copy of `branding/brand-config.example.json`.
2. Upload or attach this entire package folder to Claude or Codex.
3. Start with `HANDOFF_PROMPT.md`.
4. Tell the model whether to preserve the `/gf1` route namespace or rename it.

## Refresh The Package
```bash
npm run export:gf1-template
```

Optional custom output path:
```bash
node scripts/export-gf1-ai-template.mjs tmp/gf1-client-export
```
