-- サンプルデータを削除して本番モードに
-- Supabaseダッシュボードで「Service Role」権限で実行してください

-- 9月のテストデータを削除
DELETE FROM login_history 
WHERE login_timestamp >= '2025-09-01' 
AND login_timestamp < '2025-10-01'
AND ip_address IN ('192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103');

-- 8月のテストデータも削除（もし存在する場合）
DELETE FROM login_history 
WHERE login_timestamp >= '2025-08-01' 
AND login_timestamp < '2025-09-01'
AND ip_address IN ('192.168.1.100', '192.168.1.101', '192.168.1.102', '192.168.1.103');

-- 削除結果を確認
SELECT 
  COUNT(*) as remaining_records,
  COUNT(CASE WHEN login_success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN login_success = false THEN 1 END) as failed_logins
FROM login_history;

-- ユーザー別の残存ログイン履歴を確認
SELECT 
  p.full_name,
  u.email,
  COUNT(lh.id) as login_count,
  MAX(lh.login_timestamp) as last_login
FROM profiles p
LEFT JOIN auth.users u ON p.id = u.id
LEFT JOIN login_history lh ON p.id = lh.user_id
GROUP BY p.id, p.full_name, u.email
ORDER BY login_count DESC;


