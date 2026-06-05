import { redirect } from 'next/navigation';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProposalEditPage({ params }: Props) {
  const { id } = await params;
  redirect(`/gf1/proposals/${id}`);
}
