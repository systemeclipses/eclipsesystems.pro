import { DashboardShell } from '@/app/(protected)/gf1/components/DashboardShell';
import { ProposalWorkspaceHeader } from '../../_components/ProposalWorkspaceHeader';
import { ProposalApprovalActions } from '../../_components/ProposalApprovalActions';
import { ProposalSlidesClient } from '../../_components/ProposalSlidesClient';
import { updateProposalSlidesAction } from '../actions';
import { loadProposalWorkspace } from '../workspace-data';

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ProposalSlidesPage({ params }: Props) {
  const { id } = await params;
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
        activeView="slides"
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
      <ProposalSlidesClient
        proposal={workspace.safeProposal}
        organization={workspace.safeOrganization}
        canEdit={workspace.canEdit}
        onSaveSlides={updateProposalSlidesAction.bind(null, id)}
      />
    </DashboardShell>
  );
}
