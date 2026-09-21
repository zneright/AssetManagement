import sql from 'mssql';
import { getPool, closePool, dbConfig } from './db.js';

console.log('========================================');
console.log('PHASE 6: MSSQL CONNECTION TEST SUITE');
console.log('========================================\n');

// ----------------------------------------------------
// TEST 1: Correct Credentials
// ----------------------------------------------------
console.log('--- TEST 1: Testing with CORRECT credentials ---');
try {
  const pool = await getPool();
  const result = await pool.request().query('SELECT DB_NAME() AS currentDb, SUSER_SNAME() AS currentUser');
  console.log('✅ TEST 1 PASSED: Connected successfully!');
  console.log('   Database:', result.recordset[0].currentDb);
  console.log('   User:', result.recordset[0].currentUser);
  await closePool();
} catch (err) {
  console.error('❌ TEST 1 FAILED:', err.message);
}

// ----------------------------------------------------
// TEST 2: Incorrect Credentials
// ----------------------------------------------------
console.log('\n--- TEST 2: Testing with INCORRECT credentials ---');
const badCredsConfig = {
  ...dbConfig,
  password: 'WrongPassword999!',
};
try {
  const badPool = await sql.connect(badCredsConfig);
  console.error('❌ TEST 2 FAILED: Connection should not have succeeded!');
  await badPool.close();
} catch (err) {
  console.log('✅ TEST 2 PASSED: Connection rejected as expected!');
  console.log('   Error Code:', err.code);
  console.log('   Error Message:', err.message);
}

// ----------------------------------------------------
// TEST 3: Database Unavailable (invalid port/host)
// ----------------------------------------------------
console.log('\n--- TEST 3: Testing with UNAVAILABLE database (invalid port) ---');
const unavailableConfig = {
  ...dbConfig,
  port: 19999, // Nothing listening on this port
  connectionTimeout: 3000,
};
try {
  const unavailablePool = await sql.connect(unavailableConfig);
  console.error('❌ TEST 3 FAILED: Connection should have failed!');
  await unavailablePool.close();
} catch (err) {
  console.log('✅ TEST 3 PASSED: Connection failure handled as expected!');
  console.log('   Error Code:', err.code);
  console.log('   Error Message:', err.message);
}

console.log('\n========================================');
console.log('All connection tests completed.');
console.log('========================================');
process.exit(0);
