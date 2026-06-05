Use the attached `gf1-ai-template-package` as the source of truth and recreate the CRM as a white-label product for the client brand config I provide.

Inputs:
- `branding/brand-config.example.json` or a client-specific variant
- `docs/architecture.md`
- `docs/workflows.md`
- `docs/data-model.md`
- `docs/customization.md`
- `docs/brand-touchpoints.md`
- `docs/route-map.md`
- `source/`

Primary goal:
- Rebuild GF1 so the new version preserves the workflow, data model, route coverage, proposal/agreement generation behavior, and role gating, while replacing Galactic branding with the client brand.

Non-negotiables:
1. Preserve the lead -> prospect -> client lifecycle.
2. Preserve opportunities, activity follow-ups, organizations, proposals, pricing/agreements, renewals, reports, support, and admin modules.
3. Preserve Supabase-oriented architecture and role-based access behavior unless you explicitly document a safer equivalent.
4. Preserve public intake and retirement questionnaire flows.
5. Preserve proposal PDF / PPTX generation and agreement signing behavior.
6. Treat `source/supabase/*.sql` as schema truth and `source/src/lib/gf1/types.ts` as the primary app-level type map.
7. Replace hard-coded Galactic / GALFORCE copy, logos, and deck assets with the supplied brand configuration.

Branding tasks:
- Update product naming, shell branding, colors, gradients, logos, font choices, proposal assets, and client-facing email copy.
- Keep the system feeling intentional and premium, not generic SaaS boilerplate.
- Make branding configurable so future client swaps are mostly token, asset, and copy changes.

Implementation expectations:
- Keep the same major route coverage shown in `docs/route-map.md`.
- Keep customization seams explicit.
- Call out any missing assumptions before changing business logic.

Return:
- The rebuilt app/code structure
- A short map of what brand touchpoints were changed
- Any migrations or schema notes if you had to adapt table names or routes
