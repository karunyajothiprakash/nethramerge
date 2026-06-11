const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// GET /api/employees - Fetch all approved employees
router.get('/', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, requested_role, status, is_active, avatar_url, biometric_id, dob, joining_date, system_mode, city')
      .eq('status', 'approved')
      .neq('is_deleted', true)
      .order('full_name', { ascending: true });
      
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Supabase Error (get employees):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/employees/:id - Fetch single employee
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: "Not found" });
    res.json(data);
  } catch (err) {
    console.error("Supabase Error (get employee):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/employees - Add new employee
router.post('/', requireAuth, async (req, res) => {
  try {
    const { id, full_name, email, requested_role } = req.body;
    const { error } = await supabase.from('profiles').insert([{
      id, full_name, email, requested_role, status: 'approved'
    }]);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (post employee):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/employees/:id - Update employee
router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) return res.json({ success: true });
    const { error } = await supabase.from('profiles').update(req.body).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (update employee):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// DELETE /api/employees/:id - Soft delete employee
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const deleted_by = req.user.sub;
    const deleted_at = new Date().toISOString();
    const { error } = await supabase.from('profiles').update({
      is_active: false, is_deleted: true, deleted_at, deleted_by
    }).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (delete employee):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// GET /api/profiles - Fetch all profiles (including pending)
router.get('/all/profiles', requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    console.error("Supabase Error (get profiles):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// PUT /api/profiles/:id - Update profile
router.put('/all/profiles/:id', requireAuth, async (req, res) => {
  try {
    if (Object.keys(req.body).length === 0) return res.json({ success: true });
    const { error } = await supabase.from('profiles').update(req.body).eq('id', req.params.id);
    if (error) throw error;
    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (update profile):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
