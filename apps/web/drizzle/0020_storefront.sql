CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.storefront_is_org_member(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.organization_id = target_org_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.deleted_at IS NULL
  );
$$;

CREATE OR REPLACE FUNCTION public.storefront_is_org_admin(target_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.memberships m
    WHERE m.organization_id = target_org_id
      AND m.user_id = auth.uid()
      AND m.status = 'active'
      AND m.deleted_at IS NULL
      AND m.role IN ('owner', 'admin', 'superuser')
  );
$$;

CREATE TABLE IF NOT EXISTS public.store_settings (
  org_id uuid PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  store_name text NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  tax_rate numeric(6, 5) NOT NULL DEFAULT 0,
  branding jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  category text NOT NULL,
  price_cents integer NOT NULL CHECK (price_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  sku text NOT NULL,
  track_inventory boolean NOT NULL DEFAULT true,
  stock_qty integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  low_stock_threshold integer NOT NULL DEFAULT 0 CHECK (low_stock_threshold >= 0),
  status text NOT NULL CHECK (status IN ('active', 'draft', 'archived')) DEFAULT 'draft',
  image_url text,
  is_best_seller boolean NOT NULL DEFAULT false,
  is_service boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  UNIQUE (org_id, sku)
);

CREATE TABLE IF NOT EXISTS public.inventory_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  delta integer NOT NULL,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS public.product_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  size text NOT NULL,
  color text NOT NULL,
  sku text NOT NULL,
  stock_qty integer NOT NULL DEFAULT 0 CHECK (stock_qty >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, sku),
  UNIQUE (product_id, size, color)
);

CREATE TABLE IF NOT EXISTS public.customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);

CREATE TABLE IF NOT EXISTS public.carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid REFERENCES public.customers(id) ON DELETE SET NULL,
  session_id text,
  status text NOT NULL CHECK (status IN ('active', 'converted', 'abandoned')) DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (customer_id IS NOT NULL OR session_id IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  cart_id uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  qty integer NOT NULL CHECK (qty > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (cart_id, product_id)
);

CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.customers(id) ON DELETE RESTRICT,
  status text NOT NULL CHECK (status IN ('pending', 'paid', 'fulfilled', 'refunded', 'cancelled')) DEFAULT 'pending',
  subtotal_cents integer NOT NULL CHECK (subtotal_cents >= 0),
  tax_cents integer NOT NULL CHECK (tax_cents >= 0),
  total_cents integer NOT NULL CHECK (total_cents >= 0),
  currency text NOT NULL DEFAULT 'USD',
  placed_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_variant_id uuid REFERENCES public.product_variants(id) ON DELETE SET NULL,
  name_snapshot text NOT NULL,
  qty integer NOT NULL CHECK (qty > 0),
  unit_price_cents integer NOT NULL CHECK (unit_price_cents >= 0)
);

CREATE TABLE IF NOT EXISTS public.receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  pdf_url text NOT NULL,
  number text NOT NULL,
  issued_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, number),
  UNIQUE (order_id)
);

