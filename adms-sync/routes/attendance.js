const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const { requireAuth } = require('../middleware/auth');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// --- API ROUTE: Get Attendance ---
router.get('/', requireAuth, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    let query = supabase
      .from('attendance_logs')
      .select('*')
      .order('date', { ascending: false });

    if (start && end) {
      query = query.gte('date', start).lte('date', end);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    
    res.json(data || []);
  } catch (err) {
    console.error("Supabase Error (get attendance):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- API ROUTE: Manual Time ---
router.put('/manual-time', requireAuth, async (req, res) => {
  try {
    const { employee_id, date, check_in, check_out } = req.body;
    
    // In Supabase schema, company_id is required
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', employee_id).single();
    const company_id = profile ? profile.company_id : '00000000-0000-0000-0000-000000000000'; // fallback
    
    const { data: existing, error: existErr } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('date', date);
      
    if (existErr) throw existErr;

    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('attendance_logs')
        .update({
          clock_in: check_in,
          clock_out: check_out || null,
          is_manual: true,
          status: 'present'
        })
        .eq('employee_id', employee_id)
        .eq('date', date);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('attendance_logs')
        .insert([{
          employee_id,
          company_id,
          date,
          clock_in: check_in,
          clock_out: check_out || null,
          is_manual: true,
          status: 'present'
        }]);
      if (error) throw error;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (manual-time):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// --- API ROUTE: Mark OD ---
router.put('/mark-od', requireAuth, async (req, res) => {
  try {
    const { employee_id, date, od_reason, check_in } = req.body;
    
    // In Supabase schema, company_id is required
    const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', employee_id).single();
    const company_id = profile ? profile.company_id : '00000000-0000-0000-0000-000000000000'; // fallback
    
    const { data: existing, error: existErr } = await supabase
      .from('attendance_logs')
      .select('id')
      .eq('employee_id', employee_id)
      .eq('date', date);
      
    if (existErr) throw existErr;
    
    if (existing && existing.length > 0) {
      const { error } = await supabase
        .from('attendance_logs')
        .update({
          status: 'OD',
          is_manual: true,
          clock_in: check_in,
          notes: od_reason || 'Field Trip (OD)'
        })
        .eq('employee_id', employee_id)
        .eq('date', date);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from('attendance_logs')
        .insert([{
          employee_id,
          company_id,
          date,
          clock_in: check_in,
          status: 'OD',
          is_manual: true,
          notes: od_reason || 'Field Trip (OD)'
        }]);
      if (error) throw error;
    }
    res.json({ success: true });
  } catch (err) {
    console.error("Supabase Error (mark-od):", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
