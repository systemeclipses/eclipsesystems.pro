"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

type Status = "idle" | "submitting" | "success" | "error";

export function ScheduleDemoForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setStatus("submitting");
    setMessage("");

    const response = await fetch("/api/schedule-demo", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: data.get("name"),
        email: data.get("email"),
        businessName: data.get("businessName"),
        employeeCount: data.get("employeeCount"),
        needs: data.get("needs")
      })
    });

    const payload = (await response.json().catch(() => null)) as { error?: string } | null;

    if (!response.ok) {
      setStatus("error");
      setMessage(payload?.error ?? "We could not send the request. Please try again.");
      return;
    }

    form.reset();
    setStatus("success");
    setMessage("Demo request received. We will follow up with the next step.");
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-5 rounded-md border border-border bg-white/75 p-5 shadow-sm md:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Your name
          <input
            name="name"
            required
            autoComplete="name"
            className="h-11 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary"
            placeholder="Jordan Carter"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Email address
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            className="h-11 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary"
            placeholder="jordan@company.com"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_0.6fr]">
        <label className="grid gap-2 text-sm font-semibold">
          Business name
          <input
            name="businessName"
            required
            autoComplete="organization"
            className="h-11 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary"
            placeholder="Carter Operations Group"
          />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Employee count
          <input
            name="employeeCount"
            type="number"
            min="1"
            required
            className="h-11 rounded-md border border-border bg-white px-3 font-normal outline-none focus:border-primary"
            placeholder="25"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-semibold">
        What are you looking for?
        <textarea
          name="needs"
          required
          className="min-h-48 rounded-md border border-border bg-white px-3 py-3 font-normal outline-none focus:border-primary"
          placeholder="Tell us what you want the software to handle, what tools you use now, and where the current process breaks."
        />
      </label>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted-foreground">
          We will use this to prepare the right demo, not to drop you into a generic sales sequence.
        </p>
        <Button className="h-11 bg-primary px-5 text-primary-foreground hover:bg-[#314839]" disabled={status === "submitting"}>
          {status === "submitting" ? "Sending..." : "Schedule a demo"}
          {status === "success" ? <Check className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}
        </Button>
      </div>

      {message ? (
        <p className={`rounded-md px-3 py-2 text-sm ${status === "error" ? "bg-red-50 text-red-700" : "bg-cream text-muted-foreground"}`}>
          {message}
        </p>
      ) : null}
    </form>
  );
}
