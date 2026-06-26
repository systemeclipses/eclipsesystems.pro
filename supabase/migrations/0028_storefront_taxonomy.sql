ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS audience text,
  ADD COLUMN IF NOT EXISTS product_type text,
  ADD COLUMN IF NOT EXISTS default_color text;

UPDATE public.products
SET
  slug = COALESCE(
    slug,
    regexp_replace(
      regexp_replace(lower(name), '&', 'and', 'g'),
      '[^a-z0-9]+',
      '-',
      'g'
    )
  ),
  audience = COALESCE(
    audience,
    CASE
      WHEN category = 'Men''s' THEN 'mens'
      WHEN category = 'Women''s' THEN 'womens'
      WHEN category = 'Youth / Kids' THEN 'youth'
      ELSE NULL
    END
  ),
  product_type = COALESCE(product_type, category),
  default_color = COALESCE(default_color, 'black')
WHERE slug IS NULL OR audience IS NULL OR product_type IS NULL OR default_color IS NULL;

WITH ranked AS (
  SELECT id, slug, row_number() OVER (PARTITION BY org_id, slug ORDER BY created_at, id) AS rn
  FROM public.products
)
UPDATE public.products p
SET slug = ranked.slug || '-' || ranked.rn
FROM ranked
WHERE ranked.id = p.id AND ranked.rn > 1;

ALTER TABLE public.products
  ALTER COLUMN slug SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS products_org_slug_idx ON public.products (org_id, slug);
CREATE INDEX IF NOT EXISTS products_org_audience_idx ON public.products (org_id, audience, status);
CREATE INDEX IF NOT EXISTS products_org_product_type_idx ON public.products (org_id, product_type, status);
