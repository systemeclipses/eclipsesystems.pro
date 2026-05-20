import type { CompetitorContent } from "./content";

export function buildComparisonRows(competitor: CompetitorContent) {
  return [
    {
      label: "Starting price",
      cells: {
        eclipse: "Eclipse Timekeeping starts at $10 per seat per month. Eclipse Suite is $38, and Eclipse Legal is a $20 add-on.",
        competitor: competitor.pricing.free ? `${competitor.name} has a free plan and paid tiers from about $${competitor.pricing.paid_from} per user per month.` : `${competitor.name} paid tiers start from about $${competitor.pricing.paid_from} per user per month.`
      }
    },
    {
      label: "Invoicing",
      cells: {
        eclipse: "Included on Eclipse and Eclipse Suite with invoice drafting from approved time.",
        competitor: competitor.features.invoicing ? `${competitor.name} includes invoicing or billing workflows.` : `${competitor.name} does not center invoicing as a native workflow.`
      }
    },
    {
      label: "Shift management",
      cells: {
        eclipse: "Included on Mission Command by Eclipse and Eclipse Suite with swaps, marketplace, and approvals.",
        competitor: competitor.features.shifts ? `${competitor.name} supports scheduling or shift workflows.` : `${competitor.name} is not primarily built for shift marketplace workflows.`
      }
    },
    {
      label: "Legal billing",
      cells: {
        eclipse: "Eclipse Legal Add-on supports matters, UTBMS, LEDES 1998B, trust ledger, and custom rates.",
        competitor: competitor.features.utbms || competitor.features.ledes ? `${competitor.name} has legal billing capabilities.` : `${competitor.name} does not focus on UTBMS, LEDES, or trust accounting.`
      }
    }
  ];
}
