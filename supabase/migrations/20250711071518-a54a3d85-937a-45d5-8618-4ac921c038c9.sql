
-- Reset database for all users except admin and cashier
-- First, get admin and cashier user IDs to preserve them
WITH admin_cashier_users AS (
  SELECT DISTINCT ur.user_id 
  FROM user_roles ur 
  WHERE ur.role IN ('admin', 'cashier')
),
users_to_delete AS (
  SELECT p.id as user_id
  FROM profiles p
  LEFT JOIN admin_cashier_users acu ON p.id = acu.user_id
  WHERE acu.user_id IS NULL
)

-- Delete order items for non-admin/cashier users
DELETE FROM order_items 
WHERE order_id IN (
  SELECT o.id 
  FROM orders o 
  JOIN users_to_delete utd ON o.user_id = utd.user_id
);

-- Delete cash payments for non-admin/cashier users
DELETE FROM cash_payments 
WHERE order_id IN (
  SELECT o.id 
  FROM orders o 
  JOIN users_to_delete utd ON o.user_id = utd.user_id
);

-- Delete payments for non-admin/cashier users
DELETE FROM payments 
WHERE order_id IN (
  SELECT o.id 
  FROM orders o 
  JOIN users_to_delete utd ON o.user_id = utd.user_id
);

-- Delete orders for non-admin/cashier users
DELETE FROM orders 
WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete children for non-admin/cashier users
DELETE FROM children 
WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete user roles for non-admin/cashier users (keep admin/cashier roles)
DELETE FROM user_roles 
WHERE user_id IN (SELECT user_id FROM users_to_delete);

-- Delete profiles for non-admin/cashier users
DELETE FROM profiles 
WHERE id IN (SELECT user_id FROM users_to_delete);

-- Finally, delete auth users (this will cascade delete related data)
-- Note: This requires service role access and might need to be done through Supabase dashboard
