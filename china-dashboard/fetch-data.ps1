# KIRII Dashboard Data Fetcher + HTML Builder
# Hong Kong PC で定期実行。data/ にJSON保存後、dashboard.html を自動再生成。
# REMOTE_DIRS を設定すると、共有フォルダにも dashboard.html をコピーする。

param(
    [string[]]$RemoteDirs = @(
        "U:\china-dashboard",
        "Q:\china-dashboard",
        "U:\Purchase\china-dashboard",
        "\\192.168.123.4\account\china-dashboard",
        "\\192.168.123.4\dwg\china-dashboard",
        "\\192.168.123.4\account\Purchase\china-dashboard"
    )
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
    } catch {
        Write-Host "ERROR: $Url -> $_"
    }
}

Write-Host "=== KIRII Data Fetch $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') ==="

# 1. HKD/RMB - fetch current rate + merged history (Vercel: Blob に蓄積 + 当日マージ)
try {
    $nonce = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
    $rateResponse = Invoke-WebRequest -Uri "$BASE/api/dashboard/hkd-rmb-rate?t=$nonce" -Headers $NoCacheHeaders -UseBasicParsing -TimeoutSec 30
    $historyResponse = Invoke-WebRequest -Uri "$BASE/api/dashboard/hkd-rmb-history?t=$nonce" -Headers $NoCacheHeaders -UseBasicParsing -TimeoutSec 30
    $rate = $rateResponse.Content | ConvertFrom-Json
    $history = $historyResponse.Content | ConvertFrom-Json

    $historyJson = $history | ConvertTo-Json -Depth 5 -Compress
    $combined = '{"rate":' + $rateResponse.Content + ',"history":' + $historyJson + '}'
    [System.IO.File]::WriteAllText((Join-Path $DATA_DIR "hkd-rate.json"), $combined, [System.Text.Encoding]::UTF8)
    Write-Host "OK: hkd-rate.json (today: $todayDate buy=$($rate.buyRate) sell=$($rate.sellRate) mid=$($rate.midRate))"
} catch {
    Write-Host "ERROR: HKD rate -> $_"
}

# 2. Steel
$nonce = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
Fetch-And-Save -Url "$BASE/api/dashboard/steel-price?seriesLimit=6&pointLimit=365&t=$nonce" -OutFile (Join-Path $DATA_DIR "steel-price.json")

# 3. Aluminum
$nonce = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
Fetch-And-Save -Url "$BASE/api/dashboard/aluminum-price?seriesLimit=2&pointLimit=2000&t=$nonce" -OutFile (Join-Path $DATA_DIR "aluminum-price.json")

# 4. Timestamp
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
[System.IO.File]::WriteAllText((Join-Path $DATA_DIR "last-updated.txt"), $timestamp, [System.Text.Encoding]::UTF8)

# 5. Build self-contained HTML (string concat, no here-string to avoid $ expansion)
Write-Host "Building dashboard.html..."
try {
    $hkdData = Get-Content (Join-Path $DATA_DIR "hkd-rate.json") -Raw -Encoding UTF8
    $steelData = Get-Content (Join-Path $DATA_DIR "steel-price.json") -Raw -Encoding UTF8
    $aluminumData = Get-Content (Join-Path $DATA_DIR "aluminum-price.json") -Raw -Encoding UTF8
    $chartJs = Get-Content $CHARTJS_FILE -Raw -Encoding UTF8

    $templateFile = Join-Path $SCRIPT_DIR "dashboard-template.html"
    $template = Get-Content $templateFile -Raw -Encoding UTF8

    $html = $template
    $html = $html.Replace('__TIMESTAMP__', $timestamp)
    $html = $html.Replace('__CHARTJS__', $chartJs)
    $html = $html.Replace('__HKD_DATA__', $hkdData)
    $html = $html.Replace('__STEEL_DATA__', $steelData)
    $html = $html.Replace('__ALUMINUM_DATA__', $aluminumData)

    [System.IO.File]::WriteAllText($OUTPUT_HTML, $html, [System.Text.Encoding]::UTF8)
    Write-Host "OK: dashboard.html built ($([math]::Round((Get-Item $OUTPUT_HTML).Length/1024)) KB)"
} catch {
    Write-Host "ERROR: HTML build -> $_"
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
            $dateMatch = [regex]::Match($htmlCheck, '"date"\s*:\s*"(\d{4}/\d{2}/\d{2})"')
            if ($dateMatch.Success) {
                Write-Host "CHECK: $targetFile shows HKD date = $($dateMatch.Groups[1].Value)"
            } else {
                Write-Host "CHECK: $targetFile HKD date not found"
            }
        } else {
            Write-Host "ERROR: Hash mismatch $targetFile (src=$sourceHash dst=$targetHash)"
        }
    } catch {
        Write-Host "ERROR: Remote copy ($remoteDir) -> $_"
    }
}

Write-Host "=== Done: $timestamp ==="
