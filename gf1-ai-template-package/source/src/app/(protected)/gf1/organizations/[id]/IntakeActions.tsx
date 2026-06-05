"use client";

import { useActionState, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  generateIntakeLinkAction,
  sendProspectIntakeEmailAction,
  type IntakeEmailState,
  type IntakeLinkState,
} from './actions';

type Props = {
  organizationId: string;
  primaryContactEmail: string | null;
};

const INITIAL_LINK_STATE: IntakeLinkState = {};
const INITIAL_EMAIL_STATE: IntakeEmailState = {};

const primaryButtonStyle: CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  borderRadius: '8px',
  border: '1px solid rgba(61, 130, 255, 0.3)',
  background: 'rgba(61, 130, 255, 0.15)',
  color: '#f5f8ff',
  fontWeight: 600,
  fontSize: '14px',
  cursor: 'pointer',
  textAlign: 'center',
};

const ghostButtonStyle: CSSProperties = {
  flex: '1 1 120px',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  background: 'transparent',
  color: '#e8edf5',
  fontWeight: 600,
  fontSize: '13px',
  cursor: 'pointer',
  textAlign: 'center',
};

export default function ProspectIntakeActions({ organizationId, primaryContactEmail }: Props) {
  const [copied, setCopied] = useState(false);
  const [linkState, triggerLink] = useActionState(
    generateIntakeLinkAction.bind(null, organizationId),
    INITIAL_LINK_STATE
  );
  const [emailState, triggerEmail] = useActionState(sendProspectIntakeEmailAction, INITIAL_EMAIL_STATE);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timer);
  }, [copied]);

  async function handleCopy() {
    if (!linkState.url) return;
    try {
      await navigator.clipboard.writeText(linkState.url);
      setCopied(true);
    } catch (err) {
      console.error('Failed to copy intake link', err);
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      <form action={triggerLink}>
        <button type="submit" style={primaryButtonStyle}>
          {linkState.url ? 'Refresh intake link' : 'Generate intake link'}
        </button>
      </form>

      {linkState.url && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            padding: '12px 14px',
            background: 'rgba(0,0,0,0.2)',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <code style={{ color: '#9fc5ff', fontSize: '13px', wordBreak: 'break-all' }}>{linkState.url}</code>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <a
              href={linkState.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ ...ghostButtonStyle, flex: '1 1 160px', textDecoration: 'none' }}
            >
              Open form
            </a>
            <button
              type="button"
              onClick={handleCopy}
              style={{ ...ghostButtonStyle, flex: '1 1 120px' }}
            >
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>
      )}

      <form action={triggerEmail} style={{ marginTop: '4px' }}>
        <input type="hidden" name="organization_id" value={organizationId} />
        <button
          type="submit"
          style={{ ...primaryButtonStyle, background: 'rgba(16, 185, 129, 0.2)', borderColor: 'rgba(16, 185, 129, 0.4)' }}
          disabled={!primaryContactEmail}
          title={primaryContactEmail ? '' : 'Add a primary contact email to send the form'}
        >
          {primaryContactEmail
            ? `Send form to ${primaryContactEmail}`
            : 'Add a primary contact to send form'}
        </button>
      </form>

      {(linkState.error || emailState.error) && (
        <p style={{ color: '#D65B4A', fontSize: '13px' }}>{linkState.error || emailState.error}</p>
      )}
      {emailState.success && <p style={{ color: '#4ade80', fontSize: '13px' }}>{emailState.success}</p>}
    </div>
  );
}
