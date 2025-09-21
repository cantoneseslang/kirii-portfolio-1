-- 8月のテスト用ログイン履歴データの追加
-- Supabaseダッシュボードで「Service Role」権限で実行してください

-- 8月のテストデータを追加（2025年8月）
INSERT INTO login_history (user_id, login_timestamp, ip_address, user_agent, login_success, page_accessed)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk'),
  '2025-08-15 09:00:00+00' + (INTERVAL '1 day' * generate_series(0, 15)),
  '192.168.1.100',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  true,
  '/dashboard'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk');

-- 他のユーザーも8月のデータを追加
INSERT INTO login_history (user_id, login_timestamp, ip_address, user_agent, login_success, page_accessed)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'alexwong@kirii.com.hk'),
  '2025-08-10 10:00:00+00' + (INTERVAL '1 day' * generate_series(0, 8)),
  '192.168.1.101',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  true,
  '/dashboard'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'alexwong@kirii.com.hk');

-- 確認用クエリ
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN login_success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN login_success = false THEN 1 END) as failed_logins
FROM login_history 
WHERE login_timestamp >= '2025-08-01' AND login_timestamp < '2025-09-01';


