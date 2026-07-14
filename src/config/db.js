const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');

const isProduction = process.env.NODE_ENV === 'production';

// Strip the non-standard ?schema= parameter from the URL before passing to pg.
// pg (node-postgres) doesn't recognise ?schema= and it causes the connection
// to be terminated unexpectedly. We apply the schema as PostgreSQL search_path
// via the pool 'connect' event instead.
function buildPoolConfig(rawUrl) {
  let connectionString = rawUrl;
  let searchPath = null;

  try {
    const url = new URL(rawUrl);
    searchPath = url.searchParams.get('schema');
    if (searchPath) {
      url.searchParams.delete('schema');
      connectionString = url.toString();
    }
  } catch (_) {
    // rawUrl is not a valid URL — leave as-is
  }

  return { connectionString, searchPath };
}

const { connectionString, searchPath } = buildPoolConfig(process.env.DATABASE_URL || '');

const pool = new Pool({
  connectionString,
  ...(isProduction && {
    ssl: { rejectUnauthorized: false },
  }),
});

// Apply the correct PostgreSQL schema (search_path) on every new connection.
if (searchPath) {
  pool.on('connect', (client) => {
    client.query(`SET search_path TO "${searchPath}"`);
  });
}

const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;

