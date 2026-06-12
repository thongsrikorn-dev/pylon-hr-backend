// src/routes/evaluations.js
const express = require('express');
const pool = require('../db/pool');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// GET /api/evaluations - ดึงรายการประเมินตามสิทธิ์
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { effectiveRole, evalEmpIds, execScope, isAdmin, empId } = req.user;
    const { emp_id, eval_type, period } = req.query;

    let query = `
      SELECT e.*, emp.prefix, emp.fname, emp.lname, emp.dept, emp.position, emp.grp,
             u.name as evaluator_name
      FROM evaluations e
      JOIN employees emp ON e.employee_id = emp.id
      LEFT JOIN users u ON e.evaluator_id = u.id
      WHERE 1=1
    `;
    let params = [];
    let idx = 1;

    if (isAdmin || effectiveRole === 'admin') {
      // Admin เห็นทุกอย่าง
    } else if (effectiveRole === 'executive') {
      if (execScope && execScope !== '*') {
        const scope = typeof execScope === 'string' ? JSON.parse(execScope) : execScope;
        if (Array.isArray(scope)) {
          query += ` AND emp.dept = ANY($${idx++})`;
          params.push(scope);
        }
      }
    } else if (effectiveRole === 'evaluator') {
      if (evalEmpIds && evalEmpIds.length > 0) {
        query += ` AND e.employee_id = ANY($${idx++})`;
        params.push(evalEmpIds);
      } else {
        return res.json([]);
      }
    } else if (effectiveRole === 'employee') {
      query += ` AND e.employee_id = $${idx++}`;
      params.push(empId);
    }

    if (emp_id) { query += ` AND e.employee_id = $${idx++}`; params.push(emp_id); }
    if (eval_type) { query += ` AND e.eval_type = $${idx++}`; params.push(eval_type); }
    if (period) { query += ` AND e.period = $${idx++}`; params.push(period); }

    query += ' ORDER BY e.created_at DESC';
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    console.error('Get evaluations error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// GET /api/evaluations/employee/:empId - ประวัติการประเมินของพนักงาน
router.get('/employee/:empId', authMiddleware, async (req, res) => {
  try {
    const { empId: targetEmpId } = req.params;
    const { effectiveRole, evalEmpIds, empId, isAdmin } = req.user;

    // ตรวจสิทธิ์
    if (!isAdmin && effectiveRole !== 'admin' && effectiveRole !== 'executive') {
      if (effectiveRole === 'employee' && empId !== targetEmpId) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์ดูข้อมูลนี้' });
      }
      if (effectiveRole === 'evaluator' && !evalEmpIds.includes(targetEmpId)) {
        return res.status(403).json({ error: 'ไม่มีสิทธิ์ดูข้อมูลนี้' });
      }
    }

    const { rows } = await pool.query(
      `SELECT e.*, u.name as evaluator_name
       FROM evaluations e
       LEFT JOIN users u ON e.evaluator_id = u.id
       WHERE e.employee_id = $1
       ORDER BY e.created_at DESC`,
      [targetEmpId]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'เกิดข้อผิดพลาด' });
  }
});

// POST /api/evaluations - บันทึกผลประเมิน
router.post('/', authMiddleware, async (req, res) => {
  const { employee_id, eval_type, period, scores, total_score, grade, comments } = req.body;
  const { userId, effectiveRole, evalEmpIds, isAdmin } = req.user;

  // ตรวจสิทธิ์
  if (!isAdmin && effectiveRole !== 'admin' && effectiveRole !== 'evaluator') {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์บันทึกการประเมิน' });
  }
  if (effectiveRole === 'evaluator' && !isAdmin && !evalEmpIds.includes(employee_id)) {
    return res.status(403).json({ error: 'ไม่มีสิทธิ์ประเมินพนักงานคนนี้' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO evaluations (employee_id, evaluator_id, eval_type, period, scores, total_score, grade, comments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (employee_id, evaluator_id, eval_type, period)
       DO UPDATE SET scores=$5, total_score=$6, grade=$7, comments=$8, updated_at=NOW()
       RETURNING *`,
      [employee_id, userId, eval_type, period || new Date().getFullYear().toString(),
       JSON.stringify(scores), total_score, grade, comments]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Save evaluation error:', err);
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/evaluations/:id - แก้ไขผลประเมิน
router.put('/:id', authMiddleware, async (req, res) => {
  const { scores, total_score, grade, comments } = req.body;
  const { userId, isAdmin } = req.user;

  try {
    // ตรวจว่าเป็นเจ้าของหรือ admin
    const existing = await pool.query('SELECT * FROM evaluations WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) return res.status(404).json({ error: 'ไม่พบข้อมูล' });
    if (!isAdmin && existing.rows[0].evaluator_id !== userId) {
      return res.status(403).json({ error: 'ไม่มีสิทธิ์แก้ไข' });
    }

    const { rows } = await pool.query(
      `UPDATE evaluations SET scores=$1, total_score=$2, grade=$3, comments=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [JSON.stringify(scores), total_score, grade, comments, req.params.id]
    );
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/evaluations/report/summary - รายงานสรุป (admin/executive)
router.get('/report/summary', authMiddleware, async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT emp.dept, emp.grp,
             COUNT(e.id) as total_evals,
             ROUND(AVG(e.total_score)::numeric, 2) as avg_score,
             COUNT(CASE WHEN e.grade LIKE '%ดีเยี่ยม%' OR e.grade = 'A' THEN 1 END) as grade_a,
             COUNT(CASE WHEN e.grade LIKE '%ดี%' AND e.grade NOT LIKE '%ดีเยี่ยม%' OR e.grade = 'B' THEN 1 END) as grade_b,
             COUNT(CASE WHEN e.grade LIKE '%พอใช้%' OR e.grade = 'C' THEN 1 END) as grade_c
      FROM evaluations e
      JOIN employees emp ON e.employee_id = emp.id
      GROUP BY emp.dept, emp.grp
      ORDER BY emp.grp, emp.dept
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
