-- 他のユーザーのパスワードを修正するためのSQL
-- Service Roleで実行する必要があります

-- 既存のユーザーのメールアドレスとパスワードの対応表
-- 表示されているユーザーのパスワードを一貫性のある方法で設定

-- ユーザーのパスワードを更新する関数
BEGIN;

-- Wong Hong Keung
UPDATE auth.users
SET encrypted_password = crypt('kirii-2025', gen_salt('bf'))
WHERE email = 'alexwong@kirii.com.hk';

-- Lau Cheuk Ming
UPDATE auth.users
SET encrypted_password = crypt('kirii-2025', gen_salt('bf'))
WHERE email = 'billylau@kirii.com.hk';

-- Poon Kit Ling
UPDATE auth.users
SET encrypted_password = crypt('kirii-2025', gen_salt('bf'))
WHERE email = 'grace@kirii.com.hk';

-- Lam Wai Lok
UPDATE auth.users
SET encrypted_password = crypt('kirii-2025', gen_salt('bf'))
WHERE email = 'anson@kirii.com.hk';

-- Kit Yu Yi
UPDATE auth.users
SET encrypted_password = crypt('kirii-2025', gen_salt('bf'))
WHERE email = 'kami@kirii.com.hk';

-- Li Mei Lin
UPDATE auth.users
SET encrypted_password = crypt('kirii-2025', gen_salt('bf'))
WHERE email = 'christinel@kirii.com.hk';

-- Hui Oi Han
UPDATE auth.users
SET encrypted_password = crypt('kirii-2025', gen_salt('bf'))
WHERE email = 'info2@kirii.com.hk';

-- その他のユーザー（スクリーンショットから確認）も同様に更新
-- すべてのユーザーに共通パスワード「kirii-2025」を設定

-- 管理者のパスワードは既存のものをそのまま使用
-- UPDATE auth.users
-- SET encrypted_password = crypt('sakon0201', gen_salt('bf'))
-- WHERE email = 'hiroki.sakon@kirii.com.hk';

-- パスワードが変更されたユーザーの確認
SELECT email, 
  CASE 
    WHEN encrypted_password = crypt('kirii-2025', encrypted_password) THEN 'パスワード更新成功'
    ELSE 'パスワード更新失敗'
  END AS password_status
FROM auth.users
WHERE email != 'hiroki.sakon@kirii.com.hk';

COMMIT;
