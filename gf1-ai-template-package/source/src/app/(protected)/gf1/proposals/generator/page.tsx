import { redirect } from 'next/navigation';

export default function ProposalGeneratorPage() {
  redirect('/gf1/proposals?tab=generator');
}
