// Debug script to check student assignment duplicates
import { db } from './server/db.js';
import { storage } from './server/storage.js';
import { groupMixedAssignments, students, users, groups } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function debugStudentAssignments() {
  console.log('🔍 Debugging student assignment duplicates...\n');
  
  try {
    // Check group 28 specifically (from the logs)
    const groupId = 28;
    
    console.log('1️⃣ Raw group assignments from database:');
    const rawAssignments = await db
      .select({
        id: groupMixedAssignments.id,
        groupId: groupMixedAssignments.groupId,
        studentId: groupMixedAssignments.studentId,
        studentType: groupMixedAssignments.studentType,
        assignedBy: groupMixedAssignments.assignedBy,
      })
      .from(groupMixedAssignments)
      .where(eq(groupMixedAssignments.groupId, groupId));
    
    console.log('Raw assignments:', rawAssignments);
    
    // Check if there are duplicates
    const studentIdCounts = {};
    rawAssignments.forEach(assignment => {
      const key = `${assignment.studentId}-${assignment.studentType}`;
      studentIdCounts[key] = (studentIdCounts[key] || 0) + 1;
    });
    
    console.log('Student ID counts:', studentIdCounts);
    const duplicates = Object.entries(studentIdCounts).filter(([key, count]) => count > 1);
    if (duplicates.length > 0) {
      console.log('❌ FOUND DUPLICATES:', duplicates);
    } else {
      console.log('✅ No duplicates in raw assignments');
    }
    
    console.log('\n2️⃣ Testing getGroupAssignments function:');
    const processedAssignments = await storage.getGroupAssignments(groupId, 8); // School ID 8
    console.log('Processed assignments:', processedAssignments.map(a => ({
      id: a.id,
      name: a.name,
      type: a.type
    })));
    
    // Check for duplicates in processed assignments
    const processedIds = {};
    processedAssignments.forEach(assignment => {
      const key = `${assignment.id}-${assignment.type}`;
      processedIds[key] = (processedIds[key] || 0) + 1;
    });
    
    const processedDuplicates = Object.entries(processedIds).filter(([key, count]) => count > 1);
    if (processedDuplicates.length > 0) {
      console.log('❌ FOUND DUPLICATES in processed:', processedDuplicates);
    } else {
      console.log('✅ No duplicates in processed assignments');
    }
    
    console.log('\n3️⃣ Testing getAdminGroups function:');
    const adminGroups = await storage.getAdminGroups(8); // School ID 8
    const targetGroup = adminGroups.find(g => g.id === groupId);
    
    if (targetGroup) {
      console.log(`Group "${targetGroup.name}" has ${targetGroup.studentsAssigned?.length || 0} assigned students:`);
      (targetGroup.studentsAssigned || []).forEach(student => {
        console.log(`   - Student ID: ${student.id}, Name: ${student.name}, Type: ${student.type}`);
      });
      
      // Check for duplicates in studentsAssigned
      const assignedIds = {};
      (targetGroup.studentsAssigned || []).forEach(student => {
        const key = `${student.id}-${student.type}`;
        assignedIds[key] = (assignedIds[key] || 0) + 1;
      });
      
      const assignedDuplicates = Object.entries(assignedIds).filter(([key, count]) => count > 1);
      if (assignedDuplicates.length > 0) {
        console.log('❌ FOUND DUPLICATES in studentsAssigned:', assignedDuplicates);
      } else {
        console.log('✅ No duplicates in studentsAssigned');
      }
    } else {
      console.log('❌ Group not found in admin groups');
    }
    
    console.log('\n4️⃣ Testing available students API:');
    const availableStudents = await storage.getAvailableStudentsByLevelAndSubject('الابتدائي', 1, 8);
    console.log('Available students:', availableStudents.map(s => ({
      id: s.id,
      name: s.name,
      type: s.type
    })));
    
    // Check for duplicates in available students
    const availableIds = {};
    availableStudents.forEach(student => {
      const key = `${student.id}-${student.type}`;
      availableIds[key] = (availableIds[key] || 0) + 1;
    });
    
    const availableDuplicates = Object.entries(availableIds).filter(([key, count]) => count > 1);
    if (availableDuplicates.length > 0) {
      console.log('❌ FOUND DUPLICATES in available students:', availableDuplicates);
    } else {
      console.log('✅ No duplicates in available students');
    }
    
    console.log('\n✅ Debug completed!');
    
  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
  
  process.exit(0);
}

debugStudentAssignments().catch(console.error);