ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS recipient_name text,
  ADD COLUMN IF NOT EXISTS recipient_email text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'USD',
  ADD COLUMN IF NOT EXISTS paypal_invoice_id text,
  ADD COLUMN IF NOT EXISTS paypal_status text,
  ADD COLUMN IF NOT EXISTS paypal_recipient_view_url text,
  ADD COLUMN IF NOT EXISTS paypal_invoicer_view_url text,
  ADD COLUMN IF NOT EXISTS paypal_last_error text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS invoices_paypal_invoice_id_idx
  ON public.invoices(paypal_invoice_id)
  WHERE paypal_invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS invoices_org_status_idx
  ON public.invoices(organization_id, status)
  WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS invoices_set_updated_at ON public.invoices;
CREATE TRIGGER invoices_set_updated_at BEFORE UPDATE ON public.invoices
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
