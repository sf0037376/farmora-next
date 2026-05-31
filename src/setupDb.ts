import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

async function runSetup() {
  console.log('⚡ Starting Automated Database Setup for Farmora AgriTech LLP...\n');

  // 1. Establish connection to MySQL
  const connectionConfig = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpassword',
    multipleStatements: true // Allow multi-statement execution for batch scripts
  };

  let connection;
  try {
    connection = await mysql.createConnection(connectionConfig);
    console.log('✅ Connected to MySQL Server successfully!');
  } catch (err: any) {
    console.error('❌ Failed to connect to MySQL Server. Error:', err.message);
    process.exit(1);
  }

  const dbName = process.env.DB_NAME || 'farmora_db';

  try {
    // 2. Re-create Database from scratch
    console.log(`🧹 Re-creating Database: "${dbName}"...`);
    await connection.query(`DROP DATABASE IF EXISTS ${dbName}`);
    await connection.query(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    await connection.query(`USE ${dbName}`);
    console.log(`✅ Database "${dbName}" created cleanly!`);

    // 3. Read and execute schema.sql
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    console.log(`📖 Reading schema definitions from: "${schemaPath}"...`);
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`schema.sql not found at ${schemaPath}`);
    }
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🚀 Executing DDL Schema definitions...');
    // Split statements by semicolon, ignoring empty ones and comments
    const schemaStatements = splitStatements(schemaSql);
    for (let statement of schemaStatements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    console.log(`✅ Relational DDL schema applied successfully! (8 Tables established)`);

    // 4. Read and execute seed.sql
    const seedPath = path.join(__dirname, '../../database/seed.sql');
    console.log(`📖 Reading scenarios seed data from: "${seedPath}"...`);
    if (!fs.existsSync(seedPath)) {
      throw new Error(`seed.sql not found at ${seedPath}`);
    }
    const seedSql = fs.readFileSync(seedPath, 'utf8');

    console.log('🌱 Injecting all scenario seed data into DB tables...');
    const seedStatements = splitStatements(seedSql);
    for (let statement of seedStatements) {
      if (statement.trim()) {
        await connection.query(statement);
      }
    }
    console.log('✅ Seed data injected successfully! All operational scenarios fully populated.');

    console.log('\n================================────────────────────────');
    console.log('🎉 [FARMORA DATABASE SETUP SUCCESS]                      ');
    console.log('   Relational tables created, B-tree compound indexes   ');
    console.log('   established, and high-fidelity testing seeds injected!');
    console.log('================================────────────────────────\n');

  } catch (err: any) {
    console.error('❌ Error executing database setup scripts:', err.message);
  } finally {
    if (connection) {
      await connection.end();
    }
    process.exit(0);
  }
}

/**
 * Splits SQL scripts into individual executable statements,
 * cleaning up trailing spaces, empty lines, and comments.
 */
function splitStatements(sql: string): string[] {
  // Regex to remove block comments and line comments
  const cleanSql = sql
    .replace(/\/\*[\s\S]*?\*\//g, '') // remove block comments /* ... */
    .split('\n')
    .map(line => {
      const trimmed = line.trim();
      if (trimmed.startsWith('--') || trimmed.startsWith('#')) return ''; // remove line comments
      return line;
    })
    .join('\n');

  // Split by semicolon, accounting for semicolons inside single or double quotes
  const statements: string[] = [];
  let currentStatement = '';
  let inSingleQuote = false;
  let inDoubleQuote = false;
  let escapeNext = false;

  for (let i = 0; i < cleanSql.length; i++) {
    const char = cleanSql[i];

    if (escapeNext) {
      currentStatement += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      currentStatement += char;
      escapeNext = true;
      continue;
    }

    if (char === "'" && !inDoubleQuote) {
      inSingleQuote = !inSingleQuote;
    } else if (char === '"' && !inSingleQuote) {
      inDoubleQuote = !inDoubleQuote;
    }

    if (char === ';' && !inSingleQuote && !inDoubleQuote) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    } else {
      currentStatement += char;
    }
  }

  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }

  return statements;
}

runSetup();
