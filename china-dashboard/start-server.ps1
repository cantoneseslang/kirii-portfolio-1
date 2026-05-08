# KIRII Dashboard HTTP Server
# Python が無い場合は .NET の HttpListener で代替

$SCRIPT_DIR = Split-Path -Parent $MyInvocation.MyCommand.Path
$PORT = 8080

# Try Python first
$pythonPath = Get-Command python -ErrorAction SilentlyContinue
if ($pythonPath) {
    Write-Host "Starting Python HTTP server on port $PORT..."
    Write-Host "URL: http://localhost:$PORT/dashboard.html"
    Write-Host "Press Ctrl+C to stop"
    Set-Location $SCRIPT_DIR
    python -m http.server $PORT
    exit
}

# Fallback: .NET HttpListener
Write-Host "Python not found. Using .NET HttpListener on port $PORT..."
Write-Host "URL: http://localhost:$PORT/dashboard.html"
Write-Host "Press Ctrl+C to stop"

$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://+:$PORT/")
$listener.Start()

$mimeTypes = @{
    ".html" = "text/html; charset=utf-8"
    ".js"   = "application/javascript"
    ".json" = "application/json"
    ".txt"  = "text/plain; charset=utf-8"
    ".css"  = "text/css"
}

while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    $urlPath = $request.Url.LocalPath.TrimStart("/")
    if ($urlPath -eq "") { $urlPath = "dashboard.html" }
    $filePath = Join-Path $SCRIPT_DIR $urlPath

    if (Test-Path $filePath -PathType Leaf) {
        $ext = [System.IO.Path]::GetExtension($filePath)
        $contentType = $mimeTypes[$ext]
        if (-not $contentType) { $contentType = "application/octet-stream" }
        $response.ContentType = $contentType
        $response.Headers.Add("Access-Control-Allow-Origin", "*")

        $bytes = [System.IO.File]::ReadAllBytes($filePath)
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
        Write-Host "200 $urlPath"
    } else {
        $response.StatusCode = 404
        $msg = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
        $response.OutputStream.Write($msg, 0, $msg.Length)
        Write-Host "404 $urlPath"
    }
    $response.Close()
}
