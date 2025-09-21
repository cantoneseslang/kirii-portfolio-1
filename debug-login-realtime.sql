-- リアルタイムログイン履歴確認
-- Supabaseダッシュボードで「Service Role」権限で実行してください

-- 最新のログイン履歴を確認
SELECT
  p.full_name,
  u.email,
  lh.login_timestamp,
  lh.ip_address,
  lh.login_success,
  lh.error_message
FROM login_history lh
JOIN profiles p ON lh.user_id = p.id
LEFT JOIN auth.users u ON p.id = u.id
ORDER BY lh.login_timestamp DESC
LIMIT 10;

-- 9月のログイン履歴を確認
SELECT
  p.full_name,
  u.email,
  COUNT(lh.id) as login_count,
  MAX(lh.login_timestamp) as last_login
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
LEFT JOIN login_history lh ON p.id = lh.user_id
WHERE lh.login_timestamp >= '2025-09-01' AND lh.login_timestamp < '2025-10-01'
GROUP BY p.id, p.full_name, u.email
ORDER BY login_count DESC;

-- 全期間の統計
SELECT
  COUNT(*) as total_records,
  COUNT(CASE WHEN login_success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN login_success = false THEN 1 END) as failed_logins
FROM login_history;


