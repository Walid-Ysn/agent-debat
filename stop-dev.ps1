Get-CimInstance Win32_Process |
Where-Object {
$.CommandLine -match 'uvicorn main:app|vite|ollama serve'
} |
ForEach-Object {
Stop-Process -Id $.ProcessId -Force
}

Get-NetTCPConnection -LocalPort 8000,5173,11434 -ErrorAction SilentlyContinue | Remove-NetTCPConnection -ErrorAction SilentlyContinue