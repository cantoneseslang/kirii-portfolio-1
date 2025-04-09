-- このSQLファイルは管理者権限を直接設定するためのものです
-- ユーザーID: 3f77c95e-2068-42d1-a368-633c04f407d4

-- プロフィールが存在するか確認し、存在しない場合は作成
INSERT INTO profiles (id, full_name, is_admin)
VALUES ('3f77c95e-2068-42d1-a368-633c04f407d4', 'Hiroki Sakon', TRUE)
ON CONFLICT (id) 
DO UPDATE SET 
  is_admin = TRUE,
  updated_at = NOW();

-- プロフィールデータの確認
SELECT * FROM profiles WHERE id = '3f77c95e-2068-42d1-a368-633c04f407d4';
