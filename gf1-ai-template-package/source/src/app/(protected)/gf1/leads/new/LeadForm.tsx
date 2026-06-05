"use client";

import React, { useActionState, useState, useEffect, useMemo, useRef } from 'react';
import { createLeadAction, type LeadActionState } from './actions';
import Link from 'next/link';
import styles from './LeadForm.module.css';
import { useFormStatus } from 'react-dom';
import { useSearchParams } from 'next/navigation';

const INPUT_STYLE = {
  width: '100%',
  padding: '12px 16px',
  fontSize: '15px',
  background: 'rgba(255, 255, 255, 0.06)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '8px',
  color: 'rgba(255, 255, 255, 0.92)',
  transition: 'all 0.2s ease',
} as const;

const BUTTON_PRIMARY_STYLE = {
  padding: '10px 32px',
  fontSize: '14px',
  fontWeight: 600,
  background: 'linear-gradient(135deg, rgba(61, 130, 255, 0.24), rgba(61, 130, 255, 0.12))',
  border: '1px solid rgba(153, 198, 255, 0.35)',
  borderRadius: '8px',
  color: 'white',
  cursor: 'pointer',
  boxShadow: 'inset 0 1px 0 rgba(255, 255, 255, 0.06)',
  letterSpacing: '0.3px',
  transition: 'all 0.2s ease',
} as const;

const BUTTON_SECONDARY_STYLE = {
  padding: '12px 32px',
  fontSize: '15px',
  fontWeight: 600,
  background: 'rgba(255, 255, 255, 0.08)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: '8px',
  color: 'rgba(255, 255, 255, 0.9)',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
} as const;

const INITIAL: LeadActionState = { error: undefined };

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button
      type="submit"
      disabled={pending}
      style={{
        ...BUTTON_PRIMARY_STYLE,
        opacity: pending ? 0.5 : 1,
        cursor: pending ? 'not-allowed' : 'pointer',
      }}
    >
      <i className="fas fa-check" style={{ marginRight: '8px' }}></i>
      {pending ? 'Creating...' : 'Create suspect'}
    </button>
  );
}

