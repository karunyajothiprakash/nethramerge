-- postquery.sql
-- Useful diagnostics for the analytics sidebar counts and purchase orders APIs.
-- Run this against the VPS PostgreSQL database after updating the backend.

SELECT COUNT(*) AS client_acquisition_count
FROM client_acquisition ca
WHERE ca.is_deleted IS NOT TRUE;

SELECT COUNT(*) AS conversions_count
FROM leads
WHERE is_deleted IS NOT TRUE
  AND stage IN ('Won', 'Client Successfully Acquired');

SELECT COUNT(*) AS customers_count
FROM customers
WHERE is_deleted IS NOT TRUE;

SELECT po.*, json_build_object('full_name', f.full_name) AS farmers
FROM purchase_orders po
LEFT JOIN farmers f ON po.farmer_id = f.id
WHERE (po.is_deleted = false OR po.is_deleted IS NULL)
ORDER BY po.order_date DESC
LIMIT 100;
