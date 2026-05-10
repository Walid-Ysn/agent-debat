Get-CimInstance Win32_Process |
Where-Object { $_.CommandLine -match 'uvicorn main:app|vite|ollama serve' } |
ForEach-Object { Stop-Process -Id $_.ProcessId -Force }

Get-NetTCPConnection -LocalPort 8000,5173,11434 -ErrorAction SilentlyContinue |
Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue |
ForEach-Object { Stop-Process -Id $_ -ErrorAction SilentlyContinue }
