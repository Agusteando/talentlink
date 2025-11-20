const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Cleaning database...');
  try {
    // 1. Disable Foreign Key checks (Allows dropping tables in any order)
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
    
    // 2. Drop ALL tables (Added Comment and Plantel)
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS Comment;');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS Application;');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS Job;');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS User;');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS Plantel;');
    
    // 3. Drop Prisma migration tracking table
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS _prisma_migrations;');
    
    // 4. Re-enable Foreign Key checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log('✅ Database wiped successfully!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();