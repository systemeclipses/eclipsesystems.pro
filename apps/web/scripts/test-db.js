import postgres from 'postgres';

(async () => {
  const connectionString = process.env.DATABASE_URL ?? process.env.DIRECT_URL;
  if (!connectionString) {
    console.error('DATABASE_URL or DIRECT_URL env missing');
    process.exit(2);
  }
  const sql = postgres(connectionString, { max: 1, prepare: false });
  try {
    console.log('running select 1');
    const r = await sql`select 1 as ok`;
    console.log('select1:', r);

    console.log('running join test');
    const q = await sql`
      select accounts.user_id, accounts.type, accounts.provider, accounts.provider_account_id
      from accounts
      inner join users on accounts.user_id = users.id
      where accounts.provider = ${'google'} and accounts.provider_account_id = ${'102919841295485379572'}
    `;
    console.log('join result:', q);
  } catch (err) {
    console.error('ERROR_FULL:');
    console.error(err);
    process.exit(1);
  } finally {
    try { await sql.end(); } catch (e) {}
  }
})();
