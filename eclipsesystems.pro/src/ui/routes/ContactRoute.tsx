import { Link } from "react-router-dom";

export function ContactRoute() {
  return (
    <section className="static-route" aria-labelledby="route-title">
      <p className="eyebrow">Contact</p>
      <h2 id="route-title">Tell us what needs to run cleaner.</h2>
      <p>
        Share the workflow that is costing time now: approvals, schedule coverage, project billing,
        legal matter controls, or the handoff between them.
      </p>
      <div className="contact-options">
        <a className="primary-link" href="mailto:hello@eclipsesystems.pro?subject=Eclipse%20Systems%20workflow%20conversation">
          Email Eclipse Systems
        </a>
        <Link className="secondary-link" to="/pricing">
          Review packages
        </Link>
        <Link className="text-link" to="/">
          Return home
        </Link>
      </div>
      <p className="contact-note">hello@eclipsesystems.pro</p>
    </section>
  );
}
