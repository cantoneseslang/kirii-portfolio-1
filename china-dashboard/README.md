# KIRII Dashboard (China Version)

**トラブル・再発防止（問題整理・原因・対策・チェックリスト）:** [`再発防止-トラブル記録.md`](./再発防止-トラブル記録.md)

---

## Vercel デプロイ後の更新手順（フォルダ丸ごと差し替え）

1. **本番アプリ**は Vercel にデプロイする（API の正は `https://kirii-portfolio-1.vercel.app`）。`fetch-data.ps1` の `$BASE` はこの URL を参照しています。
2. 香港 PC の China Dashboard を更新するときは、**Git / ZIP からリポジトリ内の `china-dashboard/` フォルダ一式をコピーし、既存の `china-dashboard` フォルダを丸ごと上書き**（コピペ差し替え）してください。部分コピーより、この運用でスクリプト・テンプレート・`chart.min.js` の版揃えが確実です。
3. **`fetch-data.bat`** でローカルの `data/` と `dashboard.html` を生成し、**次の3箇所**に `dashboard.html` と `chart.min.js` を上書きします（パスは bat 内 `REMOTE_*` で編集）。  
   - `U:\china-dashboard`（account 共有）  
   - `U:\Purchase\china-dashboard`（account 共有・Purchase 配下）  
   - `Q:\Purchase\china-dashboard`（DWG 共有・Q ドライブ・Purchase 配下）
4. **`fetch-data-sync-to-shares.bat`** は **`fetch-data.bat` を呼び出すだけ**です（旧名の互換用）。

---

## Windows cmd.exe（繁体字PCで `Sync targets (0):` になるとき）

### 原因

- `.bat` 内の**日本語コメント**・**UTF-8 保存**・**`chcp 65001`** の組み合わせで、`cmd.exe` が行を誤解釈し、`set "REMOTE_1=..."` が実行されないことがあります。その結果 PowerShell に **`-RemoteDirs` が空**で渡り、**`Sync targets (0):`** だけが出ます（JSON とローカル `dashboard.html` は更新されても、**3フォルダへコピーされない**）。
- リポジトリの `fetch-data.bat` / `fetch-data-silent.bat` は **ASCII のみ**にしています。**メモ帳で編集する場合は BAT に日本語を書かない**でください。

### 成功時の見え方

1. コンソールに **`Sync targets (3):`** と続けて **` - U:\china-dashboard`** など **3行**。  
2. その後 **`OK: Copied+Verified ...\dashboard.html (SHA256 match)`** が **各コピー先ごとに 1 回ずつ**（最大3回）。  
3. 同じタイミングで **`chart.min.js`** も各フォルダにコピーされます。

### フォルダ名（よくある取り違え）

- 同期対象: **`U:\Purchase\china-dashboard`**（ハイフン `china-dashboard`）  
- 別フォルダ: **`U:\Purchase\china_dashboard`**（アンダースコア）← **bat からは触りません。** ブラウザで開いているパスが意図したフォルダか確認してください。

### タスクスケジューラ用ログ

`fetch-data-silent.bat` は **`logs\YYYYMMDD.log` の先頭**に **`REMOTE_DIRS=U:\...;U:\...;Q:\...`** を追記します。ここが空や壊れた文字だけなら、**まだ bat の解析に失敗している**状態です。

---

## まず読む（URL が「おかしい」と感じたら）

**ダブルクリックしただけでは `http://localhost:8080/...` にはなりません。**  
ブラウザのアドレスバーが `file:///C:/.../dashboard.html` になるのは**正常**です。昔から同じ動きです。

| やりたいこと | 手順 | アドレスバーの例 |
|-------------|------|------------------|
| **この PC だけで見る** | ① `fetch-data.bat` を実行 → ② **`dashboard.html`** をダブルクリック | `file:///C:/.../china-dashboard/dashboard.html` |
| **localhost で見る** | ① `start-server.bat` を起動したままにする → ② ブラウザで **`http://localhost:8080/dashboard.html`** と**自分で入力**（またはブックマーク） | `http://localhost:8080/dashboard.html` |
| **中国側の PC から見る** | 香港 PC で `start-server.bat` を起動 → 中国側ブラウザで `http://<香港PCのIP>:8080/dashboard.html` | `http://192.168.x.x:8080/dashboard.html` |

**開いてはいけないファイル**

- **`dashboard-template.html`** — 中身は `__HKD_DATA__` などの**置換前**の設計用ファイル。ダブルクリックしても完成画面にはなりません。普段は開かないでください。
- 見るのは常に **`fetch-data.bat` 実行後の `dashboard.html`** だけです。

---

## フォルダ構成

