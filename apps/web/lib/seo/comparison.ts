import type { CompetitorContent } from "./content";

export function buildComparisonRows(competitor: CompetitorContent) {
  return [
    {
      label: "Starting price",
      cells: {
        eclipse: "Starter starts at $10 per seat per month. Pro is $18, Business is $28, Legal is $55.",
        competitor: competitor.pricing.free ? `${competitor.name} has a free plan and paid tiers from about $${competitor.pricing.paid_from} per user per month.` : `${competitor.name} paid tiers start from about $${competitor.pricing.paid_from} per user per month.`
      }
    },
    {
      label: "Invoicing",
      cells: {
        eclipse: "Included on Pro, Business, and Legal with invoice drafting from approved time.",
        competitor: competitor.features.invoicing ? `${competitor.name} includes invoicing or billing workflows.` : `${competitor.name} does not center invoicing as a native workflow.`
      }
    },
    {
      label: "Shift management",
      cells: {
        eclipse: "Included on Business and Legal with swaps, marketplace, and approvals.",
        competitor: competitor.features.shifts ? `${competitor.name} supports scheduling or shift workflows.` : `${competitor.name} is not primarily built for shift marketplace workflows.`
      }
    },
    {
      label: "Legal billing",
      cells: {
        eclipse: "Legal plan supports matters, UTBMS, LEDES 1998B, trust ledger, and custom rates.",
        competitor: competitor.features.utbms || competitor.features.ledes ? `${competitor.name} has legal billing capabilities.` : `${competitor.name} does not focus on UTBMS, LEDES, or trust accounting.`
      }
    }
  ];
}
