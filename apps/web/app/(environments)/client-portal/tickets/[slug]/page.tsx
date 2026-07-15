import { OperationsPortalDemo } from "@/components/app/operations-portal-demo";

export default function ClientPortalTicketPage({ params }: { params: { slug: string } }) {
  return <OperationsPortalDemo surface="client" ticketSlug={params.slug} />;
}
