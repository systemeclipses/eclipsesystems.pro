import { redirect } from 'next/navigation';

type LeadProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function LeadProfilePage({ params }: LeadProfilePageProps) {
  const { id } = await params;
  redirect(`/gf1/organizations/${id}`);
}
