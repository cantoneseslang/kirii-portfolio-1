-- 月間ログイン統計クエリ
-- Supabaseダッシュボードで「Service Role」権限で実行してください

-- 1. 今月のログイン統計
SELECT 
  '今月の統計' as period,
  COUNT(*) as total_logins,
  COUNT(CASE WHEN login_success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN login_success = false THEN 1 END) as failed_logins,
  COUNT(DISTINCT user_id) as unique_users
FROM login_history 
WHERE login_timestamp >= date_trunc('month', CURRENT_DATE);

-- 2. 過去6ヶ月の月別統計
SELECT 
  to_char(date_trunc('month', login_timestamp), 'YYYY-MM') as month,
  COUNT(*) as total_logins,
  COUNT(CASE WHEN login_success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN login_success = false THEN 1 END) as failed_logins,
  COUNT(DISTINCT user_id) as unique_users
FROM login_history 
WHERE login_timestamp >= date_trunc('month', CURRENT_DATE - INTERVAL '6 months')
GROUP BY date_trunc('month', login_timestamp)
ORDER BY month DESC;

-- 3. ユーザー別月間ログイン回数（今月）
SELECT 
  p.full_name,
  p.email,
  p.department,
  COUNT(*) as login_count,
  COUNT(CASE WHEN lh.login_success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN lh.login_success = false THEN 1 END) as failed_logins,
  MIN(lh.login_timestamp) as first_login,
  MAX(lh.login_timestamp) as last_login
FROM login_history lh
JOIN profiles p ON lh.user_id = p.id
WHERE lh.login_timestamp >= date_trunc('month', CURRENT_DATE)
GROUP BY p.id, p.full_name, p.email, p.department
ORDER BY login_count DESC;

-- 4. 部門別月間ログイン統計（今月）
SELECT 
  p.department,
  COUNT(*) as total_logins,
  COUNT(CASE WHEN lh.login_success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN lh.login_success = false THEN 1 END) as failed_logins,
  COUNT(DISTINCT p.id) as unique_users
FROM login_history lh
JOIN profiles p ON lh.user_id = p.id
WHERE lh.login_timestamp >= date_trunc('month', CURRENT_DATE)
GROUP BY p.department
ORDER BY total_logins DESC;

-- 5. 時間帯別ログイン統計（今月）
SELECT 
  EXTRACT(HOUR FROM login_timestamp) as hour_of_day,
  COUNT(*) as login_count,
  COUNT(CASE WHEN login_success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN login_success = false THEN 1 END) as failed_logins
FROM login_history 
WHERE login_timestamp >= date_trunc('month', CURRENT_DATE)
GROUP BY EXTRACT(HOUR FROM login_timestamp)
ORDER BY hour_of_day;

-- 6. 日別ログイン統計（今月）
SELECT 
  DATE(login_timestamp) as login_date,
  COUNT(*) as total_logins,
  COUNT(CASE WHEN login_success = true THEN 1 END) as successful_logins,
  COUNT(CASE WHEN login_success = false THEN 1 END) as failed_logins,
  COUNT(DISTINCT user_id) as unique_users
FROM login_history 
WHERE login_timestamp >= date_trunc('month', CURRENT_DATE)
GROUP BY DATE(login_timestamp)
ORDER BY login_date DESC;

-- 7. 最もアクティブなユーザー（過去30日）
SELECT 
  p.full_name,
  p.email,
  p.department,
  COUNT(*) as login_count,
  COUNT(DISTINCT DATE(lh.login_timestamp)) as active_days
FROM login_history lh
JOIN profiles p ON lh.user_id = p.id
WHERE lh.login_timestamp >= CURRENT_DATE - INTERVAL '30 days'
  AND lh.login_success = true
GROUP BY p.id, p.full_name, p.email, p.department
ORDER BY login_count DESC
LIMIT 10;

-- 8. ログイン失敗が多いユーザー（過去30日）
SELECT 
  p.full_name,
  p.email,
  p.department,
  COUNT(*) as failed_attempts,
  MAX(lh.login_timestamp) as last_failed_attempt
FROM login_history lh
JOIN profiles p ON lh.user_id = p.id
WHERE lh.login_timestamp >= CURRENT_DATE - INTERVAL '30 days'
  AND lh.login_success = false
GROUP BY p.id, p.full_name, p.email, p.department
ORDER BY failed_attempts DESC
LIMIT 10;


