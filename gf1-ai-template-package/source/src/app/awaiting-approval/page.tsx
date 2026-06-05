import Link from 'next/link';

export default function AwaitingApproval() {
  return (
    <section className="auth-wrapper space-stack">
      <article className="auth-card space-stack">
        <div className="auth-logo-wrap">
          <img src="https://galactic365.com/g365.svg" alt="Galactic365" className="auth-logo auth-logo--xl" />
        </div>
        <p className="muted">
          Your profile has been created and is awaiting an administrator review. You will receive an
          email as soon as your account is cleared for takeoff.
        </p>
        <Link href="/signin" className="auth-continue-link cta-button">
          Return to sign in
        </Link>
      </article>
    </section>
  );
}
