@echo off
REM KIRII Dashboard HTTP Server
REM このスクリプトを香港PCで実行し、中国側からHTTPでアクセスできるようにする
REM 中国側ブラウザで http://<このPCのIP>:8080/dashboard.html を開く

cd /d "%~dp0"
echo ========================================
echo  KIRII Dashboard Server
echo  URL: http://localhost:8080/dashboard.html
echo  Press Ctrl+C to stop
echo ========================================
python -m http.server 8080
