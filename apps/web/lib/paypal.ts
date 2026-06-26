type PayPalMoney = {
  currency_code: string;
  value: string;
};

export type PayPalInvoiceInput = {
  invoiceNumber: string;
  recipientName?: string | null;
  recipientEmail: string;
  description: string;
  quantity: string;
  amount: string;
  currency: string;
  invoiceDate: string;
  dueDate?: string | null;
};

export type PayPalInvoiceResult = {
  id: string;
  status: string | null;
  recipientViewUrl: string | null;
  invoicerViewUrl: string | null;
};

type PayPalInvoiceResponse = {
  id?: string;
  status?: string;
  detail?: {
    metadata?: {
      recipient_view_url?: string;
      invoicer_view_url?: string;
    };
  };
  links?: Array<{ href: string; rel?: string; method?: string }>;
};

const sandboxBaseUrl = "https://api-m.sandbox.paypal.com";
const liveBaseUrl = "https://api-m.paypal.com";

function paypalBaseUrl() {
  return process.env.PAYPAL_ENV === "live" ? liveBaseUrl : sandboxBaseUrl;
}

export function isPayPalConfigured() {
  return Boolean(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);
}

function money(value: string, currency: string): PayPalMoney {
  return { currency_code: currency, value };
}

function splitRecipientName(name?: string | null) {
  const trimmed = name?.trim();
  if (!trimmed) return undefined;
  const [givenName, ...rest] = trimmed.split(/\s+/);
  return {
    given_name: givenName,
    surname: rest.join(" ") || givenName
  };
}

function businessName() {
  return process.env.PAYPAL_BUSINESS_NAME || process.env.NEXT_PUBLIC_APP_NAME || "Eclipse Systems";
}

async function paypalRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getPayPalAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  headers.set("Prefer", "return=representation");

  const response = await fetch(`${paypalBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PayPal request failed (${response.status}): ${body || response.statusText}`);
  }

  if (response.status === 202 || response.status === 204) return {} as T;
  return response.json() as Promise<T>;
}

async function getPayPalAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("PayPal credentials are not configured.");

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const response = await fetch(`${paypalBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Language": "en_US",
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: "grant_type=client_credentials",
    cache: "no-store"
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PayPal token request failed (${response.status}): ${body || response.statusText}`);
  }

  const data = await response.json() as { access_token?: string };
  if (!data.access_token) throw new Error("PayPal token response did not include an access token.");
  return data.access_token;
}

function invoiceUrls(invoice: PayPalInvoiceResponse) {
  const selfHref = invoice.links?.find((link) => link.rel === "self")?.href;
  const idFromHref = selfHref?.split("/").pop();
  const recipientLink = invoice.links?.find((link) => link.rel === "recipient_view_url" || link.rel === "payer-view")?.href;
  const invoicerLink = invoice.links?.find((link) => link.rel === "invoicer_view_url" || link.rel === "self")?.href;
  return {
    id: invoice.id ?? idFromHref,
    recipientViewUrl: invoice.detail?.metadata?.recipient_view_url ?? recipientLink ?? null,
    invoicerViewUrl: invoice.detail?.metadata?.invoicer_view_url ?? invoicerLink ?? null
  };
}

async function getPayPalInvoice(paypalInvoiceId: string) {
  return paypalRequest<PayPalInvoiceResponse>(`/v2/invoicing/invoices/${paypalInvoiceId}`, { method: "GET" });
}

export async function createPayPalInvoice(input: PayPalInvoiceInput): Promise<PayPalInvoiceResult> {
  const recipientName = splitRecipientName(input.recipientName);
  const payload = {
    detail: {
      invoice_number: input.invoiceNumber,
      invoice_date: input.invoiceDate,
      currency_code: input.currency,
      note: process.env.PAYPAL_INVOICE_NOTE ?? "Thank you for your business.",
      terms_and_conditions: process.env.PAYPAL_INVOICE_TERMS,
      payment_term: input.dueDate ? { term_type: "DUE_ON_DATE_SPECIFIED", due_date: input.dueDate } : { term_type: "NET_10" }
    },
    invoicer: {
      business_name: businessName(),
      email_address: process.env.PAYPAL_INVOICER_EMAIL || undefined
    },
    primary_recipients: [
      {
        billing_info: {
          ...(recipientName ? { name: recipientName } : {}),
          email_address: input.recipientEmail
        }
      }
    ],
    items: [
      {
        name: input.description,
        quantity: input.quantity,
        unit_amount: money(input.amount, input.currency),
        unit_of_measure: "QUANTITY"
      }
    ],
    configuration: {
      tax_calculated_after_discount: true,
      tax_inclusive: false
    }
  };

  const invoice = await paypalRequest<PayPalInvoiceResponse>("/v2/invoicing/invoices", {
    method: "POST",
    body: JSON.stringify(payload)
  });
  const urls = invoiceUrls(invoice);
  if (!urls.id) throw new Error("PayPal did not return an invoice ID.");
  return {
    id: urls.id,
    status: invoice.status ?? null,
    recipientViewUrl: urls.recipientViewUrl,
    invoicerViewUrl: urls.invoicerViewUrl
  };
}

export async function sendPayPalInvoice(paypalInvoiceId: string): Promise<PayPalInvoiceResult> {
  await paypalRequest<PayPalInvoiceResponse>(`/v2/invoicing/invoices/${paypalInvoiceId}/send`, {
    method: "POST",
    body: JSON.stringify({
      send_to_recipient: true,
      send_to_invoicer: true
    })
  });
  const invoice = await getPayPalInvoice(paypalInvoiceId);
  const urls = invoiceUrls(invoice);
  return {
    id: invoice.id ?? urls.id ?? paypalInvoiceId,
    status: invoice.status ?? "UNPAID",
    recipientViewUrl: urls.recipientViewUrl,
    invoicerViewUrl: urls.invoicerViewUrl
  };
}
