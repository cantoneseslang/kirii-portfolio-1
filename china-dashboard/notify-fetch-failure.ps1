# Notify china-dashboard fetch failure via Vercel API (no SMTP on China PC).
param(
    [Parameter(Mandatory = $true)]
    [int]$ExitCode,
    [string]$LogFile = "",
    [switch]$Force
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$LogsDir = Join-Path $ScriptDir "logs"
if (-not (Test-Path $LogsDir)) {
    New-Item -ItemType Directory -Path $LogsDir | Out-Null
}

function Read-JsonFile([string]$Path) {
    if (-not (Test-Path $Path)) { return $null }
    try {
        return Get-Content -Path $Path -Raw -Encoding UTF8 | ConvertFrom-Json
    } catch {
        return $null
    }
}

function Get-ConfigValue([object]$Cfg, [string]$Name, [string]$EnvName, [string]$Default = "") {
    if ($Cfg -and ($Cfg.PSObject.Properties.Name -contains $Name)) {
        $v = [string]$Cfg.$Name
        if (-not [string]::IsNullOrWhiteSpace($v)) { return $v.Trim() }
    }
    $envVal = [string](Get-Item -Path "Env:$EnvName" -ErrorAction SilentlyContinue).Value
    if (-not [string]::IsNullOrWhiteSpace($envVal)) { return $envVal.Trim() }
    return $Default
}

$localCfgPath = Join-Path $ScriptDir "notify-config.local.json"
$exampleCfgPath = Join-Path $ScriptDir "notify-config.example.json"
$cfg = Read-JsonFile $localCfgPath
if ($null -eq $cfg) {
    $cfg = Read-JsonFile $exampleCfgPath
}

$alertUrl = Get-ConfigValue $cfg "alert_url" "CHINA_DASHBOARD_ALERT_URL" "https://kirii-portfolio-1.vercel.app/api/china-dashboard-alert"
$alertToken = Get-ConfigValue $cfg "alert_token" "CHINA_DASHBOARD_ALERT_TOKEN" ""
$cooldownHours = [int](Get-ConfigValue $cfg "notify_cooldown_hours" "CHINA_DASHBOARD_NOTIFY_COOLDOWN_HOURS" "6")

if ([string]::IsNullOrWhiteSpace($alertToken)) {
    Write-Host "WARN: notify skipped (set notify-config.local.json alert_token or env CHINA_DASHBOARD_ALERT_TOKEN)"
    exit 0
}

$cooldownFile = Join-Path $LogsDir "last-error-notify.txt"
if (-not $Force -and (Test-Path $cooldownFile)) {
    try {
        $lastSent = [datetime]::Parse((Get-Content -Path $cooldownFile -TotalCount 1 -Encoding UTF8).Trim())
        if ((Get-Date) -lt $lastSent.AddHours($cooldownHours)) {
            Write-Host "WARN: notify skipped (cooldown ${cooldownHours}h; last=$lastSent)"
            exit 0
        }
    } catch {
        # ignore parse errors; send anyway
    }
}

if ([string]::IsNullOrWhiteSpace($LogFile)) {
    $LogFile = Join-Path $LogsDir ("{0}.log" -f (Get-Date -Format "yyyyMMdd"))
}

$tailLines = @()
if (Test-Path $LogFile) {
    try {
        $tailLines = Get-Content -Path $LogFile -Tail 40 -Encoding UTF8
    } catch {
        $tailLines = @("(failed to read log: $_)")
    }
} else {
    $tailLines = @("(log file not found: $LogFile)")
}

$errorSummary = ($tailLines | Where-Object { $_ -match 'ERROR|FATAL|401|Unauthorized|Exception' } | Select-Object -Last 8) -join "`n"
if ([string]::IsNullOrWhiteSpace($errorSummary)) {
    $errorSummary = ($tailLines | Select-Object -Last 8) -join "`n"
}

$payload = @{
    exitCode = $ExitCode
    computer = $env:COMPUTERNAME
    scriptDir = $ScriptDir
    logFile = $LogFile
    errorSummary = $errorSummary
    occurredAt = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
}

$headers = @{
    "Content-Type" = "application/json"
    "x-china-dashboard-alert-token" = $alertToken
}

try {
    $json = $payload | ConvertTo-Json -Compress
    $response = Invoke-RestMethod -Uri $alertUrl -Method Post -Headers $headers -Body $json -TimeoutSec 60
    [System.IO.File]::WriteAllText($cooldownFile, (Get-Date -Format "o"), [System.Text.Encoding]::UTF8)
    Write-Host "OK: failure notification sent via Vercel API ($alertUrl)"
    if ($response.message) {
        Write-Host "Server: $($response.message)"
    }
    exit 0
} catch {
    $detail = $_.Exception.Message
    if ($_.ErrorDetails -and $_.ErrorDetails.Message) {
        $detail = $_.ErrorDetails.Message
    }
    Write-Host "ERROR: Vercel alert API failed -> $detail"
    exit 0
}
