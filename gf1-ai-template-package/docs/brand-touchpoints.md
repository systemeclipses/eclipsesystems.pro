# Brand Touchpoints

## Manual White-Label Surfaces
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


## Auto-Detected Brand Terms
- `package.json`: `Galactic`
- `README.md`: `Galactic`
- `src/app/(protected)/gf1/admin/inventory/_components/CompanyInventory.tsx`: `whiteLogo`
- `src/app/(protected)/gf1/components/DashboardShell.tsx`: `GALFORCE`
- `src/app/(protected)/gf1/components/NewDashboard.tsx`: `GALFORCE`
- `src/app/(protected)/gf1/opportunities/OpportunitiesTable.tsx`: `Galactic`
- `src/app/(protected)/gf1/organizations/_components/DealLostModal.tsx`: `Galactic`
- `src/app/(protected)/gf1/organizations/_components/OrganizationDetailClient.tsx`: `Galactic`
- `src/app/(protected)/gf1/organizations/[id]/actions.ts`: `Galactic`
- `src/app/(protected)/gf1/organizations/OrganizationsTable.tsx`: `Logomark`
- `src/app/(protected)/gf1/pipeline/PipelineBoard.tsx`: `Logomark`
- `src/app/(protected)/gf1/pricing/_components/AgreementsPageClient.tsx`: `Galactic`
- `src/app/(protected)/gf1/proposals/_components/ProposalPageClient.tsx`: `Logomark`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/_shared.tsx`: `Galactic`, `proposal template`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/BenefitsLayout.tsx`: `Galactic`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/ClosingLayout.tsx`: `Galactic`, `Logomark`, `whiteLogo`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/ExecutiveSummaryLayout.tsx`: `Galactic`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/HowItWorksLayout.tsx`: `Galactic`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/HRServicesLayout.tsx`: `Logomark`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/index.ts`: `Galactic`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/MultiCompanyLayout.tsx`: `Galactic`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/PayrollLayout.tsx`: `Galactic`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/RetirementLayout.tsx`: `Galactic`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/TimekeepingLayout.tsx`: `Galactic`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/WhoIsGalacticLayout.tsx`: `Galactic`
- `src/app/(protected)/gf1/proposals/[id]/_components/SlideBuilder/layouts/WorkersCompLayout.tsx`: `Galactic`
- `src/app/(protected)/support/_components/SupportPortalClient.tsx`: `Galactic`
- `src/app/(protected)/support/actions.ts`: `Galactic`
- `src/app/api/gf1/agreements/send-signing-request/route.ts`: `Galactic`
- `src/app/api/gf1/proposals/[id]/approve/route.ts`: `Galactic`
- `src/app/api/gf1/proposals/create-draft/route.ts`: `Galactic`
- `src/app/api/gf1/proposals/generate-pptx/route.ts`: `proposal template`
- `src/app/api/gf1/proposals/health-census-notify/route.ts`: `Galactic`
- `src/app/api/gf1/proposals/retirement-401k-notify/route.ts`: `Galactic`
- `src/app/api/gf1/proposals/retirement-questionnaire-submit/route.ts`: `Galactic`
- `src/app/awaiting-approval/page.tsx`: `Galactic`
- `src/app/gf1/intake/[token]/actions.ts`: `Galactic`
- `src/app/gf1/intake/[token]/IntakeForm.tsx`: `Galactic`
- `src/app/gf1/retirement-questionnaire/page.tsx`: `Galactic`
- `src/app/gf1/retirement-questionnaire/RetirementQuestionnaireForm.tsx`: `Galactic`
- `src/app/globals.css`: `GALFORCE`, `Galactic`
- `src/app/layout.tsx`: `Galactic`
- `src/app/signin/page.tsx`: `Galactic`
- `src/components/gf1/ServiceSelectionChecklist.tsx`: `Galactic`
- `src/components/Header.tsx`: `GALFORCE`, `Galactic`
- `src/lib/brevo.ts`: `Galactic`
- `src/lib/email-templates.ts`: `GALFORCE`, `Galactic`
- `src/lib/gf1/agreements-calculations.ts`: `Galactic`
- `src/lib/gf1/agreements-pdf.ts`: `Galactic`
- `src/lib/gf1/agreements-types.ts`: `Galactic`
- `src/lib/gf1/deal-loss-pdf.ts`: `Galactic`
- `src/lib/gf1/proposal-pdf.ts`: `Galactic`
- `src/lib/gf1/retirement-questionnaire-pdf.ts`: `Galactic`
- `src/lib/gf1/slide-library.ts`: `Galactic`, `proposal template`
- `src/lib/gf1/slide-migration.ts`: `Galactic`
- `src/lib/gf1/slide-types.ts`: `Galactic`
- `src/lib/gf1/types.ts`: `Galactic`
