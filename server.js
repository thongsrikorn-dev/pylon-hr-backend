// PYLON HR Backend - Standalone Version (all-in-one file)
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3000;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '10mb' }));

// Auth middleware
function auth(req, res, next) {
  const h = req.headers.authorization;
  if (!h || !h.startsWith('Bearer ')) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
  try { req.user = jwt.verify(h.split(' ')[1], process.env.JWT_SECRET || 'pylon_secret'); next(); }
  catch { res.status(401).json({ error: 'Token ไม่ถูกต้อง' }); }
}

// Health check
app.get('/health', async (req, res) => {
  try { await pool.query('SELECT 1'); res.json({ status: 'OK', database: 'connected' }); }
  catch { res.status(500).json({ status: 'ERROR', database: 'disconnected' }); }
});

// Auto migrate
async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS employees (
      id VARCHAR(20) PRIMARY KEY, prefix VARCHAR(50), fname VARCHAR(100),
      lname VARCHAR(100), dept VARCHAR(100), position VARCHAR(150),
      start_date INTEGER, grp VARCHAR(20), bday VARCHAR(8), is_active BOOLEAN DEFAULT true
    );
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY, username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(200) NOT NULL, role VARCHAR(30), name VARCHAR(150),
      emp_id VARCHAR(20), dept VARCHAR(100), exec_scope TEXT DEFAULT '*',
      eval_emp_ids TEXT DEFAULT '[]', read_only BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true
    );
    CREATE TABLE IF NOT EXISTS evaluations (
      id SERIAL PRIMARY KEY, employee_id VARCHAR(20), evaluator_id INTEGER,
      eval_type VARCHAR(20), period VARCHAR(20), scores JSONB DEFAULT '{}',
      total_score NUMERIC(5,2), grade VARCHAR(20), comments TEXT,
      status VARCHAR(20) DEFAULT 'submitted',
      created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW()
    );
  `);
  console.log('✅ Tables ready');
}

// LOGIN
app.post('/api/auth/login', async (req, res) => {
  const { username, password, role: reqRole } = req.body;
  try {
    const { rows } = await pool.query('SELECT * FROM users WHERE username=$1 AND is_active=true', [username]);
    if (!rows.length) {
      // Try employee login
      const emp = await pool.query('SELECT * FROM employees WHERE id=$1', [username]);
      if (!emp.rows.length || emp.rows[0].bday !== password)
        return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      const e = emp.rows[0];
      const token = jwt.sign({ userId: e.id, username: e.id, role: 'employee', empId: e.id,
        name: `${e.prefix}${e.fname} ${e.lname}`, isAdmin: false, effectiveRole: 'employee',
        evalEmpIds: [], execScope: null }, process.env.JWT_SECRET || 'pylon_secret', { expiresIn: '8h' });
      return res.json({ token, user: { username: e.id, role: 'employee', effectiveRole: 'employee',
        name: `${e.prefix}${e.fname} ${e.lname}`, empId: e.id } });
    }
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    const isAdmin = user.role === 'admin';
    const isDualExec = user.role === 'dual_exec';
    let effectiveRole = reqRole || user.role;
    if (!isAdmin && !isDualExec && user.role !== effectiveRole)
      return res.status(403).json({ error: `บัญชีนี้เป็น Role "${user.role}"` });
    const evalEmpIds = JSON.parse(user.eval_emp_ids || '[]');
    const token = jwt.sign({ userId: user.id, username: user.username, role: user.role,
      empId: user.emp_id, name: user.name, isAdmin, isDualExec, effectiveRole,
      evalEmpIds, execScope: user.exec_scope, dept: user.dept },
      process.env.JWT_SECRET || 'pylon_secret', { expiresIn: '8h' });
    res.json({ token, user: { username: user.username, role: user.role, name: user.name,
      empId: user.emp_id, isAdmin, isDualExec, effectiveRole, evalEmpIds, execScope: user.exec_scope } });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

app.get('/api/auth/me', auth, (req, res) => res.json({ user: req.user }));

// EMPLOYEES
app.get('/api/employees', auth, async (req, res) => {
  try {
    const { effectiveRole, evalEmpIds, isAdmin, empId } = req.user;
    let q = 'SELECT * FROM employees WHERE is_active=true', p = [];
    if (!isAdmin && effectiveRole !== 'admin') {
      if (effectiveRole === 'evaluator' && evalEmpIds?.length) { q += ' AND id=ANY($1)'; p.push(evalEmpIds); }
      else if (effectiveRole === 'employee') { q += ' AND id=$1'; p.push(empId); }
    }
    const { rows } = await pool.query(q + ' ORDER BY grp,dept,fname', p);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// EVALUATIONS
app.get('/api/evaluations', auth, async (req, res) => {
  try {
    const { effectiveRole, evalEmpIds, isAdmin, empId } = req.user;
    let q = `SELECT e.*, emp.fname, emp.lname, emp.dept, emp.grp, u.name as evaluator_name
             FROM evaluations e JOIN employees emp ON e.employee_id=emp.id
             LEFT JOIN users u ON e.evaluator_id=u.id WHERE 1=1`, p = [], i = 1;
    if (!isAdmin && effectiveRole !== 'admin') {
      if (effectiveRole === 'evaluator' && evalEmpIds?.length) { q += ` AND e.employee_id=ANY($${i++})`; p.push(evalEmpIds); }
      else if (effectiveRole === 'employee') { q += ` AND e.employee_id=$${i++}`; p.push(empId); }
    }
    const { rows } = await pool.query(q + ' ORDER BY e.created_at DESC', p);
    res.json(rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/evaluations', auth, async (req, res) => {
  const { employee_id, eval_type, period, scores, total_score, grade, comments } = req.body;
  const { userId, isAdmin, effectiveRole, evalEmpIds } = req.user;
  if (!isAdmin && effectiveRole === 'evaluator' && !evalEmpIds?.includes(employee_id))
    return res.status(403).json({ error: 'ไม่มีสิทธิ์ประเมินพนักงานคนนี้' });
  try {
    const { rows } = await pool.query(
      `INSERT INTO evaluations (employee_id,evaluator_id,eval_type,period,scores,total_score,grade,comments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT DO NOTHING RETURNING *`,
      [employee_id, userId, eval_type, period || new Date().getFullYear().toString(),
       JSON.stringify(scores), total_score, grade?.g || grade, comments]);
    res.status(201).json(rows[0] || { message: 'saved' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// USERS (admin only)
app.get('/api/users', auth, async (req, res) => {
  if (!req.user.isAdmin) return res.status(403).json({ error: 'Admin only' });
  const { rows } = await pool.query('SELECT id,username,role,name,emp_id,dept FROM users ORDER BY role,username');
  res.json(rows);
});

app.listen(PORT, async () => {
  console.log(`🚀 Pylon HR API on port ${PORT}`);
  try { await migrate(); } catch(e) { console.error('Migration error:', e.message); }
});
