#!/usr/bin/env node

/**
 * Simple script to check what children exist in the database
 */

import { spawn } from 'child_process';

// Simple database query using psql
const query = `
SELECT 
    c.id,
    c.name,
    c.school_id,
    c.parent_id,
    c.verified,
    c.education_level,
    s.name as school_name
FROM children c
LEFT JOIN schools s ON c.school_id = s.id
ORDER BY c.school_id, c.id
LIMIT 20;
`;

console.log('🔍 Checking children in database...\n');

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    console.log('❌ DATABASE_URL not found in environment');
    process.exit(1);
}

// Run psql command
const psql = spawn('psql', [databaseUrl, '-c', query], {
    stdio: ['inherit', 'pipe', 'pipe']
});

let output = '';
let error = '';

psql.stdout.on('data', (data) => {
    output += data.toString();
});

psql.stderr.on('data', (data) => {
    error += data.toString();
});

psql.on('close', (code) => {
    if (code === 0) {
        console.log('📊 Children in database:');
        console.log(output);
        
        // Also check group assignments for children
        const assignmentQuery = `
SELECT 
    gma.group_id,
    gma.student_id,
    gma.user_id,
    gma.student_type,
    gma.school_id,
    c.name as child_name
FROM group_mixed_assignments gma
LEFT JOIN children c ON gma.student_type = 'child' AND gma.student_id = c.id
WHERE gma.student_type = 'child'
ORDER BY gma.school_id, gma.student_id
LIMIT 10;
        `;
        
        console.log('\n🔍 Checking child group assignments...\n');
        
        const psql2 = spawn('psql', [databaseUrl, '-c', assignmentQuery], {
            stdio: ['inherit', 'pipe', 'pipe']
        });
        
        let output2 = '';
        
        psql2.stdout.on('data', (data) => {
            output2 += data.toString();
        });
        
        psql2.on('close', (code2) => {
            if (code2 === 0) {
                console.log('📊 Child assignments:');
                console.log(output2);
            } else {
                console.log('❌ Failed to check child assignments');
            }
        });
        
    } else {
        console.log('❌ Failed to check database:', error);
    }
});