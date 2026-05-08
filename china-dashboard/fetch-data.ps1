# KIRII Dashboard Data Fetcher + HTML Builder
# Hong Kong PC で実行。data/ に JSON 保存後、dashboard.html を自動再生成。
# 共有フォルダへコピーする場合は fetch-data-sync-to-shares.bat から
# -RemoteDirs を渡す（既定はローカルのみ＝スクリプトフォルダ内だけ更新）。

param(
    [string[]]$RemoteDirs = @()
)
$ErrorActionPreference = "Stop"
$BASE = "https://kirii-portfolio-1.vercel.app"
$NoCacheHeaders = @{
    "Cache-Control" = "no-cache, no-store, must-revalidate"
    "Pragma"        = "no-cache"
    "Expires"       = "0"
}
$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$DATA_DIR = Join-Path $SCRIPT_DIR "data"
$CHARTJS_FILE = Join-Path $SCRIPT_DIR "chart.min.js"
$OUTPUT_HTML = Join-Path $SCRIPT_DIR "dashboard.html"
$OUTPUT_CHARTJS = Join-Path $SCRIPT_DIR "chart.min.js"

# 共有先を複数指定可能（既定: account + dwg）

if (-not (Test-Path $DATA_DIR)) {
    New-Item -ItemType Directory -Path $DATA_DIR | Out-Null
}

function Fetch-And-Save {
    param([string]$Url, [string]$OutFile)
    try {
        $wc = New-Object System.Net.WebClient
        $wc.Encoding = [System.Text.Encoding]::UTF8
        $wc.Headers.Add("Cache-Control", "no-cache")
        $wc.DownloadFile($Url, $OutFile)
        $sz = (Get-Item $OutFile).Length
        Write-Host "OK: $OutFile ($sz bytes)"
        return $true
    } catch {
        Write-Host "ERROR: $Url -> $_"
        return $false
    }
}

function Normalize-HkdDate {
    param([string]$Value)
    if ([string]::IsNullOrWhiteSpace($Value)) {
        return $null
    }
    $normalized = $Value.Trim().Replace("/", "-").Replace(".", "-")
    if ($normalized -match "^\d{4}-\d{2}-\d{2}$") {
        return $normalized
    }
    return $null
}

function To-HkdPoint {
    param([object]$Row)
    if ($null -eq $Row) {
        return $null
    }

    $date = Normalize-HkdDate ([string]$Row.date)
    if ([string]::IsNullOrWhiteSpace($date)) {
        return $null
    }

    try {
        $rate = [double]$Row.rate
    } catch {
        return $null
    }
    if ([double]::IsNaN($rate) -or [double]::IsInfinity($rate)) {
        return $null
    }

    $point = [ordered]@{
        date = $date
        rate = $rate
    }

    if ($Row.PSObject.Properties.Name -contains "buy" -and $null -ne $Row.buy -and "$($Row.buy)" -ne "") {
        try { $point.buy = [double]$Row.buy } catch { }
    }
    if ($Row.PSObject.Properties.Name -contains "sell" -and $null -ne $Row.sell -and "$($Row.sell)" -ne "") {
        try { $point.sell = [double]$Row.sell } catch { }
    }

    return [PSCustomObject]$point
}

function Merge-HkdHistoryPoints {
    param(
        [object[]]$Primary,
        [object[]]$Secondary
    )

    $map = @{}
    foreach ($set in @($Primary, $Secondary)) {
        if ($null -eq $set) { continue }
        foreach ($row in $set) {
            $point = To-HkdPoint $row
            if ($null -eq $point) { continue }

            if ($map.ContainsKey($point.date)) {
                $prev = $map[$point.date]
                $merged = [ordered]@{
                    date = $point.date
                    rate = $point.rate
                }
                if ($null -ne $prev.buy) { $merged.buy = $prev.buy }
                if ($null -ne $prev.sell) { $merged.sell = $prev.sell }
                if ($null -ne $point.buy) { $merged.buy = $point.buy }
                if ($null -ne $point.sell) { $merged.sell = $point.sell }
                $map[$point.date] = [PSCustomObject]$merged
            } else {
                $map[$point.date] = $point
            }
        }
    }

    return $map.GetEnumerator() |
        Sort-Object Name |
        ForEach-Object { $_.Value }
}

Write-Host "=== KIRII Data Fetch $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="
$hkdFetchOk = $false
$steelFetchOk = $false
$aluminumFetchOk = $false
$buildOk = $false
$copyErrors = 0

