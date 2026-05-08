# HKD/RMB Logic Spec

`HKD/RMB` カードの正式仕様。今後の修正は必ず本書を先に確認し、本書に反する実装を入れないこと。

## 対象ファイル

- `components/hkd-rmb-rate-card.tsx`
- `lib/hkd-rmb-comparison.ts`
- `lib/hkd-rmb-date.ts`
- `lib/dashboard-hkd-rmb-history-cache.ts`
- `lib/hkd-rmb-rate.ts`
- `app/api/dashboard/hkd-rmb-rate/route.ts`
- `app/api/dashboard/hkd-rmb-history/route.ts`
- `app/api/cron/hkd-rmb-history-sync/route.ts`

## データ取得元

### 最新値

- API: `/api/dashboard/hkd-rmb-rate`
- 実装: `app/api/dashboard/hkd-rmb-rate/route.ts`
- ソース: `lib/hkd-rmb-rate.ts`
- 元データ: BOC `https://www.boc.cn/sourcedb/whpj/`
- 返却値:
  - `date`
  - `time`
  - `buyRate`
  - `sellRate`
  - `midRate`

### 履歴

- API: `/api/dashboard/hkd-rmb-history`
- 実装: `app/api/dashboard/hkd-rmb-history/route.ts`
- ソース: `lib/dashboard-hkd-rmb-history-cache.ts`
- 元データ:
  - `public/data/hkd-rmb-midrate-history.json`
  - `public/data/hkd-rmb-history-backfill.json`
  - `dashboard-hkd-rmb-history/daily/YYYY-MM-DD.json`
- 返却値:
  - `date`
  - `rate`
  - `buy?`
  - `sell?`

## 日付ルール

- 内部日付形式は必ず `YYYY-MM-DD`
- 比較キーは `YYYYMMDD` 数値
- `前一个工作日` の基準日は `Asia/Hong_Kong` で計算する
- `与本月初对比` の基準日は `latest.date` の月初を使う

## 3行の意味

### 1. 最新外汇价

- 意味: 当日最新の為替レート
- 日付: `latest.date`
- 値:
  - `汇买 = latest.buyRate`
  - `汇卖 = latest.sellRate`
  - `中行折算价 = latest.midRate`
- 変動列は空欄

### 2. 前一个工作日

- 意味: 香港基準で見た直前の営業日との比較
- `targetDate`: 香港の今日から1営業日前
- `base`: `history` 内で `point.date === targetDate` を満たす点のみ
- 値:
  - `汇买 = base.buy`
  - `汇卖 = base.sell`
  - `中行折算价 = base.rate`
- 変動式:
  - `买入变动 = ((latest.buyRate - base.buy) / base.buy) * 100`
  - `卖出变动 = ((latest.sellRate - base.sell) / base.sell) * 100`
  - `折算变动 = ((latest.midRate - base.rate) / base.rate) * 100`

### 3. 与本月初对比

- 意味: 月初基準との比較
- `targetDate`:
  - 毎月 `1日` と `2日`: 前月末日
  - 毎月 `3日` 以降: `latest.date` と同じ月の `01`
- `base`: `history` 内で `point.date === targetDate` を満たす点のみ
- 値:
  - `汇买 = base.buy`
  - `汇卖 = base.sell`
  - `中行折算价 = base.rate`
- 変動式:
  - `买入变动 = ((latest.buyRate - base.buy) / base.buy) * 100`
  - `卖出变动 = ((latest.sellRate - base.sell) / base.sell) * 100`
  - `折算变动 = ((latest.midRate - base.rate) / base.rate) * 100`

## 絶対禁止

- 比較行に `latest` の当日値を流用する
- `targetDate` と一致しない別日データで比較行の値を埋める
- `buy/sell` だけ別日の点から拾う
- `最新外汇价` と `与本月初对比` を同値にする
- 3行以外を勝手に追加する
- 本書未確認のまま HKD/RMB ロジックを変更する

## 欠損の扱い

- 本仕様上、比較行の `base` は厳密一致のみ
- 一致データが無い場合は「表示ロジックでごまかさない」
- その場合に直すべき場所は `history` の取り込み・保存経路であり、UI で別日補完しない
- 履歴入力源の優先順:
  - `seed JSON`
  - `backfill JSON`
  - `daily blob`
- 運用中に当日 live rate が履歴に未保存なら、`daily blob` へ自動保存して欠損を減らす
- 過去欠損日の正式補完は `backfill JSON` または `daily blob` へ追加して行う

## 修正前チェックリスト

- 触る行はどれか
- `targetDate` は何か
- `base` は何か
- `point.date === targetDate` を満たすか
- `latest` を比較行に流用していないか
- `buy/sell` を別日から拾っていないか
- 行数が3行固定のままか
- 回帰テストを追加したか
- `/api/dashboard/hkd-rmb-rate` と `/api/dashboard/hkd-rmb-history` を確認したか
- ローカル `/dashboard` で表示を確認したか

## 最低限必要な回帰テスト

- 月曜 -> 金曜の前営業日計算
- 月初計算
- 月初比較の境界条件:
  - `1日` は前月末日
  - `2日` は前月末日
  - `3日` から当月 `01`
- `targetDate` 一致がある場合にその点を使う
- `targetDate` 一致が無い場合に別日フォールバックしない
- `最新外汇价` と比較行が同値にならない
- 3行以外が出ない
