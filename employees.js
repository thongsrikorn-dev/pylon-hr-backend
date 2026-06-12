// src/routes/employees.js
const express = require('express');
const pool = require('../db/pool');
const { authMiddleware, adminOnly } = require('../middleware/auth');

const router = express.Router();

// GET /api/employees - ดึงรายชื่อตามสิทธิ์
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { effectiveRole, evalEmpIds, execScope, isAdmin } = req.user;

    let query = 'SELECT * FROM employees WHERE is_active = true';
    let params = [];

    if (isAdmin || effectiveRole === 'admin') {
      // Admin เห็นทุกคน
    } else if (effectiveRole === 'executive') {
      // Executive กรองตาม scope
      if (execScope && execScope !== '*') {
        const scope = typeof execScope === 'string' ? JSON.parse(execScope) : execScope;
        if (Array.isArray(scope)) {
          query += ` AND dept = ANY($1)`;
          params.push(scope);
        }
      }
    } else if (effectiveRole === 'evaluator') {
      // Evaluator เห็นเฉพาะพนักงานในสังกัด
      if (evalEmpIds && evalEmpIds.length > 0) {
        query += ` AND id = ANY($1)`;
        params.push(evalEmpIds);
      } else {
        return res.json([]);
      }
    } else if (effectiveRole === 'employee') {
      // Employee เห็นแค่ตัวเอง
      query += ` AND id = $1`;
      params.push(req.user.empId);
    }

    query += ' ORDER BY grp, dept, fname';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get employees error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/employees/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM employees WHERE id = $1', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูลพนักงาน' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/employees (Admin only)
router.post('/', authMiddleware, adminOnly, async (req, res) => {
  const { id, prefix, fname, lname, dept, position, start_date, grp, bday } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO employees (id,prefix,fname,lname,dept,position,start_date,grp,bday)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [id, prefix, fname, lname, dept, position, start_date, grp, bday]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/employees/:id (Admin only)
router.put('/:id', authMiddleware, adminOnly, async (req, res) => {
  const { prefix, fname, lname, dept, position, start_date, grp, bday, is_active } = req.body;
  try {
    const { rows } = await pool.query(
      `UPDATE employees SET prefix=$1,fname=$2,lname=$3,dept=$4,position=$5,
       start_date=$6,grp=$7,bday=$8,is_active=$9 WHERE id=$10 RETURNING *`,
      [prefix, fname, lname, dept, position, start_date, grp, bday, is_active, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'ไม่พบพนักงาน' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