# 1. HKD/RMB - fetch current rate + merged history (Vercel: Blob に蓄積 + 当日マージ)
try {
    $nonce = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $rateResponse = Invoke-WebRequest -Uri "$BASE/api/dashboard/hkd-rmb-rate?t=$nonce" -Headers $NoCacheHeaders -UseBasicParsing -TimeoutSec 30
    $historyResponse = Invoke-WebRequest -Uri "$BASE/api/dashboard/hkd-rmb-history?t=$nonce" -Headers $NoCacheHeaders -UseBasicParsing -TimeoutSec 30
    $seedResponse = Invoke-WebRequest -Uri "$BASE/data/hkd-rmb-midrate-history.json?t=$nonce" -Headers $NoCacheHeaders -UseBasicParsing -TimeoutSec 30
    $rate = $rateResponse.Content | ConvertFrom-Json
    Write-Host "Vercel API hkd-rmb-rate: date=$($rate.date) time=$($rate.time) mid=$($rate.midRate)"
    $history = $historyResponse.Content | ConvertFrom-Json
    $seedHistory = $seedResponse.Content | ConvertFrom-Json

    # Safety net: merge seed + API history locally so one-day gaps do not leak to China dashboard.
    $historyMerged = Merge-HkdHistoryPoints -Primary $seedHistory -Secondary $history

    # Ensure today's rate is always present in history.
    $todayDate = Normalize-HkdDate ([string]$rate.date)
    if (-not [string]::IsNullOrWhiteSpace($todayDate)) {
        $todayPoint = [PSCustomObject]@{
            date = $todayDate
            rate = [double]$rate.midRate
            buy  = [double]$rate.buyRate
            sell = [double]$rate.sellRate
        }
        $historyMerged = Merge-HkdHistoryPoints -Primary $historyMerged -Secondary @($todayPoint)

        try {
            $yesterday = ([datetime]::ParseExact($todayDate, "yyyy-MM-dd", $null)).AddDays(-1).ToString("yyyy-MM-dd")
            $hasYesterday = $historyMerged | Where-Object { $_.date -eq $yesterday } | Select-Object -First 1
            if ($null -eq $hasYesterday) {
                Write-Host "WARN: HKD history missing calendar previous day: $yesterday"
            }
            $todayObj = [datetime]::ParseExact($todayDate, "yyyy-MM-dd", $null)
            $ageDays = [int]((Get-Date).Date.Subtract($todayObj.Date).TotalDays)
            if ($ageDays -gt 3) {
                Write-Host "WARN: HKD today date is stale by $ageDays days (today=$todayDate)"
            }
        } catch {
            Write-Host "WARN: Failed to evaluate HKD previous day continuity"
        }
    }

    $historyJson = $historyMerged | ConvertTo-Json -Depth 5 -Compress
    $combined = '{"rate":' + $rateResponse.Content + ',"history":' + $historyJson + '}'
    [System.IO.File]::WriteAllText((Join-Path $DATA_DIR "hkd-rate.json"), $combined, [System.Text.Encoding]::UTF8)
    Write-Host "OK: hkd-rate.json (today: $todayDate buy=$($rate.buyRate) sell=$($rate.sellRate) mid=$($rate.midRate) points=$($historyMerged.Count))"
    $hkdFetchOk = $true
} catch {
    Write-Host "ERROR: HKD rate -> $_"
    $hkdFetchOk = $false
}

# 2. Steel（portfolio の SteelPriceChartCard と同じ query: seriesLimit=6, pointLimit=2000）
$nonce = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$steelFetchOk = Fetch-And-Save -Url "$BASE/api/dashboard/steel-price?seriesLimit=6&pointLimit=2000&t=$nonce" -OutFile (Join-Path $DATA_DIR "steel-price.json")

# 3. Aluminum
$nonce = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$aluminumFetchOk = Fetch-And-Save -Url "$BASE/api/dashboard/aluminum-price?seriesLimit=2&pointLimit=2000&t=$nonce" -OutFile (Join-Path $DATA_DIR "aluminum-price.json")

# 4. Timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
[System.IO.File]::WriteAllText((Join-Path $DATA_DIR "last-updated.txt"), $timestamp, [System.Text.Encoding]::UTF8)

