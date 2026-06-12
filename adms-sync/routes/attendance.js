const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// --- API ROUTE: Get Attendance ---
router.get('/', requireAuth, async (req, res) => {
  try {
    const { start, end } = req.query;
    let queryText = 'SELECT id, employee_id, date::text as date, clock_in, clock_out, status, is_manual, is_excused, is_deleted, notes FROM attendance_logs WHERE (is_deleted IS NULL OR is_deleted = false)';
    const params = [];
    
    if (start && end) {
      queryText += ' AND date >= $1 AND date <= $2';
      params.push(start, end);
    }
    
    queryText += ' ORDER BY date DESC';
    
    const { rows } = await db.query(queryText, params);
    res.json(rows);
  } catch (err) {
    console.error("Postgres Error (get attendance):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- API ROUTE: Manual Time ---
router.put('/manual-time', requireAuth, async (req, res) => {
  try {
    const { employee_id, date, check_in, check_out } = req.body;
    
    const { rows } = await db.query(
      'SELECT id FROM attendance_logs WHERE employee_id = $1 AND date = $2 LIMIT 1',
      [employee_id, date]
    );

    if (rows.length > 0) {
      await db.query(
        'UPDATE attendance_logs SET clock_in = $1, clock_out = $2, is_manual = true, status = $3, is_deleted = false, deleted_at = null, deleted_by = null WHERE employee_id = $4 AND date = $5',
        [check_in, check_out || null, 'present', employee_id, date]
      );
    } else {
      await db.query(
        'INSERT INTO attendance_logs (employee_id, date, clock_in, clock_out, is_manual, status) VALUES ($1, $2, $3, $4, true, $5)',
        [employee_id, date, check_in, check_out || null, 'present']
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Postgres Error (manual-time):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- API ROUTE: Mark OD ---
router.put('/mark-od', requireAuth, async (req, res) => {
  try {
    const { employee_id, date, od_reason, check_in } = req.body;
    
    const { rows } = await db.query(
      'SELECT id FROM attendance_logs WHERE employee_id = $1 AND date = $2 LIMIT 1',
      [employee_id, date]
    );
    
    if (rows.length > 0) {
      await db.query(
        'UPDATE attendance_logs SET status = $1, is_manual = true, clock_in = $2, notes = $3, is_deleted = false, deleted_at = null, deleted_by = null WHERE employee_id = $4 AND date = $5',
        ['OD', check_in, od_reason || 'Field Trip (OD)', employee_id, date]
      );
    } else {
      await db.query(
        'INSERT INTO attendance_logs (employee_id, date, clock_in, status, is_manual, notes) VALUES ($1, $2, $3, $4, true, $5)',
        [employee_id, date, check_in, 'OD', od_reason || 'Field Trip (OD)']
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Postgres Error (mark-od):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- API ROUTE: Mark Paid Leave ---
router.put('/mark-leave', requireAuth, async (req, res) => {
  try {
    const { employee_id, date } = req.body;
    
    const { rows } = await db.query(
      'SELECT id FROM attendance_logs WHERE employee_id = $1 AND date = $2 LIMIT 1',
      [employee_id, date]
    );

    if (rows.length > 0) {
      await db.query(
        'UPDATE attendance_logs SET status = $1, is_manual = true, is_deleted = false, deleted_at = null, deleted_by = null WHERE employee_id = $2 AND date = $3',
        ['on_leave', employee_id, date]
      );
    } else {
      await db.query(
        'INSERT INTO attendance_logs (employee_id, date, status, is_manual) VALUES ($1, $2, $3, true)',
        [employee_id, date, 'on_leave']
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Postgres Error (mark-leave):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- API ROUTE: Toggle Excused ---
router.put('/toggle-excused', requireAuth, async (req, res) => {
  try {
    const { id, is_excused } = req.body;
    await db.query(
      'UPDATE attendance_logs SET is_excused = $1 WHERE id = $2',
      [is_excused, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Postgres Error (toggle-excused):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- API ROUTE: Delete Log ---
router.put('/delete-log', requireAuth, async (req, res) => {
  try {
    const { id } = req.body;
    const deletedBy = req.user.sub;
    const deletedAt = new Date().toISOString();
    await db.query(
      'UPDATE attendance_logs SET is_deleted = true, deleted_at = $1, deleted_by = $2 WHERE id = $3',
      [deletedAt, deletedBy, id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Postgres Error (delete-log):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- API ROUTE: Punch In/Out ---
router.post('/punch', requireAuth, async (req, res) => {
  try {
    const userId = req.user.sub;
    const todayStr = new Date().toISOString().split('T')[0];
    const nowIso = new Date().toISOString();
    
    const { rows } = await db.query(
      'SELECT * FROM attendance_logs WHERE employee_id = $1 AND date = $2 LIMIT 1',
      [userId, todayStr]
    );
    
    if (rows.length === 0) {
      // Punch In
      await db.query(
        'INSERT INTO attendance_logs (employee_id, date, status, clock_in) VALUES ($1, $2, $3, $4)',
        [userId, todayStr, 'present', nowIso]
      );
      res.json({ success: true, type: 'in' });
    } else {
      const log = rows[0];
      if (!log.clock_out) {
        // Punch Out
        await db.query(
          'UPDATE attendance_logs SET clock_out = $1 WHERE id = $2',
          [nowIso, log.id]
        );
        res.json({ success: true, type: 'out' });
      } else {
        res.status(400).json({ error: "Already punched out for today" });
      }
    }
  } catch (err) {
    console.error("Postgres Error (punch):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
