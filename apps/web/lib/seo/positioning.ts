/** Historical product articles remain readable; business-service discovery excludes them. */
export const productLegacyPostSlugs = ["weekly-time-review", "shift-swap-record", "legal-time-tracking", "job-costing-labor-hours"] as const;
export function isProductLegacyPost(slug: string) { return productLegacyPostSlugs.some(value => value === slug); }
export const archivedProductRobots = { index: false, follow: true, googleBot: { index: false, follow: true } } as const;
