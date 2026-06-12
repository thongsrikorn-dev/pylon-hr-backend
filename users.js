// src/routes/users.js
const express = require('express');
const bcrypt = require('bcryptjs');
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/users (Admin only)
router.get('/', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id,username,role,name,emp_id,dept,exec_scope,eval_emp_ids,read_only,is_active,created_at FROM users ORDER BY role,username'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users (Admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { username, password, role, name, emp_id, dept, exec_scope, eval_emp_ids } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username,password,role,name,emp_id,dept,exec_scope,eval_emp_ids)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id,username,role,name`,
      [username, hashed, role, name, emp_id||null, dept||null, exec_scope||'*', JSON.stringify(eval_emp_ids||[])]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Username นี้มีอยู่แล้ว' });
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id (Admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { password, role, name, emp_id, dept, exec_scope, eval_emp_ids, is_active } = req.body;
  try {
    let updateFields = ['role=$1','name=$2','emp_id=$3','dept=$4','exec_scope=$5','eval_emp_ids=$6','is_active=$7'];
    let params = [role, name, emp_id||null, dept||null, exec_scope||'*', JSON.stringify(eval_emp_ids||[]), is_active];

    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      updateFields.push(`password=$${params.length+1}`);
      params.push(hashed);
    }
    params.push(req.params.id);

    const { rows } = await pool.query(
      `UPDATE users SET ${updateFields.join(',')} WHERE id=$${params.length} RETURNING id,username,role,name`,
      params
    );
    if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบ User' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
