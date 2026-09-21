import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { getPool, closePool, sql } from './db.js';

dotenv.config();

const username = process.env.SEED_ADMIN_USERNAME;
const plaintextPassword = process.env.SEED_ADMIN_PASSWORD;
const fullName = process.env.SEED_ADMIN_FULLNAME;

if (!username || !plaintextPassword || !fullName) {
  console.error('Error: SEED_ADMIN_USERNAME, SEED_ADMIN_PASSWORD, and SEED_ADMIN_FULLNAME must be set in .env');
  process.exit(1);
}

async function seedUser() {
  console.log('--- Seed Development User ---');

  try {
    const pool = await getPool();

    // 1. Hash password with bcryptjs
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(plaintextPassword, saltRounds);

    console.log(`Hashing password with ${saltRounds} bcrypt salt rounds...`);
    console.log(`Generated Hash: ${hashedPassword.substring(0, 15)}... (length: ${hashedPassword.length})`);

    // 2. Check if user already exists
    const checkResult = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query('SELECT Id FROM Users WHERE Username = @username');

    if (checkResult.recordset.length > 0) {
      console.log(`User '${username}' already exists. Updating password hash and full name...`);
      await pool.request()
        .input('username', sql.NVarChar(50), username)
        .input('password', sql.NVarChar(255), hashedPassword)
        .input('fullName', sql.NVarChar(100), fullName)
        .query(`
          UPDATE Users 
          SET Password = @password, FullName = @fullName 
          WHERE Username = @username
        `);
    } else {
      console.log(`Creating user '${username}'...`);
      await pool.request()
        .input('username', sql.NVarChar(50), username)
        .input('password', sql.NVarChar(255), hashedPassword)
        .input('fullName', sql.NVarChar(100), fullName)
        .query(`
          INSERT INTO Users (Username, Password, FullName)
          VALUES (@username, @password, @fullName)
        `);
    }

    // 3. Query back from database to verify
    const verifyResult = await pool.request()
      .input('username', sql.NVarChar(50), username)
      .query('SELECT Id, Username, Password, FullName, CreatedAt FROM Users WHERE Username = @username');

    const storedUser = verifyResult.recordset[0];

    console.log('\n--- VERIFICATION OF STORED USER ---');
    console.log('User ID:           ', storedUser.Id);
    console.log('Username:          ', storedUser.Username);
    console.log('Full Name:         ', storedUser.FullName);
    console.log('Created At:        ', storedUser.CreatedAt);
    console.log('Stored Password:   ', storedUser.Password);

    // 4. Verify password is valid bcrypt hash
    const bcryptRegex = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;
    const isBcryptFormat = bcryptRegex.test(storedUser.Password);
    const isMatch = await bcrypt.compare(plaintextPassword, storedUser.Password);
    const isPlaintext = storedUser.Password === plaintextPassword;

    console.log('\n--- INTEGRITY CHECKS ---');
    console.log('Plaintext in DB?   ', isPlaintext ? '❌ YES (FAIL)' : '✅ NO');
    console.log('Valid bcrypt format?', isBcryptFormat ? '✅ YES' : '❌ NO');
    console.log('bcrypt.compare()?  ', isMatch ? '✅ MATCHES' : '❌ DOES NOT MATCH');

    if (!isPlaintext && isBcryptFormat && isMatch) {
      console.log('\nSeed user ok na sa database!');
    } else {
      console.error('\n❌ Verification failed.');
      process.exitCode = 1;
    }

    await closePool();
  } catch (err) {
    console.error('Error seeding user:', err);
    process.exitCode = 1;
  }
}

seedUser();
