const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase Client
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// GET /api/emails/accounts - Fetch zoho accounts
router.get('/accounts', requireAuth, async (req, res) => {
  try {
    const { data: rows, error } = await supabase.from('zoho_accounts').select('*').eq('is_deleted', false);
    if (error) throw error;
    res.json(rows || []);
  } catch (err) {
    console.error("DB Error (get zoho accounts):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/emails - Fetch emails (with optional account_id filter)
router.get('/', requireAuth, async (req, res) => {
  try {
    const { account_id } = req.query;
    let query = supabase.from('emails').select('*').eq('is_deleted', false);
    if (account_id) {
      query = query.eq('account_id', account_id);
    }
    const { data: rows, error } = await query.order('received_at', { ascending: false }).limit(500);
    if (error) throw error;
    res.json(rows || []);
  } catch (err) {
    console.error("DB Error (get emails):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/emails/:id - Fetch single email
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { data: rows, error } = await supabase.from('emails').select('*').eq('id', id).eq('is_deleted', false);
    if (error) throw error;
    if (!rows || rows.length === 0) return res.status(404).json({ error: "Email not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("DB Error (get single email):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/emails/:id - Update email (e.g. status, is_read)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    if (Object.keys(updates).length === 0) return res.json({ success: true });
    
    const { error } = await supabase.from('emails').update(updates).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (update email):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/emails - Save sent email log
router.post('/', requireAuth, async (req, res) => {
  try {
    const data = req.body;
    
    const { data: rows, error } = await supabase.from('emails').insert([data]).select();
    if (error) throw error;
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("DB Error (create email log):", err);
    res.status(500).json({ error: err.message || JSON.stringify(err) || "Unknown Error" });
  }
});

// DELETE /api/emails/:id - Delete email log
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('emails').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (delete email):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/emails/accounts/:id - Soft delete account
router.delete('/accounts/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('zoho_accounts').update({ is_deleted: true, deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("DB Error (delete zoho account):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
