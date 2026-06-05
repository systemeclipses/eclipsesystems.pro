"use client";

import { useState, type FormEvent, type ChangeEvent } from "react";
import { supaClient } from "@/lib/supabase/client";
import type { Gf1Organization } from "@/lib/gf1/types";

type NewOrganizationFormProps = {
  onCreated?: (organization: Gf1Organization) => void;
};

export default function NewOrganizationForm({ onCreated }: NewOrganizationFormProps) {
  const [formValues, setFormValues] = useState({
    legal_name: "",
    trade_name: "",
    website: "",
    domain: "",
    phone: "",
  });
  const [status, setStatus] = useState<"idle" | "saving" | "error" | "success">("idle");
  const [message, setMessage] = useState<string | null>(null);

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, value } = event.target;
    setFormValues((prev) => ({ ...prev, [name]: value }));
    setStatus("idle");
    setMessage(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedLegalName = formValues.legal_name.trim();
    if (!trimmedLegalName) return;

    setStatus("saving");
    setMessage(null);

    const supabase = supaClient();
    const payload = {
      legal_name: trimmedLegalName,
      trade_name: formValues.trade_name.trim() || null,
      website: formValues.website.trim() || null,
      domain: formValues.domain.trim() || null,
      phone: formValues.phone.trim() || null,
      status: "active",
    };

    const { data, error } = await supabase
      .from("organizations")
      .insert(payload)
      .select("*")
      .single();

    if (error || !data) {
      // Log the full Supabase error object for diagnosis
      console.error("Supabase error:", error?.message, error);

      // Provide a specific error message for the user, fallback to a generic one
      setStatus("error");
      setMessage(error?.message || "Could not create organization. Please try again.");
      return;
    }

    setStatus("success");
    setMessage("Organization created.");
    setFormValues({ legal_name: "", trade_name: "", website: "", domain: "", phone: "" });
    onCreated?.(data as Gf1Organization);
  }

  const inputClass =
    "w-full rounded-lg px-3 py-2 text-sm focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="text-sm font-medium text-neutral-800" htmlFor="legal_name">
          Legal Name
        </label>
        <input
          id="legal_name"
          name="legal_name"
          type="text"
          className={inputClass}
          placeholder="Acme Corporation LLC"
          value={formValues.legal_name}
          onChange={handleChange}
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium text-neutral-800" htmlFor="trade_name">
          Trade Name
        </label>
        <input
          id="trade_name"
          name="trade_name"
          type="text"
          className={inputClass}
          placeholder="Acme Payroll Services"
          value={formValues.trade_name}
          onChange={handleChange}
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="text-sm font-medium text-neutral-800" htmlFor="website">
            Website
          </label>
          <input
            id="website"
            name="website"
            type="url"
            className={inputClass}
            placeholder="https://example.com"
            value={formValues.website}
            onChange={handleChange}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-neutral-800" htmlFor="domain">
            Email Domain
          </label>
          <input
            id="domain"
            name="domain"
            type="text"
            className={inputClass}
            placeholder="example.com"
            value={formValues.domain}
            onChange={handleChange}
          />
        </div>
      </div>
      <div>
        <label className="text-sm font-medium text-neutral-800" htmlFor="phone">
          Main phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          className={inputClass}
          placeholder="(555) 123-4567"
          value={formValues.phone}
          onChange={handleChange}
        />
      </div>
      <button
        type="submit"
        className="w-full rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        disabled={status === "saving" || !formValues.legal_name.trim()}
      >
        {status === "saving" ? "Creating..." : "Create organization"}
      </button>
      {message && (
        <p className={`text-sm ${status === "error" ? "text-rose-500" : "text-emerald-600"}`}>{message}</p>
      )}
    </form>
  );
}
