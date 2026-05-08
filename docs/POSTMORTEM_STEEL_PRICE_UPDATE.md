# Postmortem: Steel Price Chart Updated 日付が古いまま固定された問題

## 発生期間

2026/03/14 〜 2026/03/17

## 症状

- `Galvanized steel coil` の `Updated` が `2026/03/13` で停止
- `Aluminium coil` は `2026/03/16` で正常
- Google Sheet 上のデータは両方とも `2026/03/16` まで存在

## 根本原因（3層の複合）

### 1. シート参照先の誤り

`lib/dashboard-price-sheet.ts` の `DEFAULT_SHEET_TITLE` が `镀锌板卷价格-2`（gid=693135001）を指していた。
正しいデータソースは `镀锌板卷价格`（gid=1922386555）。

### 2. Google API 取得経路ごとのデータ鮮度差

| 取得手段 | 鮮度 | 備考 |
|---|---|---|
| CSV export (`/export?format=csv&gid=...`) | 常に最新 | 唯一信頼できる経路 |
| OAuth (Sheets API v4) | 数日遅延あり | サーバー側キャッシュが原因 |
| gviz (`/gviz/tq?...`) | 数日遅延あり | 同上 |

Steel API は `OAuth → gviz → CSV` の順で取得していたため、
本番では OAuth が常に優先され、古いデータが返り続けた。

### 3. Vercel Blob キャッシュの固定化

Steel API は Blob にスナップショットを保存し、以降はそれを返す設計だった。
一度古いデータが Blob に入ると、全リクエストが古いまま固定された。
さらに CDN キャッシュ（s-maxage=86400）で 24 時間レスポンスが固定。

## 確定した修正

| 修正 | ファイル |
|---|---|
| シート参照を `镀锌板卷价格`（gid=1922386555）に修正 | `lib/dashboard-price-sheet.ts` |
| CSV export のみで取得（OAuth/gviz を使わない） | `lib/dashboard-price-sheet.ts` |
| Blob キャッシュ経由を完全撤廃、毎回直接取得 | `app/api/dashboard/steel-price/route.ts` |
| Aluminum API も同様に簡素化 | `app/api/dashboard/aluminum-price/route.ts` |
| Updated 表示をシート最終行日付に変更 | `components/steel-price-chart-card.tsx`, `components/aluminum-price-chart-card.tsx` |
| CDN キャッシュを 86400 → 300 に短縮 | 両 API route |

---

## 再発防止ルール（必読）

### Google Sheets データ取得

1. **CSV export を唯一の取得手段とする**
   - OAuth (Sheets API v4) は数日遅延する場合がある
   - gviz も同様に遅延する
   - `/export?format=csv&gid=...` だけが常に最新データを返す
2. **取得経路に OAuth/gviz のフォールバックを入れない**
   - 「OAuth → CSV → gviz」のような優先順ロジックは禁止
   - CSV が失敗した場合はエラーを返し、静かに古いデータを返さない

### キャッシュ

3. **Vercel Blob にスナップショットを保存して返す設計を使わない**
   - Blob に古いデータが入ると全リクエストが古くなる
   - 毎回 Google Sheets から直接取得する
4. **CDN キャッシュ（s-maxage）は 300 秒以下にする**
   - 86400（24時間）は絶対に使わない
   - 問題発生時に修正が反映されるまでの遅延を最小化する

### Updated 表示

5. **Updated はシートの最終行日付を表示する**
   - API取得時刻（`new Date().toISOString()`）を表示しない
   - データが無い日に「今日の日付」を表示するのは虚偽になる

### デバッグ手順

6. **問題が起きたら、まず本番 API の JSON レスポンスを直接確認する**
   ```
   curl "https://kirii-portfolio-1.vercel.app/api/dashboard/steel-price?seriesLimit=1&pointLimit=3"
   ```
   - `last_date` と `sheetTitle` を確認
   - ローカルと本番で差があれば、本番固有の取得経路（OAuth等）が原因

7. **ローカルと本番の差を必ず比較する**
   - 同じコードなのに結果が違う → 環境変数（OAuth認証情報等）の有無が原因
   - ローカルにOAuth認証が無ければCSVが使われ、本番にはあればOAuthが優先される

8. **Google Sheets の各取得経路を個別に叩いて鮮度を確認する**
   ```
   # CSV（信頼できる）
   curl "https://docs.google.com/spreadsheets/d/{ID}/export?format=csv&gid={GID}" | head -6

   # gviz（遅延する場合あり）
   curl "https://docs.google.com/spreadsheets/d/{ID}/gviz/tq?tqx=out:json&sheet={TITLE}"
   ```

### シート参照

9. **シート名・gid を変更する場合は、以下の全ファイルを確認する**
   - `lib/dashboard-price-sheet.ts` → `DEFAULT_SHEET_TITLE`, `DEFAULT_SHEET_GID`
   - `components/steel-price-chart-card.tsx` → fallback URL 内の gid
   - `vercel.json` → cron 設定
   - Vercel 環境変数 → `DASHBOARD_STEEL_PRICE_SHEET_NAME`, `DASHBOARD_STEEL_PRICE_SHEET_GID`

---

## 対象スプレッドシート情報

- Spreadsheet ID: `1RQb5fBTipFZPslbG60vP46DJZ8ZD9D7a7_eaKw718nM`
- Steel シート: `镀锌板卷价格`（gid=`1922386555`）
- Aluminum シート: `当天铝锭价格`（gid=`1629194981`）
