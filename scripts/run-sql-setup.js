#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const DIRECT_URL = process.argv[2];

if (!DIRECT_URL) {
  console.error('❌ DIRECT_URL required as argument');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DIRECT_URL,
  ssl: { rejectUnauthorized: false }
});

async function executeSQL(filePath, stepName) {
  try {
    console.log(`\n📋 ${stepName}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    const result = await pool.query(sql);
    console.log(`✅ ${stepName} completed successfully`);
    return result;
  } catch (err) {
    console.error(`❌ ${stepName} failed:`, err.message);
    throw err;
  }
}

async function main() {
  try {
    console.log('🚀 Starting Supabase schema setup...\n');

    // Step 1: Recreate ENUMs
    await executeSQL(
      path.join(__dirname, 'supabase-recreate-enums.sql'),
      'Step 1: Recreating ENUMs'
    );

    // Step 2: Create tables
    await executeSQL(
      path.join(__dirname, 'supabase-create-tables-safe.sql'),
      'Step 2: Creating tables'
    );

    // Step 3: Verify schema
    const verifyResult = await executeSQL(
      path.join(__dirname, 'supabase-verify-schema.sql'),
      'Step 3: Verifying schema'
    );

    console.log('\n✅ All steps completed successfully!');
    console.log('\n📊 Verification Results:');
    if (verifyResult && verifyResult.rows) {
      verifyResult.rows.forEach(row => {
        console.log(JSON.stringify(row, null, 2));
      });
    }

    await pool.end();
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    await pool.end();
    process.exit(1);
  }
}

main();
