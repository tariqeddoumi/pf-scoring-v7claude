const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Test User table
    console.log('=== Testing User Table ===');
    const userCount = await prisma.user.count();
    console.log(`Total users: ${userCount}`);
    
    if (userCount > 0) {
      const firstUser = await prisma.user.findFirst({
        select: { id: true, email: true, nom: true, prenom: true, role: true, password: true }
      });
      console.log('First user:', JSON.stringify(firstUser, null, 2));
    }
    
    // Test V8 tables
    console.log('\n=== Testing V8 Tables ===');
    try {
      const v8SectorCount = await prisma.v8Sector.count();
      console.log(`V8 Sectors found: ${v8SectorCount}`);
    } catch (e) {
      console.log('V8Sector table error:', e.message);
    }
    
    // Test ProjectCount
    console.log('\n=== Testing Project Table ===');
    const projectCount = await prisma.project.count();
    console.log(`Total projects: ${projectCount}`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
