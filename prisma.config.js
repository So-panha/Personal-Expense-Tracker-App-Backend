require('dotenv').config();

// Convert ?schema=<name> → ?options=-c%20search_path=<name>
// ?schema= is Prisma-native and only understood by the native Prisma driver.
// The pg adapter and psql CLI need the standard PostgreSQL options parameter instead.
function convertSchemaParam(rawUrl) {
  if (!rawUrl) return rawUrl;
  try {
    const url = new URL(rawUrl);
    const schema = url.searchParams.get('schema');
    if (schema) {
      url.searchParams.delete('schema');
      url.searchParams.set('options', `-c search_path=${schema}`);
    }
    return url.toString();
  } catch (_) {
    return rawUrl;
  }
}

const dbUrl = convertSchemaParam(process.env.DATABASE_URL);

module.exports = {
  schema: 'prisma/schema.prisma',
  datasource: {
    url: dbUrl,
  },
  migrations: {
    path: 'prisma/migrations',
  },
};
