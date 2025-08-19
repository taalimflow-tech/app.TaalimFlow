// Script to create a new super admin user in the database
import { db } from './server/db.js';
import { users, schools } from './shared/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function createSuperAdmin() {
  console.log('🔧 Creating new super admin user...\n');
  
  try {
    // Super admin details - you can modify these
    const superAdminData = {
      email: 'superadmin@school.dz',
      password: 'SuperAdmin2025!', // Change this to a secure password
      name: 'Super Administrator',
      phone: '+213555000000',
      role: 'super_admin',
      phoneVerified: true,
      emailVerified: true,
      verified: true,
      schoolId: null, // Super admin has no specific school
    };

    console.log('1️⃣ Checking if super admin already exists...');
    const existingSuperAdmin = await db
      .select()
      .from(users)
      .where(eq(users.email, superAdminData.email));
    
    if (existingSuperAdmin.length > 0) {
      console.log('⚠️  Super admin with this email already exists!');
      console.log('   Email:', existingSuperAdmin[0].email);
      console.log('   Name:', existingSuperAdmin[0].name);
      console.log('   Role:', existingSuperAdmin[0].role);
      console.log('   ID:', existingSuperAdmin[0].id);
      
      // Ask if user wants to update the existing super admin
      console.log('\n🔄 Updating existing super admin with new password...');
      const hashedPassword = await bcrypt.hash(superAdminData.password, 10);
      
      await db
        .update(users)
        .set({
          password: hashedPassword,
          name: superAdminData.name,
          phone: superAdminData.phone,
          phoneVerified: true,
          emailVerified: true,
          verified: true,
          role: 'super_admin',
          schoolId: null
        })
        .where(eq(users.id, existingSuperAdmin[0].id));
      
      console.log('✅ Super admin updated successfully!');
      console.log('   ID:', existingSuperAdmin[0].id);
      console.log('   Email:', superAdminData.email);
      console.log('   Password:', superAdminData.password);
      return;
    }

    console.log('2️⃣ Hashing password...');
    const hashedPassword = await bcrypt.hash(superAdminData.password, 10);

    console.log('3️⃣ Creating super admin user...');
    const [newSuperAdmin] = await db
      .insert(users)
      .values({
        ...superAdminData,
        password: hashedPassword,
      })
      .returning();

    console.log('✅ Super admin created successfully!');
    console.log('\n📋 Super Admin Details:');
    console.log('   ID:', newSuperAdmin.id);
    console.log('   Email:', newSuperAdmin.email);
    console.log('   Name:', newSuperAdmin.name);
    console.log('   Phone:', newSuperAdmin.phone);
    console.log('   Role:', newSuperAdmin.role);
    console.log('   Password:', superAdminData.password); // Show original password
    console.log('   School ID:', newSuperAdmin.schoolId || 'None (Super Admin)');
    console.log('   Verified:', newSuperAdmin.verified);

    // Test database connection by listing all schools
    console.log('\n4️⃣ Testing database connection - listing existing schools:');
    const allSchools = await db.select().from(schools);
    console.log(`   Found ${allSchools.length} schools in database:`);
    allSchools.forEach((school, index) => {
      console.log(`   ${index + 1}. ${school.name} (ID: ${school.id}, Code: ${school.code})`);
    });

    console.log('\n✅ Super admin setup completed successfully!');
    console.log('🔑 You can now login with:');
    console.log(`   Email: ${superAdminData.email}`);
    console.log(`   Password: ${superAdminData.password}`);
    
  } catch (error) {
    console.error('❌ Error creating super admin:', error);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
  }
  
  process.exit(0);
}

createSuperAdmin().catch(console.error);