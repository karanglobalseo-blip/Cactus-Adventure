# PowerShell script to start a simple web server for Cactus Quest
Write-Host "🌵 Starting Cactus Quest Web Server..." -ForegroundColor Green
Write-Host ""

# Robust Python detection: try to actually run it
$pythonAvailable = $false
try {
    $null = & python --version 2>$null
    if ($LASTEXITCODE -eq 0) { $pythonAvailable = $true }
} catch { $pythonAvailable = $false }

if ($pythonAvailable) {
    Write-Host "Using Python HTTP server..." -ForegroundColor Yellow
    Write-Host "Game will be available at: http://localhost:8000" -ForegroundColor Cyan
    Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
    Write-Host ""
    
    # Open browser
    Start-Process "http://localhost:8000"
    
    # Start Python server
    python -m http.server 8000
} else {
    # Fallback: Use PowerShell HttpListener
    Write-Host "Python not available. Starting PowerShell web server..." -ForegroundColor Yellow
    
    try {
        $listener = New-Object System.Net.HttpListener
        $listener.Prefixes.Clear()
        $listener.Prefixes.Add("http://localhost:8000/")
        $listener.Start()
        
        Write-Host "Game available at: http://localhost:8000" -ForegroundColor Cyan
        Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
        Write-Host ""
        
        # Open browser
        Start-Process "http://localhost:8000"
        
        while ($listener.IsListening) {
            $context = $listener.GetContext()
            $request = $context.Request
            $response = $context.Response
            
            $localPath = $request.Url.LocalPath
            if ($localPath -eq "/") { $localPath = "/index.html" }
            
            $filePath = Join-Path $PSScriptRoot $localPath.TrimStart('/')
            
            if (Test-Path $filePath) {
                $content = Get-Content $filePath -Raw -Encoding UTF8
                $buffer = [System.Text.Encoding]::UTF8.GetBytes($content)
                
                # Set content type
                $extension = [System.IO.Path]::GetExtension($filePath)
                switch ($extension) {
                    ".html" { $response.ContentType = "text/html" }
                    ".js" { $response.ContentType = "application/javascript" }
                    ".css" { $response.ContentType = "text/css" }
                    default { $response.ContentType = "text/plain" }
                }
                
                $response.ContentLength64 = $buffer.Length
                $response.OutputStream.Write($buffer, 0, $buffer.Length)
            } else {
                $response.StatusCode = 404
                $errorBytes = [System.Text.Encoding]::UTF8.GetBytes("File not found")
                $response.OutputStream.Write($errorBytes, 0, $errorBytes.Length)
            }
            
            $response.Close()
        }
    } catch {
        Write-Host "Could not start web server. Opening file directly..." -ForegroundColor Red
        Start-Process "index.html"
    }
}
