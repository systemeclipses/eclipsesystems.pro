import { DashboardShell } from '@/app/(protected)/gf1/components/DashboardShell';
import { ProposalWorkspaceHeader } from '../_components/ProposalWorkspaceHeader';
import { ProposalApprovalActions } from '../_components/ProposalApprovalActions';
import { ProposalDetailClient } from '../_components/ProposalDetailClient';
import type { Gf1PayFrequency } from '@/lib/gf1/types';
import {
  saveProposalDraftAction,
  saveProposalPricingJsonAction,
  submitProposalForApprovalAction,
} from './actions';
import { loadProposalWorkspace } from './workspace-data';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProposalDetailPage({ params: paramsPromise }: Props) {
  const { id } = await paramsPromise;
  const workspace = await loadProposalWorkspace(id);
  const title =
    workspace.safeOrganization.trade_name ??
    workspace.safeOrganization.dba_name ??
    workspace.safeOrganization.legal_name ??
    'Proposal Workspace';
  const subtitle = workspace.safeOrganization.primary_contact_email
    ? `${workspace.safeOrganization.primary_contact_name ?? 'Primary contact'} · ${workspace.safeOrganization.primary_contact_email}`
    : workspace.safeOrganization.primary_contact_name ?? 'Review pricing, services, and approval status.';
  const slidesPayload =
    workspace.safeProposal.slides_json &&
    typeof workspace.safeProposal.slides_json === 'object' &&
    'slides' in workspace.safeProposal.slides_json
      ? workspace.safeProposal.slides_json
      : null;
  const slideCount = Array.isArray(slidesPayload?.slides) ? slidesPayload.slides.length : 0;

  return (
    <DashboardShell role={workspace.role}>
      <ProposalWorkspaceHeader
        proposalId={id}
        title={title}
        subtitle={subtitle}
        status={workspace.safeProposal.status}
        activeView="overview"
        slideCount={slideCount}
        logoUrl={workspace.safeOrganization.logo_url ?? null}
        actions={
          workspace.isAdmin ? (
            <ProposalApprovalActions
              proposalId={id}
              canApprove={workspace.isAdmin}
              status={workspace.safeProposal.status}
            />
          ) : undefined
        }
      />
      <ProposalDetailClient
        proposal={workspace.safeProposal}
        organization={workspace.safeOrganization}
        wizardPricing={workspace.wizardPricing}
        services={workspace.safeServices}
        canApprove={workspace.isAdmin}
        canEdit={workspace.canEdit}
        defaultHeadcount={workspace.defaultHeadcount}
        defaultPayFrequency={workspace.defaultPayFrequency as Gf1PayFrequency}
        onSaveDraft={saveProposalDraftAction.bind(null, id)}
        onSubmitForApproval={workspace.isAdmin ? undefined : submitProposalForApprovalAction.bind(null, id)}
        onSaveWizardPricing={workspace.canEdit ? saveProposalPricingJsonAction.bind(null, id) : undefined}
      />
    </DashboardShell>
  );
}
