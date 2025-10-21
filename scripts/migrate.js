const { PrismaClient } = require('../app/generated/prisma');

async function migrate() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Starting database migration...');
    
    // Create Folder table
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Folder" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "description" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL
      );
    `;
    
    // Add folderId column to Agent table
    await prisma.$executeRaw`
      ALTER TABLE "Agent" ADD COLUMN IF NOT EXISTS "folderId" TEXT;
    `;
    
    // Add foreign key constraint
    await prisma.$executeRaw`
      ALTER TABLE "Agent" ADD CONSTRAINT IF NOT EXISTS "Agent_folderId_fkey" 
      FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    `;
    
    console.log('Database migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
