const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const db = require('../db');

// POST /api/farmers/:id/convert - Convert a farmer record into a customer
router.post('/:id/convert', requireAuth, async (req, res) => {
  const farmerId = req.params.id;
  const { company_id, name, email, country, phone, notes } = req.body;

  if (!company_id) {
    return res.status(400).json({ error: 'company_id is required' });
  }

  try {
    const { rows: farmerRows } = await db.query(
      'SELECT id, full_name, email, phone, country, notes, is_deleted FROM farmers WHERE id = $1',
      [farmerId]
    );

    if (farmerRows.length === 0 || farmerRows[0].is_deleted) {
      return res.status(404).json({ error: 'Farmer not found' });
    }

    const farmer = farmerRows[0];
    const customerEmail = (email || farmer.email || '').trim();

    if (customerEmail) {
      const { rows: existingCustomers } = await db.query(
        'SELECT id FROM customers WHERE company_id = $1 AND email = $2 LIMIT 1',
        [company_id, customerEmail]
      );

      if (existingCustomers.length > 0) {
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

    const keys = Object.keys(customerData).filter((key) => customerData[key] !== undefined);
    const values = keys.map((key) => customerData[key]);
    const placeholders = keys.map((_, index) => `$${index + 1}`).join(', ');
    const columns = keys.map((key) => `"${key}"`).join(', ');
    const insertQuery = `INSERT INTO customers (${columns}) VALUES (${placeholders}) RETURNING *`;

    await db.query('BEGIN');
    const { rows: insertedRows } = await db.query(insertQuery, values);
    await db.query('COMMIT');

    return res.status(201).json(insertedRows[0]);
  } catch (err) {
    await db.query('ROLLBACK');
    console.error('DB Error (convert farmer):', err);
    return res.status(500).json({ error: 'Failed to convert farmer to customer' });
  }
});

module.exports = router;
