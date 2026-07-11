import { OperationsPortalDemo } from "@/components/app/operations-portal-demo";

export default function OperationsHubTicketPage({ params }: { params: { slug: string } }) {
  return <OperationsPortalDemo surface="operations" ticketSlug={params.slug} />;
}
