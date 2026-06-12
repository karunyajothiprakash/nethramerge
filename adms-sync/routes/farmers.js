const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// POST /api/farmers/:id/convert - Convert a farmer record into a customer
router.post('/:id/convert', requireAuth, async (req, res) => {
  const farmerId = req.params.id;
  const { company_id, name, email, country, phone, notes } = req.body;

  if (!company_id) {
    return res.status(400).json({ error: 'company_id is required' });
  }

  try {
    const { data: farmerRows, error: farmerErr } = await supabase
      .from('farmers')
      .select('id, full_name, email, phone, country, notes, is_deleted')
      .eq('id', farmerId);

    if (farmerErr) throw farmerErr;

    if (!farmerRows || farmerRows.length === 0 || farmerRows[0].is_deleted) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    const farmer = farmerRows[0];
    const customerEmail = (email || farmer.email || '').trim();

    if (customerEmail) {
      const { data: existingCustomers, error: existErr } = await supabase
        .from('customers')
        .select('id')
        .eq('company_id', company_id)
        .eq('email', customerEmail)
        .limit(1);

      if (existErr) throw existErr;

      if (existingCustomers && existingCustomers.length > 0) {
        return res.status(409).json({ error: 'A customer with this email already exists for the selected company.' });
      }
    }

    const customerData = {
      company_id,
      name: name || farmer.full_name,
      email: customerEmail || null,
      country: country || farmer.country || null,
      phone: phone || farmer.phone || null,
      notes: notes || farmer.notes || null,
    };

    const { data: insertedRows, error: insertErr } = await supabase
      .from('customers')
      .insert(customerData)
      .select();

    if (insertErr) throw insertErr;

    return res.status(201).json(insertedRows[0]);
  } catch (err) {
    console.error('DB Error (convert farmer):', err);
    return res.status(500).json({ error: err.message || 'Failed to convert farmer to customer' });
  }
});

module.exports = router;