export default function LeadForm() {
  const [state, formAction] = useActionState(createLeadAction, INITIAL);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const searchParams = useSearchParams();

  const prefill = useMemo(() => ({
    legal_name: searchParams.get('legal_name') ?? '',
    trade_name: searchParams.get('trade_name') ?? '',
    website: searchParams.get('website') ?? '',
    contact_name: searchParams.get('contact_name') ?? '',
    contact_title: searchParams.get('contact_title') ?? '',
    contact_phone: searchParams.get('contact_phone') ?? '',
    contact_email: searchParams.get('contact_email') ?? '',
  }), [searchParams]);

  const next = () => setStep((s) => (s < 3 ? ((s + 1) as 1 | 2 | 3) : s));
  const back = () => setStep((s) => (s > 1 ? ((s - 1) as 1 | 2 | 3) : s));
  
  // Reset to step 1 when there's an error so user can see it
  useEffect(() => {
    if (state?.error) {
      setStep(1);
    }
  }, [state?.error]);
  
  return (
    <form
      action={formAction}
      noValidate
      style={{
        background: 'rgba(255, 255, 255, 0.04)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '16px',
        padding: '32px',
        color: 'white',
      }}
      className={styles.leadForm}
    >
      <div style={{ marginBottom: '32px' }}>
        <p style={{ fontSize: '13px', fontWeight: 600, textTransform: 'uppercase', color: 'rgba(255, 255, 255, 0.5)', letterSpacing: '0.5px', marginBottom: '8px' }}>
          Suspect intake
        </p>
        <h1 style={{ fontSize: '28px', fontWeight: 700, color: 'white', marginBottom: '8px' }}>
          Create a suspect
        </h1>
        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', lineHeight: '1.5' }}>
          Capture enough to start the relationship. You can enrich via the prospect intake later.
        </p>
      </div>

      {/* Lead progress header using module-scoped BEM classes */}
      <ol className={styles.leadProgressBar}>
        {[
          { n: 1, label: 'Business', icon: 'fa-solid fa-building' },
          { n: 2, label: 'Contact', icon: 'fa-solid fa-user' },
          { n: 3, label: 'Logo', icon: 'fa-solid fa-image' },
        ].map(({ n, label, icon }) => (
          <li
            key={n}
            className={`${styles.leadProgressItem} ${step >= n ? styles['leadProgressItem--active'] : ''}`}
          >
            <div>
              <span className={styles.leadProgressIcon}>
                <i className={icon} aria-hidden />
              </span>
              {label}
            </div>
          </li>
        ))}
      </ol>

      {/* Step 1: Business Info */}
      <div style={{ display: step !== 1 ? 'none' : 'block', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <Field label="Company legal name" name="legal_name" required defaultValue={prefill.legal_name} />
          <Field label="Trade name (DBA)" name="trade_name" defaultValue={prefill.trade_name} />
        </div>
        <Field label="Website" name="website" type="url" placeholder="https://example.com" defaultValue={prefill.website} />
        
        <div style={{ marginTop: '24px', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.9)', marginBottom: '16px' }}>
            Company Address
          </h3>
          <div style={{ display: 'grid', gap: '20px' }}>
            <Field label="Street Address" name="address_line1" placeholder="123 Main St" required />
            <Field label="Address Line 2" name="address_line2" placeholder="Suite 100" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
              <Field label="City" name="city" placeholder="Los Angeles" required />
              <Field label="State" name="state" placeholder="CA" required />
              <Field label="Zip Code" name="postal_code" placeholder="90001" required />
            </div>
          </div>
        </div>
      </div>

      {/* Step 2: Contact Info */}
      <div style={{ display: step !== 2 ? 'none' : 'block', marginBottom: '24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', marginBottom: '20px' }}>
          <Field label="Primary contact full name" name="contact_name" required defaultValue={prefill.contact_name} />
          <Field label="Title" name="contact_title" defaultValue={prefill.contact_title} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          <Field label="Phone" name="contact_phone" type="tel" defaultValue={prefill.contact_phone} />
          <Field label="Email" name="contact_email" type="email" required defaultValue={prefill.contact_email} />
        </div>
      </div>

      {/* Step 3: Logo Upload */}
      <div style={{ display: step !== 3 ? 'none' : 'block', marginBottom: '24px' }}>
        <p style={{ fontSize: '15px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '16px' }}>
          Optional: upload a logo to personalize the org.
        </p>
        <LogoUpload />
      </div>

      {state?.error && (
        <div style={{
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
        }}>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#fca5a5', marginBottom: '4px' }}>
            <i className="fas fa-exclamation-circle" style={{ marginRight: '8px' }}></i>
            Error creating suspect
          </p>
          <p style={{ fontSize: '14px', color: '#fecaca' }}>{state.error}</p>
        </div>
      )}

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '24px',
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <button
          type="button"
          onClick={back}
          disabled={step === 1}
          style={{
            ...BUTTON_SECONDARY_STYLE,
            opacity: step === 1 ? 0.5 : 1,
            cursor: step === 1 ? 'not-allowed' : 'pointer',
          }}
        >
          <i className="fas fa-arrow-left" style={{ marginRight: '8px' }}></i>
          Back
        </button>
        {step < 3 ? (
          <button
            type="button"
            onClick={next}
            style={BUTTON_PRIMARY_STYLE}
          >
            Next
            <i className="fas fa-arrow-right" style={{ marginLeft: '8px' }}></i>
          </button>
        ) : (
          <SubmitButton />
        )}
      </div>
    </form>
  );
}

type FieldProps = {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
};

function LogoUpload() {
  const [fileName, setFileName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        name="logo_file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        style={BUTTON_PRIMARY_STYLE}
      >
        <i className="fas fa-upload" style={{ marginRight: '8px' }}></i>
        {fileName ? fileName : 'Choose file'}
      </button>
    </div>
  );
}

function Field({ label, name, type = 'text', required, placeholder, defaultValue }: FieldProps) {
  return (
    <label style={{ display: 'block' }}>
      <span style={{
        display: 'block',
        fontSize: '14px',
        fontWeight: 500,
        color: 'rgba(255, 255, 255, 0.9)',
        marginBottom: '8px',
      }}>
        {label}
        {required && <span style={{ color: 'var(--brand-gold)', marginLeft: '4px' }}>*</span>}
      </span>
      <input
        style={INPUT_STYLE}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--brand-blue-light)';
          e.target.style.boxShadow = '0 0 0 3px rgba(99, 173, 242, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)';
          e.target.style.boxShadow = 'none';
        }}
      />
    </label>
  );
}