CREATE INDEX IF NOT EXISTS products_org_status_idx ON public.products (org_id, status, category);
CREATE INDEX IF NOT EXISTS products_org_popular_idx ON public.products (org_id, is_best_seller, status);
CREATE INDEX IF NOT EXISTS products_org_inventory_idx ON public.products (org_id, track_inventory, stock_qty, low_stock_threshold);
CREATE INDEX IF NOT EXISTS product_variants_org_product_idx ON public.product_variants (org_id, product_id);
CREATE INDEX IF NOT EXISTS inventory_adjustments_org_product_idx ON public.inventory_adjustments (org_id, product_id, created_at DESC);
CREATE INDEX IF NOT EXISTS customers_org_email_idx ON public.customers (org_id, email);
CREATE INDEX IF NOT EXISTS carts_org_session_idx ON public.carts (org_id, session_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS cart_items_org_cart_idx ON public.cart_items (org_id, cart_id);
CREATE INDEX IF NOT EXISTS orders_org_status_idx ON public.orders (org_id, status, placed_at DESC);
CREATE INDEX IF NOT EXISTS orders_org_customer_idx ON public.orders (org_id, customer_id, placed_at DESC);
CREATE INDEX IF NOT EXISTS order_items_org_order_idx ON public.order_items (org_id, order_id);
CREATE INDEX IF NOT EXISTS receipts_org_order_idx ON public.receipts (org_id, order_id);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS store_settings_staff_read ON public.store_settings;
CREATE POLICY store_settings_staff_read ON public.store_settings
  FOR SELECT USING (public.storefront_is_org_member(org_id));

DROP POLICY IF EXISTS store_settings_admin_write ON public.store_settings;
CREATE POLICY store_settings_admin_write ON public.store_settings
  FOR ALL USING (public.storefront_is_org_admin(org_id))
  WITH CHECK (public.storefront_is_org_admin(org_id));

DROP POLICY IF EXISTS products_staff_all ON public.products;
CREATE POLICY products_staff_all ON public.products
  FOR ALL USING (public.storefront_is_org_member(org_id))
  WITH CHECK (public.storefront_is_org_admin(org_id));

DROP POLICY IF EXISTS products_public_active_read ON public.products;
CREATE POLICY products_public_active_read ON public.products
  FOR SELECT USING (
    status = 'active'
    AND (is_service = true OR track_inventory = false OR stock_qty > 0)
  );

DROP POLICY IF EXISTS product_variants_staff_all ON public.product_variants;
CREATE POLICY product_variants_staff_all ON public.product_variants
  FOR ALL USING (public.storefront_is_org_member(org_id))
  WITH CHECK (public.storefront_is_org_admin(org_id));

DROP POLICY IF EXISTS product_variants_public_active_read ON public.product_variants;
CREATE POLICY product_variants_public_active_read ON public.product_variants
  FOR SELECT USING (
    product_id IN (
      SELECT p.id FROM public.products p
      WHERE p.status = 'active'
        AND (p.is_service = true OR p.track_inventory = false OR p.stock_qty > 0)
    )
  );

DROP POLICY IF EXISTS inventory_adjustments_staff_all ON public.inventory_adjustments;
CREATE POLICY inventory_adjustments_staff_all ON public.inventory_adjustments
  FOR ALL USING (public.storefront_is_org_member(org_id))
  WITH CHECK (public.storefront_is_org_admin(org_id));

DROP POLICY IF EXISTS customers_staff_all ON public.customers;
CREATE POLICY customers_staff_all ON public.customers
  FOR ALL USING (public.storefront_is_org_member(org_id))
  WITH CHECK (public.storefront_is_org_member(org_id));

DROP POLICY IF EXISTS customers_self_read ON public.customers;
CREATE POLICY customers_self_read ON public.customers
  FOR SELECT USING (email = auth.jwt() ->> 'email');

DROP POLICY IF EXISTS carts_owner_or_staff_all ON public.carts;
CREATE POLICY carts_owner_or_staff_all ON public.carts
  FOR ALL USING (
    public.storefront_is_org_member(org_id)
    OR customer_id IN (SELECT id FROM public.customers WHERE email = auth.jwt() ->> 'email')
  )
  WITH CHECK (
    public.storefront_is_org_member(org_id)
    OR customer_id IN (SELECT id FROM public.customers WHERE email = auth.jwt() ->> 'email')
    OR customer_id IS NULL
  );

DROP POLICY IF EXISTS cart_items_owner_or_staff_all ON public.cart_items;
CREATE POLICY cart_items_owner_or_staff_all ON public.cart_items
  FOR ALL USING (
    public.storefront_is_org_member(org_id)
    OR cart_id IN (
      SELECT c.id FROM public.carts c
      LEFT JOIN public.customers cu ON cu.id = c.customer_id
      WHERE cu.email = auth.jwt() ->> 'email'
    )
  )
  WITH CHECK (
    public.storefront_is_org_member(org_id)
    OR cart_id IN (
      SELECT c.id FROM public.carts c
      LEFT JOIN public.customers cu ON cu.id = c.customer_id
      WHERE cu.email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS orders_staff_or_customer_read ON public.orders;
CREATE POLICY orders_staff_or_customer_read ON public.orders
  FOR SELECT USING (
    public.storefront_is_org_member(org_id)
    OR customer_id IN (SELECT id FROM public.customers WHERE email = auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS orders_staff_write ON public.orders;
CREATE POLICY orders_staff_write ON public.orders
  FOR ALL USING (public.storefront_is_org_member(org_id))
  WITH CHECK (public.storefront_is_org_member(org_id));

DROP POLICY IF EXISTS order_items_staff_or_customer_read ON public.order_items;
CREATE POLICY order_items_staff_or_customer_read ON public.order_items
  FOR SELECT USING (
    public.storefront_is_org_member(org_id)
    OR order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      WHERE c.email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS order_items_staff_write ON public.order_items;
CREATE POLICY order_items_staff_write ON public.order_items
  FOR ALL USING (public.storefront_is_org_member(org_id))
  WITH CHECK (public.storefront_is_org_member(org_id));

DROP POLICY IF EXISTS receipts_staff_or_customer_read ON public.receipts;
CREATE POLICY receipts_staff_or_customer_read ON public.receipts
  FOR SELECT USING (
    public.storefront_is_org_member(org_id)
    OR order_id IN (
      SELECT o.id FROM public.orders o
      JOIN public.customers c ON c.id = o.customer_id
      WHERE c.email = auth.jwt() ->> 'email'
    )
  );

DROP POLICY IF EXISTS receipts_staff_write ON public.receipts;
CREATE POLICY receipts_staff_write ON public.receipts
  FOR ALL USING (public.storefront_is_org_member(org_id))
  WITH CHECK (public.storefront_is_org_member(org_id));
