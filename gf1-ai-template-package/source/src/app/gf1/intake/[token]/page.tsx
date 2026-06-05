import { notFound } from 'next/navigation';
import IntakeForm from './IntakeForm';
import { validateIntakeToken } from '@/lib/gf1/intake';

export default async function IntakePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const validated = await validateIntakeToken(token);
  if (!validated) {
    notFound();
  }

  const { organization, contacts, worksites } = validated;

  return <IntakeForm token={token} organization={organization} contacts={contacts} worksites={worksites} />;
}
