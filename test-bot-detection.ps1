# Bot Detection Testing Script

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Bot Detection Integration Test" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Test 1: Check if server is running
Write-Host "Test 1: Checking if server is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method GET -TimeoutSec 5 -ErrorAction Stop
    Write-Host "[OK] Server is running!" -ForegroundColor Green
} 
catch {
    Write-Host "[FAIL] Server is NOT running. Please start it with 'npm run dev'" -ForegroundColor Red
    Write-Host ""
    exit 1
}
Write-Host ""

# Test 2: Test bot detection result endpoint
Write-Host "Test 2: Testing /api/bot-detection/result endpoint..." -ForegroundColor Yellow
$apiKey = "demo_api_key_12345678901234567890123456789012"
$headers = @{
    "Content-Type" = "application/json"
    "x-api-key" = $apiKey
}
$body = @{
    bot_detected = $true
    bot_kind = "Selenium"
    url = "https://test.com"
    timestamp = (Get-Date).ToString("o")
    user_agent = "Mozilla/5.0 (Test)"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/api/bot-detection/result" -Method POST -Headers $headers -Body $body -ErrorAction Stop
    if ($response.success) {
        Write-Host "[OK] Bot detection result endpoint working!" -ForegroundColor Green
    } 
    else {
        Write-Host "[FAIL] Endpoint returned success=false" -ForegroundColor Red
    }
} 
catch {
    Write-Host "[FAIL] Failed to call endpoint: $_" -ForegroundColor Red
}
Write-Host ""

# Test 3: Test bot blocked endpoint
Write-Host "Test 3: Testing /api/bot-detection/blocked endpoint..." -ForegroundColor Yellow
$body2 = @{
    bot_kind = "HeadlessChrome"
    url = "https://test.com/page"
    timestamp = (Get-Date).ToString("o")
    blocked = $true
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:3000/api/bot-detection/blocked" -Method POST -Headers $headers -Body $body2 -ErrorAction Stop
    if ($response2.success) {
        Write-Host "[OK] Bot blocked endpoint working!" -ForegroundColor Green
    } 
    else {
        Write-Host "[FAIL] Endpoint returned success=false" -ForegroundColor Red
    }
} 
catch {
    Write-Host "[FAIL] Failed to call endpoint: $_" -ForegroundColor Red
}
Write-Host ""

# Test 4: Check extension files
Write-Host "Test 4: Checking extension files..." -ForegroundColor Yellow
$extensionPath = "browser-extension"
$requiredFiles = @(
    "bot-detector.js",
    "manifest.json",
    "popup.html",
    "popup.js",
    "background.js"
)

$allFilesExist = $true
foreach ($file in $requiredFiles) {
    $fullPath = Join-Path $extensionPath $file
    if (Test-Path $fullPath) {
        Write-Host "  [OK] $file exists" -ForegroundColor Green
    } 
    else {
        Write-Host "  [FAIL] $file missing!" -ForegroundColor Red
        $allFilesExist = $false
    }
}
Write-Host ""

# Summary
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Test Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Load extension in Chrome" -ForegroundColor White
Write-Host "2. Click extension icon to see Bot Detection section" -ForegroundColor White
Write-Host "3. Test with Selenium/Puppeteer" -ForegroundColor White
Write-Host ""
