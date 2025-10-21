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
    
    // Check if folderId column exists, if not add it
    const columnExists = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'Agent' AND column_name = 'folderId';
    `;
    
    if (columnExists.length === 0) {
      await prisma.$executeRaw`
        ALTER TABLE "Agent" ADD COLUMN "folderId" TEXT;
      `;
      console.log('Added folderId column to Agent table');
    } else {
      console.log('folderId column already exists');
    }
    
    // Check if foreign key constraint exists, if not add it
    const constraintExists = await prisma.$queryRaw`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'Agent' AND constraint_name = 'Agent_folderId_fkey';
    `;
    
    if (constraintExists.length === 0) {
      await prisma.$executeRaw`
        ALTER TABLE "Agent" ADD CONSTRAINT "Agent_folderId_fkey" 
        FOREIGN KEY ("folderId") REFERENCES "Folder"("id") ON DELETE SET NULL ON UPDATE CASCADE;
      `;
      console.log('Added foreign key constraint');
    } else {
      console.log('Foreign key constraint already exists');
    }
    
    console.log('Database migration completed successfully!');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

migrate();
