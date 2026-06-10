import { randomBytes, scrypt as scryptCallback } from "node:crypto";
import { createRequire } from "node:module";
import { promisify } from "node:util";

const require = createRequire(new URL("../apps/web/package.json", import.meta.url));
const postgres = require("postgres");
const scrypt = promisify(scryptCallback);
const password = process.env.TEST_USER_PASSWORD || "Password123!";
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required.");
  process.exit(1);
}

const sql = postgres(databaseUrl, { max: 1, prepare: false });

const testOrg = {
  id: "00000000-0000-4000-8000-000000000001",
  name: "Eclipse Role Test Org"
};

const users = [
  { id: "00000000-0000-4000-8000-000000000101", email: "superuser@test.eclipsesystems.local", name: "Superuser Test", membershipRole: "superuser", productRoles: [] },
  { id: "00000000-0000-4000-8000-000000000102", email: "timekeeping.employee@test.eclipsesystems.local", name: "Timekeeping Employee", membershipRole: "member", productRoles: [["timekeeping", "employee"]] },
  { id: "00000000-0000-4000-8000-000000000103", email: "timekeeping.admin@test.eclipsesystems.local", name: "Timekeeping Admin", membershipRole: "admin", productRoles: [["timekeeping", "admin"]] },
  { id: "00000000-0000-4000-8000-000000000104", email: "invoicing.employee@test.eclipsesystems.local", name: "Invoicing Employee", membershipRole: "member", productRoles: [["eclipse", "employee"]] },
  { id: "00000000-0000-4000-8000-000000000105", email: "invoicing.admin@test.eclipsesystems.local", name: "Invoicing Admin", membershipRole: "admin", productRoles: [["eclipse", "admin"]] },
  { id: "00000000-0000-4000-8000-000000000106", email: "mission.employee@test.eclipsesystems.local", name: "Mission Command Employee", membershipRole: "member", productRoles: [["mission_command", "employee"]] },
  { id: "00000000-0000-4000-8000-000000000107", email: "mission.admin@test.eclipsesystems.local", name: "Mission Command Admin", membershipRole: "admin", productRoles: [["mission_command", "admin"]] },
  { id: "00000000-0000-4000-8000-000000000108", email: "suite.employee@test.eclipsesystems.local", name: "Suite Employee", membershipRole: "member", productRoles: [["suite", "employee"]] },
  { id: "00000000-0000-4000-8000-000000000109", email: "suite.admin@test.eclipsesystems.local", name: "Suite Admin", membershipRole: "admin", productRoles: [["suite", "admin"]] },
  { id: "00000000-0000-4000-8000-000000000110", email: "legal.employee@test.eclipsesystems.local", name: "Legal Employee", membershipRole: "member", productRoles: [["legal_addon", "employee"]] },
  { id: "00000000-0000-4000-8000-000000000111", email: "legal.admin@test.eclipsesystems.local", name: "Legal Admin", membershipRole: "admin", productRoles: [["legal_addon", "admin"]] },
  {
    id: "00000000-0000-4000-8000-000000000112",
    email: "timekeeping.mission.employee@test.eclipsesystems.local",
    name: "Timekeeping + Mission Employee",
    membershipRole: "member",
    productRoles: [["timekeeping", "employee"], ["mission_command", "employee"]]
  }
];

async function hashPassword(value) {
  const passwordSalt = randomBytes(16).toString("base64");
  const passwordHash = (await scrypt(value, passwordSalt, 64)).toString("base64");
  return { passwordHash, passwordSalt };
}

function membershipIdFor(userId) {
  return userId.replace("000000000", "000000100");
}

async function main() {
  const owner = users[0];

  await sql.begin(async (tx) => {
    for (const user of users) {
      const credential = await hashPassword(password);

      await tx`
        insert into users (id, name, email, email_verified)
        values (${user.id}, ${user.name}, ${user.email}, now())
        on conflict (id) do update set name = excluded.name, email = excluded.email
      `;

      await tx`
        insert into password_credentials (user_id, password_hash, password_salt)
        values (${user.id}, ${credential.passwordHash}, ${credential.passwordSalt})
        on conflict (user_id) do update set
          password_hash = excluded.password_hash,
          password_salt = excluded.password_salt,
          updated_at = now()
      `;

      await tx`
        insert into profiles (id, email, full_name, display_name)
        values (${user.id}, ${user.email}, ${user.name}, ${user.name})
        on conflict (id) do update set
          email = excluded.email,
          full_name = excluded.full_name,
          display_name = excluded.display_name,
          deleted_at = null
      `;
    }

    await tx`
      insert into organizations (id, kind, name, owner_id)
      values (${testOrg.id}, 'team', ${testOrg.name}, ${owner.id})
      on conflict (id) do update set name = excluded.name, owner_id = excluded.owner_id, deleted_at = null
    `;

    await tx`
      insert into subscriptions (organization_id, plan, billing_interval, status, seats, current_period_start, current_period_end)
      values (${testOrg.id}, 'suite', 'month', 'active', ${users.length}, now(), now() + interval '1 year')
      on conflict (organization_id) do update set
        plan = excluded.plan,
        status = excluded.status,
        seats = excluded.seats,
        current_period_end = excluded.current_period_end
    `;

    for (const product of ["timekeeping", "eclipse", "mission_command", "legal_addon"]) {
      await tx`
        insert into product_entitlements (organization_id, product, status, acquired_via, features, ends_at)
        values (${testOrg.id}, ${product}, 'active', ${product === "legal_addon" ? "individual" : "suite"}, '[]'::jsonb, null)
        on conflict (organization_id, product) where status in ('active', 'trial') and ends_at is null
        do update set
          status = excluded.status,
          acquired_via = excluded.acquired_via,
          updated_at = now()
      `;
    }

    for (const user of users) {
      const membershipId = membershipIdFor(user.id);

      await tx`
        update profiles
        set default_organization_id = ${testOrg.id}
        where id = ${user.id}
      `;

      await tx`
        insert into memberships (id, organization_id, user_id, role, accepted_at, status)
        values (${membershipId}, ${testOrg.id}, ${user.id}, ${user.membershipRole}, now(), 'active')
        on conflict (organization_id, user_id) do update set
          role = excluded.role,
          accepted_at = excluded.accepted_at,
          status = excluded.status,
          deleted_at = null
      `;

      await tx`
        update membership_product_roles
        set revoked_at = now(), revoked_by_membership_id = ${membershipId}, revoke_reason = 'Reset by role test seed'
        where organization_id = ${testOrg.id}
          and membership_id = ${membershipId}
          and revoked_at is null
      `;

      for (const [product, accessRole] of user.productRoles) {
        await tx`
          insert into membership_product_roles (organization_id, membership_id, product, access_role, granted_by_membership_id, revoked_at, revoked_by_membership_id, revoke_reason)
          values (${testOrg.id}, ${membershipId}, ${product}, ${accessRole}, ${membershipIdFor(owner.id)}, null, null, null)
          on conflict (membership_id, product) do update set
            access_role = excluded.access_role,
            granted_by_membership_id = excluded.granted_by_membership_id,
            granted_at = now(),
            revoked_at = null,
            revoked_by_membership_id = null,
            revoke_reason = null
        `;
      }
    }
  });

  console.log(`Seeded ${users.length} role test users in ${testOrg.name}.`);
  console.log(`Password for every test user: ${password}`);
  console.table(users.map((user) => ({ email: user.email, role: user.membershipRole, productRoles: user.productRoles.map(([product, accessRole]) => `${product}:${accessRole}`).join(", ") || "all products" })));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await sql.end();
  });