# 5. Build self-contained HTML (string concat, no here-string to avoid $ expansion)
Write-Host "Building dashboard.html..."
try {
    if (-not $hkdFetchOk) {
        throw "HKD fetch failed; abort build to avoid stale dashboard output"
    }
    if (-not $steelFetchOk) {
        throw "Steel fetch failed; abort build to avoid stale dashboard output"
    }
    if (-not $aluminumFetchOk) {
        throw "Aluminum fetch failed; abort build to avoid stale dashboard output"
    }

    function Read-Utf8NoBom([string]$path) {
        $bytes = [System.IO.File]::ReadAllBytes($path)
        if ($bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF) {
            return [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
        }
        return [System.Text.Encoding]::UTF8.GetString($bytes)
    }

    if (-not (Test-Path $CHARTJS_FILE)) {
        throw "chart.min.js not found next to fetch-data.ps1: $CHARTJS_FILE"
    }
    $chartBytes = (Get-Item $CHARTJS_FILE).Length
    if ($chartBytes -lt 100000) {
        throw "chart.min.js looks truncated or wrong file ($chartBytes bytes). Restore from repo china-dashboard/chart.min.js"
    }
    $chartJs = Read-Utf8NoBom $CHARTJS_FILE

    $hkdData = Read-Utf8NoBom (Join-Path $DATA_DIR "hkd-rate.json")
    $steelData = Read-Utf8NoBom (Join-Path $DATA_DIR "steel-price.json")
    $aluminumData = Read-Utf8NoBom (Join-Path $DATA_DIR "aluminum-price.json")

    $templateFile = Join-Path $SCRIPT_DIR "dashboard-template.html"
    $template = Read-Utf8NoBom $templateFile

    $html = $template
    $html = $html.Replace('__TIMESTAMP__', $timestamp)
    $html = $html.Replace('__HKD_DATA__', $hkdData)
    $html = $html.Replace('__STEEL_DATA__', $steelData)
    $html = $html.Replace('__ALUMINUM_DATA__', $aluminumData)
    $html = $html.Replace('__CHARTJS__', $chartJs)

    [System.IO.File]::WriteAllText($OUTPUT_HTML, $html, [System.Text.Encoding]::UTF8)
    Write-Host "OK: dashboard.html built ($([math]::Round((Get-Item $OUTPUT_HTML).Length/1024)) KB)"
    $buildOk = $true
} catch {
    Write-Host "ERROR: HTML build -> $_"
    $buildOk = $false
}

# 6. Copy dashboard.html to remote shared folders
# Backward compatibility for cmd.exe passing single joined string.
# Accept delimiters: ';' (preferred), ',' (legacy)
if ($RemoteDirs.Count -eq 1) {
    if ($RemoteDirs[0] -match ";") {
        $RemoteDirs = $RemoteDirs[0].Split(";")
    } elseif ($RemoteDirs[0] -match ",") {
        $RemoteDirs = $RemoteDirs[0].Split(",")
    }
}

# Normalize target list (trim/unique/case-insensitive)
$normalizedRemoteDirs = @()
$seen = New-Object 'System.Collections.Generic.HashSet[string]' ([System.StringComparer]::OrdinalIgnoreCase)
foreach ($remoteDir in $RemoteDirs) {
    if ([string]::IsNullOrWhiteSpace($remoteDir)) {
        continue
    }
    $trimmed = $remoteDir.Trim()
    if ($seen.Add($trimmed)) {
        $normalizedRemoteDirs += $trimmed
    }
}

Write-Host "Sync targets ($($normalizedRemoteDirs.Count)):"
foreach ($target in $normalizedRemoteDirs) {
    Write-Host " - $target"
}

if (-not $buildOk) {
    Write-Host "FATAL: Skip remote sync because dashboard build failed."
    exit 1
}

$sourceHash = (Get-FileHash -Path $OUTPUT_HTML -Algorithm SHA256).Hash
Write-Host "Source SHA256: $sourceHash"

$proofTimestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss.fff"
$localProofPath = Join-Path $SCRIPT_DIR "sync-proof-local.txt"
[System.IO.File]::WriteAllText(
    $localProofPath,
    "built_at=$proofTimestamp`r`nsource_html=$OUTPUT_HTML`r`nsource_sha256=$sourceHash`r`n",
    [System.Text.Encoding]::UTF8
)
Write-Host "OK: Wrote $localProofPath"

foreach ($remoteDir in $normalizedRemoteDirs) {
    try {
        if (-not (Test-Path $remoteDir)) {
            New-Item -ItemType Directory -Path $remoteDir -Force | Out-Null
        }
        $targetFile = Join-Path $remoteDir "dashboard.html"
        Copy-Item $OUTPUT_HTML $targetFile -Force
        Copy-Item $OUTPUT_CHARTJS (Join-Path $remoteDir "chart.min.js") -Force

        $targetHash = (Get-FileHash -Path $targetFile -Algorithm SHA256).Hash
        if ($targetHash -eq $sourceHash) {
            Write-Host "OK: Copied+Verified $targetFile (SHA256 match)"
            $remoteProofPath = Join-Path $remoteDir "sync-proof.txt"
            [System.IO.File]::WriteAllText(
                $remoteProofPath,
                "built_at=$proofTimestamp`r`nsource_sha256=$sourceHash`r`ntarget_sha256=$targetHash`r`ntarget_file=$targetFile`r`n",
                [System.Text.Encoding]::UTF8
            )
            Write-Host "OK: Wrote $remoteProofPath"

            # Extract displayed HKD date from generated HTML for quick verification
            $htmlCheck = Get-Content $targetFile -Raw -Encoding UTF8
            $dateMatch = [regex]::Match($htmlCheck, '"date"\s*:\s*"(\d{4}[-/]\d{2}[-/]\d{2})"')
            if ($dateMatch.Success) {
                Write-Host "CHECK: $targetFile shows HKD date = $($dateMatch.Groups[1].Value)"
            } else {
                Write-Host "CHECK: $targetFile HKD date not found"
            }
        } else {
            Write-Host "ERROR: Hash mismatch $targetFile (src=$sourceHash dst=$targetHash)"
            $copyErrors++
        }
    } catch {
        Write-Host "ERROR: Remote copy ($remoteDir) -> $_"
        $copyErrors++
    }
}

Write-Host "=== Done: $timestamp ==="
if ($copyErrors -gt 0) {
    exit 1
}
