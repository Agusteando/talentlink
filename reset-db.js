const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Cleaning database...');
  try {
    // Disable Foreign Key checks to allow dropping tables in any order
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 0;');
    
    // Drop the specific tables causing issues
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS Application;');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS Job;');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS User;');
    await prisma.$executeRawUnsafe('DROP TABLE IF EXISTS _prisma_migrations;');
    
    // Re-enable Foreign Key checks
    await prisma.$executeRawUnsafe('SET FOREIGN_KEY_CHECKS = 1;');
    
    console.log('✅ Database wiped successfully!');
  } catch (error) {
    console.error('❌ Error cleaning database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();