```
china-dashboard/
├── dashboard.html           ← 見るのはこれ（fetch-data.ps1 が data から生成）
├── dashboard-template.html  ← ソース（置換用・普段は開かない）
├── chart.min.js             ← Chart.js（dashboard.html と同じフォルダに必要）
├── start-server.bat         ← HTTP サーバー（8080）を立ち上げる
├── fetch-data.bat           ← データ取得＋ HTML 再生成＋3箇所へ dashboard.html / chart.min.js をコピー
├── fetch-data-sync-to-shares.bat ← `fetch-data.bat` を呼ぶ（互換用）
├── fetch-data-silent.bat    ← タスクスケジューラ用（ログ＋共有同期）
├── fetch-data.ps1
├── data/
│   ├── hkd-rate.json
│   ├── steel-price.json
│   ├── aluminum-price.json
│   └── last-updated.txt
└── README.md
```

## 仕組み（現在の実装）

`fetch-data.ps1` が Vercel API から JSON を取り、`dashboard-template.html` のプレースホルダを埋めて **`dashboard.html` を書き出します**（レート等のデータは HTML 内に埋め込み）。  
**クエリパラメータは portfolio ダッシュボードと同じにしています**（例: 鋼材は `seriesLimit=6` & `pointLimit=2000` = `components/steel-price-chart-card.tsx` と一致。以前の `pointLimit=365` だと比較表・グラフの参照範囲が狭く、portfolio と別物になります）。  
HKD は取りこぼし対策として、`/api/dashboard/hkd-rmb-history` と `/data/hkd-rmb-midrate-history.json` を **ローカルで日付マージ**してから `hkd-rate.json` を作成します（前日欠損の再発防止）。  
**Chart.js も通常は HTML 内に埋め込み**ます（`dashboard.html` 単体で開いてもグラフ表示できるようにするため）。さらに保険として、`Chart` が見つからない場合は同じフォルダの **`chart.min.js`** を動的読み込みする診断ロジックを入れています。  
`dashboard.html` を別 PC に渡すときは、念のため **`chart.min.js` も同じ場所に置く**運用にしてください（診断表示で原因を即判別できます）。

## セットアップ（香港PC）

### 1. フォルダ配置（初回・アップデート共通）
リポジトリの **`china-dashboard/` をそのまま**香港 PC の作業場所に置く。アップデート時は**既存フォルダを丸ごと差し替え**（中身を上書き）する。

### 2. データ取得と HTML 生成
- **いつもの実行:** `fetch-data.bat` → カレントの `data/`・`dashboard.html` 更新のあと、**`U:\china-dashboard` / `U:\Purchase\china-dashboard` / `Q:\Purchase\china-dashboard`** の各フォルダに同じ 2 ファイルをコピー（bat 内で変更可）
- **タスクスケジューラ:** `fetch-data-silent.bat`（上記と同じ3箇所。ログは `logs\YYYYMMDD.log`）

> `fetch-data.ps1` は、HKD/Steel/Aluminum のどれか取得に失敗した場合は **古いデータで上書きしないために build を中止**します。  
> タスク実行時は `logs\YYYYMMDD.log` の `ERROR` / `FATAL` を確認してください。

### 3-A. ローカルで確認（file://）
`dashboard.html` をダブルクリック → `file:///...` で開く（上表どおり）

### 3-B. HTTP で確認（localhost / 中国側向け）
`start-server.bat` をダブルクリック → コンソールを閉じない → ブラウザで `http://localhost:8080/dashboard.html` を開く

### 4. タスクスケジューラ（例）
- **`fetch-data-silent.bat`** を平日 08:55 / 12:55 / 16:55 など（ログは `logs\YYYYMMDD.log`。**`fetch-data.bat` と同じ3箇所へ同期**）
- 中国側から見る必要がある場合のみ `start-server.bat` を PC ログオン時などに実行

## 中国側の使い方

香港 PC でサーバー起動中に、ブラウザで次を開く:

```
http://<香港PCのIP>:8080/dashboard.html
```

## データの流れ（概略）

```
[Vercel 本番 kirii-portfolio-1.vercel.app]
       ↓
[香港PC] fetch-data（*.bat）→ data/*.json を更新 → dashboard.html を再生成（＋必要なら共有へコピー）
       ↓
[閲覧]  file:// で dashboard.html を開く ／ または start-server + http://... で開く
```

## HKD/RMB 表示ルール（別PCでも同一）

`dashboard-template.html` から生成される HKD/RMB テーブルは、次の3項目を必ず表示します。

1. `最新外汇价`
2. `前一天`（前日データ欠損時は `上一笔`）
3. `与本月初对比`（月初当日でも表示、`(当日)` は付けない）
