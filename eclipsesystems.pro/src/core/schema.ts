export const siteRoutes = [
  "/",
  "/pricing",
  "/features",
  "/industries",
  "/locations",
  "/utbms",
  "/glossary",
  "/blog",
  "/guides",
  "/plans/:plan",
  "/features/:slug",
  "/vs/:competitor",
  "/alternatives/:competitor",
  "/locations/:city",
  "/industries/:industry",
  "/utbms/:code",
  "/glossary/:term",
  "*"
] as const;

export const planCodes = ["timekeeping", "mission_command", "eclipse", "suite", "legal_addon"] as const;
export const basePlanCodes = ["timekeeping", "mission_command", "eclipse", "suite"] as const;

export const eclipseJsonSchema = {
  type: "object",
  additionalProperties: true,
  properties: {
    organization_id: { type: ["string", "null"], pattern: "^[0-9a-fA-F-]{36}$" },
    plan_code: { type: ["string", "null"], enum: [...planCodes, null] },
    billing_interval: { type: ["string", "null"], enum: ["month", "year", null] },
    seats: { type: ["integer", "null"], minimum: 1 },
    data: {
      anyOf: [
        { type: "object", additionalProperties: true },
        { type: "array", items: {} },
        { type: "string" },
        { type: "number" },
        { type: "boolean" },
        { type: "null" }
      ]
    }
  }
} as const;
