const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ...(isProduction && {
    ssl: { rejectUnauthorized: false },
  }),
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding database...');

  // 1. Create a test user
  const email = 'test@test.com';
  const hashedPassword = await bcrypt.hash('Pass123!', 12);

  let user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName: 'Test User',
        role: 'USER',
        emailVerified: true,
      },
    });
    console.log(`👤 Created test user: ${email} (Password: Pass123!)`);
  } else {
    console.log(`👤 Test user already exists: ${email}`);
  }

  // 2. Create some default categories for this user
  const defaultCategories = [
    { name: 'Salary', type: 'INCOME', isSystem: true },
    { name: 'Business', type: 'INCOME', isSystem: true },
    { name: 'Rent', type: 'EXPENSE', isSystem: true },
    { name: 'Food & Drinks', type: 'EXPENSE', isSystem: true },
    { name: 'Shopping', type: 'EXPENSE', isSystem: true },
    { name: 'Transportation', type: 'EXPENSE', isSystem: true },
    { name: 'Entertainment', type: 'EXPENSE', isSystem: true },
  ];

  for (const cat of defaultCategories) {
    const existing = await prisma.category.findFirst({
      where: {
        name: cat.name,
        userId: user.id,
      },
    });

    if (!existing) {
      await prisma.category.create({
        data: {
          name: cat.name,
          type: cat.type,
          isSystem: cat.isSystem,
          userId: user.id,
        },
      });
      console.log(`🏷️  Created category: ${cat.name} (${cat.type})`);
    }
  }

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    pool.end();
  });
