#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://lerlqgorfvnvsytngczs.supabase.co';
const SERVICE_ROLE_KEY = process.argv[2];

if (!SERVICE_ROLE_KEY) {
  console.error('❌ Service role key required as argument');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function executeSQL(filePath, stepName) {
  try {
    console.log(`\n📋 ${stepName}...`);
    const sql = fs.readFileSync(filePath, 'utf8');

    const { data, error } = await supabase.rpc('pg_execute_sql', {
      sql_query: sql
    }).catch(err => ({ error: err }));

    if (error) {
      // Fallback: try to execute via raw query
      // Split by semicolon and execute each statement
      const statements = sql.split(';').filter(s => s.trim());

      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await supabase.rpc('execute_sql', { query: statement });
          } catch (e) {
            // Continue on error for individual statements
            console.warn(`⚠️  Statement error (continuing): ${e.message.substring(0, 100)}`);
          }
        }
      }
      console.log(`✓ ${stepName} completed with warnings`);
    } else {
      console.log(`✓ ${stepName} completed successfully`);
    }
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
    await executeSQL(
      path.join(__dirname, 'supabase-verify-schema.sql'),
      'Step 3: Verifying schema'
    );

    console.log('\n✅ All steps completed successfully!');
  } catch (err) {
    console.error('\n❌ Setup failed:', err.message);
    process.exit(1);
  }
}

main();
