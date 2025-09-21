-- テスト用ログイン履歴データの追加
-- Supabaseダッシュボードで「Service Role」権限で実行してください

-- 現在のユーザーIDを取得
SELECT id, email, full_name FROM auth.users ORDER BY created_at;

-- テスト用のログイン履歴データを追加（過去30日分）
-- 注意: 以下のuser_idは実際のユーザーIDに置き換えてください

-- 例：Sakon Hiroki (hiroki.sakon@kirii.com.hk) のログイン履歴
INSERT INTO login_history (user_id, login_timestamp, ip_address, user_agent, login_success, page_accessed)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk'),
  NOW() - (INTERVAL '1 day' * generate_series(0, 29)),
  '192.168.1.100',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  true,
  '/dashboard'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'hiroki.sakon@kirii.com.hk');

-- 例：Wong Hong Keung (alexwong@kirii.com.hk) のログイン履歴（週に2-3回）
INSERT INTO login_history (user_id, login_timestamp, ip_address, user_agent, login_success, page_accessed)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'alexwong@kirii.com.hk'),
  NOW() - (INTERVAL '1 day' * (generate_series(0, 29) * 3 + (random() * 2)::int)),
  '192.168.1.101',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
  true,
  '/dashboard'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'alexwong@kirii.com.hk');

-- 例：Lau Cheuk Ming (billylau@kirii.com.hk) のログイン履歴（月に1-2回）
INSERT INTO login_history (user_id, login_timestamp, ip_address, user_agent, login_success, page_accessed)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'billylau@kirii.com.hk'),
  NOW() - (INTERVAL '1 day' * (generate_series(0, 2) * 10 + (random() * 5)::int)),
  '192.168.1.102',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  true,
  '/dashboard'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'billylau@kirii.com.hk');

-- 例：いくつかのユーザーでログイン失敗の履歴も追加
INSERT INTO login_history (user_id, login_timestamp, ip_address, user_agent, login_success, error_message, page_accessed)
SELECT 
  (SELECT id FROM auth.users WHERE email = 'ivan@kirii.com.hk'),
  NOW() - (INTERVAL '1 hour' * generate_series(1, 5)),
  '192.168.1.103',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  false,
  'Invalid login credentials',
  '/dashboard'
WHERE EXISTS (SELECT 1 FROM auth.users WHERE email = 'ivan@kirii.com.hk');

-- 確認用クエリ
SELECT 
  COUNT(*) as total_records,
  COUNT(CASE WHEN login_success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN login_success = false THEN 1 END) as failed_logins
FROM login_history;

-- ユーザー別ログイン回数
SELECT 
  p.full_name,
  p.email,
  COUNT(lh.id) as login_count,
  COUNT(CASE WHEN lh.login_success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN lh.login_success = false THEN 1 END) as failed_logins,
  MAX(lh.login_timestamp) as last_login
FROM profiles p
LEFT JOIN login_history lh ON p.id = lh.user_id
GROUP BY p.id, p.full_name, p.email
ORDER BY login_count DESC;


