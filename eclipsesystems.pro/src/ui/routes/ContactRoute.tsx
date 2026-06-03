import { FormEvent, useState } from "react";
import { Link } from "react-router-dom";

type Status = "idle" | "submitted";

export function ContactRoute() {
  const [status, setStatus] = useState<Status>("idle");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.currentTarget.reset();
    setStatus("submitted");
  }

  return (
    <section className="static-route contact-route" aria-labelledby="route-title">
      <p className="eyebrow">Schedule a Demo</p>
      <h2 id="route-title">Tell us what you need the software to do.</h2>
      <p>
        Share the basics about your business and the workflow you want to fix. We will use this to
        prepare the right Eclipse examples before we talk.
      </p>

      <form className="contact-form" onSubmit={handleSubmit}>
        <div className="form-grid two-columns">
          <label>
            Your name
            <input name="name" type="text" autoComplete="name" required placeholder="Jordan Carter" />
          </label>
          <label>
            Email address
            <input name="email" type="email" autoComplete="email" required placeholder="jordan@company.com" />
          </label>
        </div>

        <div className="form-grid two-columns wide-left">
          <label>
            Business name
            <input name="businessName" type="text" autoComplete="organization" required placeholder="Carter Operations Group" />
          </label>
          <label>
            Employee count
            <input name="employeeCount" type="number" min="1" required placeholder="25" />
          </label>
        </div>

        <label>
          What are you looking for?
          <textarea
            name="needs"
            required
            placeholder="Tell us what you want the software to handle, what tools you use now, and where the current process breaks."
          />
        </label>

        <div className="form-actions">
          <button type="submit">Schedule a demo</button>
          <span>We will follow up with the next step.</span>
        </div>

        {status === "submitted" ? (
          <p className="form-message">Demo request received. We will follow up soon.</p>
        ) : null}
      </form>

      <Link to="/">Return to the homepage</Link>
    </section>
  );
}
