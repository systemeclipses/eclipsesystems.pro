import { OperationsPortalDemo } from "@/components/app/operations-portal-demo";

export default function OperationsTicketPage({ params }: { params: { slug: string } }) {
  return <OperationsPortalDemo surface="operations" ticketSlug={params.slug} />;
}
