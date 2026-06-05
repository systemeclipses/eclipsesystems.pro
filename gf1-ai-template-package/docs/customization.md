# Customization Guide

GF1 is already close to a sellable template if you keep the workflow logic stable and isolate the white-label changes.

## Best White-Label Levers
- Brand tokens: colors, gradients, type, border radius, shell styling
- Naming: platform name, product slug, organization labels, role labels
- Logos: nav shell, emails, proposal deck, public forms
- Collateral: proposal template deck, cover images, partner badges
- Voice: email copy, CTA labels, support wording, questionnaire framing

## High-Impact Files
### Product name and shell branding
Swap GF1 / GALFORCE labels, icon treatment, and any navigation copy.

Files:
- `src/app/(protected)/gf1/components/DashboardShell.tsx`
- `src/components/Header.tsx`
- `src/app/layout.tsx`

### GF1 visual system
Primary colors, gradients, surface tones, spacing, and component skin live here.

Files:
- `src/app/(protected)/gf1/components/DashboardShell.module.css`
- `src/app/(protected)/gf1/components/DashboardOverview.module.css`
- `src/app/(protected)/gf1/components/NewDashboard.module.css`
- `src/app/globals.css`

### Proposal and deck assets
This is the most direct white-label surface for sales collateral.

Files:
- `public/proposal template v2.pptx`
- `public/proposal-template-city.png`
- `public/proposal-template-galactic-logo.png`
- `public/proposal-template-napeo.png`
- `public/proposal-template-pin.png`
- `src/app/api/gf1/proposals/generate-pptx/route.ts`

### Email voice and sender branding
Update sender names, client-facing copy, and any Galactic references.

Files:
- `src/lib/email-templates.ts`
- `src/lib/brevo.ts`
- `src/app/(protected)/gf1/organizations/_components/EmailComposeModal.tsx`
- `src/lib/microsoft/graph.ts`

### Logo upload and runtime logo resolution
These files define how logos are stored, refreshed, and surfaced through the CRM.

Files:
- `src/lib/gf1/logos.ts`
- `src/app/api/gf1/organizations/upload-logo/route.ts`
- `src/app/(protected)/gf1/components/LogoUploader.tsx`
- `src/app/(protected)/gf1/organizations/_components/OrganizationDetailClient.tsx`

### Public forms
White-label public-facing experiences here so external prospects see client branding rather than Galactic.

Files:
- `src/app/gf1/intake/[token]/IntakeForm.tsx`
- `src/app/gf1/retirement-questionnaire/RetirementQuestionnaireForm.tsx`
- `public/Retirement Plan Questionnaire.pdf`


## Recommended Packaging Pattern
- Keep business logic and route coverage stable.
- Move brand-specific values into a client config file and explicit asset folder.
- Treat proposal deck assets and email templates as first-class white-label surfaces.
- Do not rename data entities casually; map client language onto existing structures where possible.
