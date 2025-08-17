// Simple script to create a test school
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import { schools } from './shared/schema.js';
import ws from "ws";

neonConfig.webSocketConstructor = ws;

async function createTestSchool() {
  try {
    console.log('Creating test school...');
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL not found');
    }
    
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    const db = drizzle({ client: pool, schema: { schools } });
    
    const testSchool = {
      name: "مدرسة تجريبية",
      code: "TST1",
      location: "الجزائر",
      adminKey: "admin123",
      teacherKey: "teacher123",
      active: true
    };
    
    const [newSchool] = await db.insert(schools).values(testSchool).returning();
    console.log('Test school created:', newSchool);
    
    // Also create a school with code "da" as mentioned in the user guide
    const testSchool2 = {
      name: "مدرسة المجتهد",
      code: "da",
      location: "الجزائر",
      adminKey: "admin456",
      teacherKey: "teacher456", 
      active: true
    };
    
    const [newSchool2] = await db.insert(schools).values(testSchool2).returning();
    console.log('Second test school created:', newSchool2);
    
    await pool.end();
  } catch (error) {
    console.error('Error creating test school:', error);
  }
}

createTestSchool();