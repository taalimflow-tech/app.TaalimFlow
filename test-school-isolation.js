// Test script to verify school data isolation in attendance tables
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupMixedAssignments, students, users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function testSchoolIsolation() {
  console.log('🔒 Testing school data isolation for attendance tables...\n');
  
  try {
    // First, check what students exist in different schools
    console.log('1️⃣ Current students across all schools:');
    const allStudents = await db
      .select({
        studentId: students.id,
        userId: students.userId,
        name: students.name,
        schoolId: students.schoolId,
        userName: users.name
      })
      .from(students)
      .leftJoin(users, eq(students.userId, users.id))
      .orderBy(students.schoolId, students.id);
    
    const schoolGroups = {};
    allStudents.forEach(student => {
      if (!schoolGroups[student.schoolId]) {
        schoolGroups[student.schoolId] = [];
      }
      schoolGroups[student.schoolId].push(student);
    });
    
    Object.entries(schoolGroups).forEach(([schoolId, students]) => {
      console.log(`School ${schoolId}:`);
      students.forEach(s => {
        console.log(`   Student ID: ${s.studentId}, Name: ${s.name || s.userName}, User ID: ${s.userId}`);
      });
    });

    // Test with School 8 (should only show School 8 students)
    console.log('\n2️⃣ Testing getAdminGroups for School 8:');
    const adminGroups = await storage.getAdminGroups(8);
    
    // Find a group with students assigned
    const groupWithStudents = adminGroups.find(g => g.studentsAssigned && g.studentsAssigned.length > 0);
    
    if (groupWithStudents) {
      console.log(`Group "${groupWithStudents.name}" (ID: ${groupWithStudents.id}) has ${groupWithStudents.studentsAssigned.length} assigned students:`);
      
      groupWithStudents.studentsAssigned.forEach(student => {
        console.log(`   - Display ID: ${student.id}, Student ID: ${student.studentId}, Name: ${student.name}`);
        
        // Check if the user belongs to School 8 (for attendance display)
        const userBelongsToSchool8 = allStudents.find(s => 
          s.userId === student.id && s.schoolId === 8
        );
        
        if (userBelongsToSchool8) {
          console.log(`     ✅ CORRECT: User belongs to School 8 (display uses user.id = ${student.id})`);
        } else {
          const userActualSchool = allStudents.find(s => s.userId === student.id);
          if (userActualSchool) {
            console.log(`     ❌ WRONG: User belongs to School ${userActualSchool.schoolId}, not School 8!`);
          } else {
            console.log(`     ❓ UNKNOWN: User not found in any school`);
          }
        }
      });
    } else {
      console.log('No groups with assigned students found in School 8');
    }

    // Test with a different school if available
    const otherSchoolIds = [...new Set(allStudents.map(s => s.schoolId).filter(id => id !== 8))];
    
    if (otherSchoolIds.length > 0) {
      const otherSchoolId = otherSchoolIds[0];
      console.log(`\n3️⃣ Testing getAdminGroups for School ${otherSchoolId}:`);
      
      const otherSchoolGroups = await storage.getAdminGroups(otherSchoolId);
      const otherGroupWithStudents = otherSchoolGroups.find(g => g.studentsAssigned && g.studentsAssigned.length > 0);
      
      if (otherGroupWithStudents) {
        console.log(`Group "${otherGroupWithStudents.name}" (ID: ${otherGroupWithStudents.id}) has ${otherGroupWithStudents.studentsAssigned.length} assigned students:`);
        
        otherGroupWithStudents.studentsAssigned.forEach(student => {
          console.log(`   - Display ID: ${student.id}, Student ID: ${student.studentId}, Name: ${student.name}`);
          
          // Check if the user belongs to the correct school (for attendance display)
          const userBelongsToCorrectSchool = allStudents.find(s => 
            s.userId === student.id && s.schoolId === otherSchoolId
          );
          
          if (userBelongsToCorrectSchool) {
            console.log(`     ✅ CORRECT: User belongs to School ${otherSchoolId}`);
          } else {
            const userActualSchool = allStudents.find(s => s.userId === student.id);
            if (userActualSchool) {
              console.log(`     ❌ WRONG: User belongs to School ${userActualSchool.schoolId}, not School ${otherSchoolId}!`);
            } else {
              console.log(`     ❓ UNKNOWN: User not found in any school`);
            }
          }
        });
      } else {
        console.log(`No groups with assigned students found in School ${otherSchoolId}`);
      }
      
      // Cross-school contamination test
      console.log(`\n4️⃣ Cross-school contamination test:`);
      console.log(`School 8 students in School ${otherSchoolId} groups: Should be 0`);
      let contaminationCount = 0;
      
      otherSchoolGroups.forEach(group => {
        if (group.studentsAssigned) {
          group.studentsAssigned.forEach(student => {
            const studentBelongsToSchool8 = allStudents.find(s => 
              s.studentId === student.id && s.schoolId === 8
            );
            if (studentBelongsToSchool8) {
              console.log(`     ❌ CONTAMINATION: Student ${student.name} (ID: ${student.id}) from School 8 appears in School ${otherSchoolId} group!`);
              contaminationCount++;
            }
          });
        }
      });
      
      if (contaminationCount === 0) {
        console.log(`     ✅ NO CONTAMINATION: All students belong to correct school`);
      } else {
        console.log(`     ❌ CONTAMINATION DETECTED: ${contaminationCount} students from other schools found`);
      }
    }

    console.log('\n✅ School isolation test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
  
  process.exit(0);
}

testSchoolIsolation().catch(console.error);