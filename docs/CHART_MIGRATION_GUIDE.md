# Dashboard Charts Migration Guide

3つのグラフ（HKD/RMB, Galvanized Steel Coil, Aluminium Coil）を別環境に移植するためのファイル一覧とセットアップ手順。

---

## 必要ファイル一覧

### 1. コンポーネント（UI表示）

| ファイル | 役割 |
|---|---|
| `components/hkd-rmb-rate-card.tsx` | HKD/RMB レート + グラフカード |
| `components/steel-price-chart-card.tsx` | 镀锌板卷 Steel グラフカード |
| `components/aluminum-price-chart-card.tsx` | 铝锭 Aluminum グラフカード |

### 2. 共通UIコンポーネント（依存先）

| ファイル | 役割 |
|---|---|
| `components/ui/chart.tsx` | Recharts ラッパー（ChartContainer, ChartTooltip 等） |
| `components/ui/card.tsx` | Card, CardContent, CardHeader 等 |

### 3. API Routes

| ファイル | エンドポイント | データソース |
|---|---|---|
| `app/api/dashboard/hkd-rmb-rate/route.ts` | `/api/dashboard/hkd-rmb-rate` | boc.cn スクレイピング |
| `app/api/dashboard/steel-price/route.ts` | `/api/dashboard/steel-price` | Google Sheets CSV export |
| `app/api/dashboard/aluminum-price/route.ts` | `/api/dashboard/aluminum-price` | Google Sheets CSV export |

### 4. データ取得ライブラリ

| ファイル | 役割 |
|---|---|
| `lib/hkd-rmb-rate.ts` | boc.cn から港币レートをスクレイプ |
| `lib/dashboard-price-sheet.ts` | Google Sheets から Steel 価格データ取得（CSV export） |
| `lib/dashboard-aluminum-price-sheet.ts` | Google Sheets から Aluminum 価格データ取得（CSV export） |

### 5. キャッシュ（現在は未使用だが参照あり）

| ファイル | 備考 |
|---|---|
| `lib/dashboard-steel-price-cache.ts` | cron から参照される。API route からは未使用 |
| `lib/dashboard-aluminum-price-cache.ts` | 同上 |

### 6. 型定義

| ファイル | 役割 |
|---|---|
| `types/dashboard-steel-price.ts` | Steel 用の型 |
| `types/dashboard-aluminum-price.ts` | Aluminum 用の型 |

### 7. 静的データ

| ファイル | 役割 |
|---|---|
| `public/data/hkd-rmb-midrate-history.json` | HKD/RMB 中間価の過去1年分（242点） |

### 8. ダッシュボードページ

| ファイル | 役割 |
|---|---|
| `app/dashboard/page.tsx` | 3つのカードを配置しているメインページ |
| `app/dashboard/steel-price/page.tsx` | Steel 詳細ページ |
| `app/dashboard/aluminum-price/page.tsx` | Aluminum 詳細ページ |

### 9. cron（オプション）

| ファイル | 役割 |
|---|---|
| `app/api/cron/steel-price-sync/route.ts` | Steel スナップショット更新 |
| `vercel.json` | cron スケジュール定義 |

### 10. ドキュメント

| ファイル | 役割 |
|---|---|
| `docs/POSTMORTEM_STEEL_PRICE_UPDATE.md` | Steel 更新問題の postmortem と再発防止ルール |
| `.cursor/rules/google-sheets-data-fetch.mdc` | Google Sheets データ取得ルール |

---

## 依存パッケージ

```json
{
  "recharts": "^2.x",
  "googleapis": "^100.x"
}
```

`recharts` はグラフ描画、`googleapis` は Google Sheets API（OAuth 経由は現在未使用、CSV export のみ）。

---

## データソース

| グラフ | スプレッドシートID | シート名 | gid |
|---|---|---|---|
| Steel | `1RQb5fBTipFZPslbG60vP46DJZ8ZD9D7a7_eaKw718nM` | `镀锌板卷价格` | `1922386555` |
| Aluminum | 同上 | `当天铝锭价格` | `1629194981` |
| HKD/RMB | `https://www.boc.cn/sourcedb/whpj/` | HTML スクレイプ | N/A |

---

## 環境変数（必須ではない）

Steel/Aluminum は CSV export（公開URL）で取得するため、環境変数は不要。
以下はオプション（使わない場合はデフォルト値が使われる）:

```
DASHBOARD_STEEL_PRICE_SPREADSHEET_ID
DASHBOARD_STEEL_PRICE_SHEET_NAME
DASHBOARD_STEEL_PRICE_SHEET_GID
DASHBOARD_ALUMINUM_PRICE_SPREADSHEET_ID
DASHBOARD_ALUMINUM_PRICE_SHEET_NAME
DASHBOARD_ALUMINUM_PRICE_SHEET_GID
```

---

## セットアップ手順

1. 上記ファイルをすべてコピー
2. `npm install recharts googleapis` を実行
3. `public/data/hkd-rmb-midrate-history.json` をコピー
4. `app/dashboard/page.tsx` で3つのカードを import して配置:

```tsx
import HkdRmbRateCard from "@/components/hkd-rmb-rate-card";
import SteelPriceChartCard from "@/components/steel-price-chart-card";
import AluminumPriceChartCard from "@/components/aluminum-price-chart-card";

// JSX内:
<HkdRmbRateCard />
<SteelPriceChartCard />
<AluminumPriceChartCard />
```

5. 動作確認: `/api/dashboard/steel-price`, `/api/dashboard/aluminum-price`, `/api/dashboard/hkd-rmb-rate` の3つのAPIが JSON を返すことを確認

---

## 重要ルール（POSTMORTEM より）

- Google Sheets データは **CSV export のみ** で取得する（OAuth/gviz は使わない）
- Updated 表示は **シートの最終行日付** を使う（API取得時刻ではない）
- Vercel Blob キャッシュは使わない
- CDN キャッシュ（s-maxage）は 300 秒以下

---

## HKD/RMB テーブル表示ルール（必須3項目）

正式仕様は `docs/HKD_RMB_LOGIC_SPEC.md` を参照。

`components/hkd-rmb-rate-card.tsx` のテーブルは、以下3項目を必ず表示すること:

1. `最新外汇价`
2. `前一个工作日`
3. `与本月初对比`

補足:

- 比較行に当日値を流用しない
- `targetDate` と異なる別日データで比較行を埋めない
- `上一笔` 等の追加行を勝手に出さない
