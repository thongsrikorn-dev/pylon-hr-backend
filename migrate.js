// src/db/migrate.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 เริ่ม Migration...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(20) PRIMARY KEY,
        prefix VARCHAR(50),
        fname VARCHAR(100) NOT NULL,
        lname VARCHAR(100) NOT NULL,
        dept VARCHAR(100),
        position VARCHAR(150),
        start_date INTEGER,
        grp VARCHAR(20),
        bday VARCHAR(8),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ ตาราง employees');

    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(200) NOT NULL,
        role VARCHAR(30) NOT NULL,
        name VARCHAR(150),
        emp_id VARCHAR(20),
        dept VARCHAR(100),
        exec_scope TEXT DEFAULT '*',
        eval_emp_ids TEXT DEFAULT '[]',
        read_only BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ ตาราง users');

    await client.query(`
      CREATE TABLE IF NOT EXISTS evaluations (
        id SERIAL PRIMARY KEY,
        employee_id VARCHAR(20) REFERENCES employees(id),
        evaluator_id INTEGER REFERENCES users(id),
        eval_type VARCHAR(20) NOT NULL,
        period VARCHAR(20),
        scores JSONB DEFAULT '{}',
        total_score NUMERIC(5,2),
        grade VARCHAR(20),
        comments TEXT,
        status VARCHAR(20) DEFAULT 'submitted',
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(employee_id, evaluator_id, eval_type, period)
      );
    `);
    console.log('✅ ตาราง evaluations');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_eval_employee ON evaluations(employee_id);
      CREATE INDEX IF NOT EXISTS idx_eval_type ON evaluations(eval_type);
      CREATE INDEX IF NOT EXISTS idx_eval_evaluator ON evaluations(evaluator_id);
    `);
    console.log('✅ Indexes');

    console.log('\n🎉 Migration เสร็จสมบูรณ์!');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate().catch(console.error);
