import {
  boolean,
  integer,
  jsonb,
  numeric,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid
} from "drizzle-orm/pg-core";
import type { AdapterAccountType } from "next-auth/adapters";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image")
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state")
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId]
    })
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull()
});

export const passwordCredentials = pgTable("password_credentials", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  passwordHash: text("password_hash").notNull(),
  passwordSalt: text("password_salt").notNull(),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow()
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull()
  },
  (verificationToken) => ({
    compoundKey: primaryKey({
      columns: [verificationToken.identifier, verificationToken.token]
    })
  })
);

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  defaultOrganizationId: uuid("default_organization_id"),
  createdAt: timestamp("created_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const organizations = pgTable("organizations", {
  id: uuid("id").defaultRandom().primaryKey(),
  kind: text("kind").notNull().default("team"),
  name: text("name").notNull(),
  slug: text("slug"),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => profiles.id),
  stripeCustomerId: text("stripe_customer_id"),
  defaultCurrency: text("default_currency").notNull().default("USD"),
  timezone: text("timezone").notNull().default("UTC"),
  settings: jsonb("settings").notNull().default({}),
  createdAt: timestamp("created_at", { mode: "date" }),
  updatedAt: timestamp("updated_at", { mode: "date" }),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: text("role").notNull().default("member"),
    acceptedAt: timestamp("accepted_at", { mode: "date" }),
    status: text("status").notNull().default("active"),
    deletedAt: timestamp("deleted_at", { mode: "date" })
  },
  (membership) => ({
    organizationUserIdx: uniqueIndex("memberships_organization_user_idx").on(
      membership.organizationId,
      membership.userId
    )
  })
);

export const projects = pgTable("projects", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  code: text("code"),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const timeEntries = pgTable("time_entries", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  membershipId: uuid("membership_id").notNull(),
  projectId: uuid("project_id"),
  description: text("description"),
  startedAt: timestamp("started_at", { mode: "date" }).notNull(),
  endedAt: timestamp("ended_at", { mode: "date" }),
  durationSeconds: integer("duration_seconds"),
  source: text("source").notNull().default("manual"),
  status: text("status").notNull(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  plan: text("plan").notNull(),
  seats: integer("seats").notNull(),
  status: text("status").notNull(),
  billingInterval: text("billing_interval"),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const clients = pgTable("clients", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  name: text("name").notNull(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const invoices = pgTable("invoices", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  number: text("number").notNull(),
  total: numeric("total"),
  status: text("status").notNull(),
  deletedAt: timestamp("deleted_at", { mode: "date" })
});

export const invitations = pgTable("invitations", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id").notNull(),
  email: text("email").notNull(),
  token: text("token").notNull(),
  status: text("status").notNull()
});

export const featureFlags = pgTable("feature_flags", {
  key: text("key").primaryKey(),
  enabled: boolean("enabled").notNull().default(false)
});
