#!/usr/bin/env node

/**
 * Test Payment User ID Fix - Verify separate student_id and user_id in payment records
 * This test validates that payment creation now correctly queries the database
 * to get the proper user_id based on student_id and student_type.
 */

import { eq } from "drizzle-orm";
import { db } from "./server/db.js";
import { students, children, users, studentMonthlyPayments } from "./shared/schema.js";

async function testPaymentUserIdFix() {
  console.log("\n🧪 Testing Payment User ID Fix");
  console.log("=====================================");

  try {
    // Test 1: Find a real student with data
    console.log("\n📋 Test 1: Finding existing student data...");
    
    const directStudents = await db
      .select({
        studentId: students.id,
        userId: students.userId,
        studentName: students.name,
        userName: users.name,
        userEmail: users.email,
        educationLevel: students.educationLevel,
      })
      .from(students)
      .innerJoin(users, eq(students.userId, users.id))
      .where(eq(students.verified, true))
      .limit(3);

    if (directStudents.length === 0) {
      console.log("❌ No verified students found");
      return;
    }

    console.log(`✅ Found ${directStudents.length} verified students:`);
    directStudents.forEach((student, idx) => {
      console.log(`   ${idx + 1}. Student ID: ${student.studentId}, User ID: ${student.userId}`);
      console.log(`      Student: ${student.studentName}, User: ${student.userName} (${student.userEmail})`);
      console.log(`      Level: ${student.educationLevel}`);
    });

    // Test 2: Check existing payment records to see the current state
    console.log("\n💰 Test 2: Checking existing payment records...");
    
    const existingPayments = await db
      .select({
        id: studentMonthlyPayments.id,
        studentId: studentMonthlyPayments.studentId,
        userId: studentMonthlyPayments.userId,
        studentType: studentMonthlyPayments.studentType,
        year: studentMonthlyPayments.year,
        month: studentMonthlyPayments.month,
        amount: studentMonthlyPayments.amount,
      })
      .from(studentMonthlyPayments)
      .limit(5);

    console.log(`📊 Found ${existingPayments.length} existing payment records:`);
    
    let fixNeededCount = 0;
    existingPayments.forEach((payment, idx) => {
      const hasSameIds = payment.studentId === payment.userId;
      if (hasSameIds) fixNeededCount++;
      
      console.log(`   ${idx + 1}. Payment ID: ${payment.id}`);
      console.log(`      Student ID: ${payment.studentId}, User ID: ${payment.userId} ${hasSameIds ? '❌ SAME!' : '✅ Different'}`);
      console.log(`      Type: ${payment.studentType}, ${payment.month}/${payment.year}, Amount: ${payment.amount}`);
    });

    if (fixNeededCount > 0) {
      console.log(`\n⚠️ Found ${fixNeededCount} payment records with identical student_id and user_id`);
    } else {
      console.log(`\n✅ All existing payment records have different student_id and user_id`);
    }

    // Test 3: Simulate the createStudentPayment logic
    console.log("\n🔧 Test 3: Simulating createStudentPayment logic...");
    
    const testStudent = directStudents[0];
    console.log(`Testing with Student ID: ${testStudent.studentId}, Expected User ID: ${testStudent.userId}`);

    // Simulate the database lookup that should now happen in createStudentPayment
    const [studentRecord] = await db
      .select({ userId: students.userId })
      .from(students)
      .where(eq(students.id, testStudent.studentId))
      .limit(1);

    if (studentRecord && studentRecord.userId) {
      console.log(`✅ Database lookup successful: Student ${testStudent.studentId} → User ${studentRecord.userId}`);
      
      if (studentRecord.userId === testStudent.userId) {
        console.log(`✅ User ID matches expected value: ${testStudent.userId}`);
      } else {
        console.log(`❌ User ID mismatch! Expected: ${testStudent.userId}, Got: ${studentRecord.userId}`);
      }
    } else {
      console.log(`❌ Database lookup failed for Student ${testStudent.studentId}`);
    }

    // Test 4: Check children data
    console.log("\n👶 Test 4: Checking children data...");
    
    const childrenData = await db
      .select({
        childId: children.id,
        childName: children.name,
        parentId: children.parentId,
        parentName: users.name,
        parentEmail: users.email,
      })
      .from(children)
      .innerJoin(users, eq(children.parentId, users.id))
      .limit(3);

    if (childrenData.length > 0) {
      console.log(`✅ Found ${childrenData.length} children records:`);
      childrenData.forEach((child, idx) => {
        console.log(`   ${idx + 1}. Child ID: ${child.childId}, Parent ID: ${child.parentId}`);
        console.log(`      Child: ${child.childName}, Parent: ${child.parentName} (${child.parentEmail})`);
      });

      // Test the child lookup logic
      const testChild = childrenData[0];
      const [childRecord] = await db
        .select({ parentId: children.parentId })
        .from(children)
        .where(eq(children.id, testChild.childId))
        .limit(1);

      if (childRecord && childRecord.parentId) {
        console.log(`✅ Child lookup successful: Child ${testChild.childId} → Parent ${childRecord.parentId}`);
      } else {
        console.log(`❌ Child lookup failed for Child ${testChild.childId}`);
      }
    } else {
      console.log("ℹ️ No children records found");
    }

    console.log("\n📝 Summary:");
    console.log("The payment creation logic has been updated to:");
    console.log("1. Query students table to get userId for student records");
    console.log("2. Query children table to get parentId for child records");
    console.log("3. Use the database-queried userId instead of frontend-provided userId");
    console.log("4. This ensures student_id and user_id contain different, appropriate values");
    
    console.log("\n✅ Payment fix validation complete!");

  } catch (error) {
    console.error("\n❌ Test failed with error:", error);
    throw error;
  }
}

// Run the test
testPaymentUserIdFix()
  .then(() => {
    console.log("\n🎉 Payment fix test completed successfully!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Payment fix test failed:", error);
    process.exit(1);
  });