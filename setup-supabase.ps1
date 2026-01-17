# Quick Setup Script for Supabase

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Supabase Database Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
$envFile = ".env.local"

if (Test-Path $envFile) {
    Write-Host "✓ .env.local file exists" -ForegroundColor Green
    Write-Host ""
    Write-Host "Current content:" -ForegroundColor Yellow
    Get-Content $envFile
    Write-Host ""
    
    $overwrite = Read-Host "Do you want to update it? (y/n)"
    if ($overwrite -ne 'y') {
        Write-Host "Keeping existing .env.local" -ForegroundColor Yellow
        exit 0
    }
} else {
    Write-Host "Creating .env.local file..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Supabase connection string:" -ForegroundColor Yellow
Write-Host "`npostgresql://postgres.gzirayzxakflvaemvuhx:[YOUR-PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres`n" -ForegroundColor White
Write-Host ""
Write-Host "To get your password:" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard" -ForegroundColor White
Write-Host "2. Select your project" -ForegroundColor White
Write-Host "3. Settings → Database" -ForegroundColor White
Write-Host "4. Connection String → Transaction mode" -ForegroundColor White
Write-Host "5. Copy your password" -ForegroundColor White
Write-Host "" 

$password = Read-Host "Enter your Supabase database password"

if ([string]::IsNullOrWhiteSpace($password)) {
    Write-Host "❌ Password cannot be empty" -ForegroundColor Red
    exit 1
}

# Create the connection string
$connectionString = "postgresql://postgres.gzirayzxakflvaemvuhx:$password@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

# Write to .env.local
@"
DATABASE_URL=$connectionString
"@ | Out-File -FilePath $envFile -Encoding UTF8

Write-Host ""
Write-Host "✓ .env.local file created/updated!" -ForegroundColor Green
Write-Host ""
Write-Host "Testing connection..." -ForegroundColor Yellow

# Test connection
try {
    $env:DATABASE_URL = $connectionString
    $testResult = node -e "import('@neondatabase/serverless').then(async ({ neon }) => { const sql = neon(process.env.DATABASE_URL); const result = await sql``SELECT NOW()``; console.log('Connected at:', result[0].now); }).catch(err => { console.error('Connection failed:', err.message); process.exit(1); })"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Database connection successful!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Next steps:" -ForegroundColor Yellow
        Write-Host "1. Run migration: node scripts/run-botd-migration.js" -ForegroundColor White
        Write-Host "2. Start server: npm run dev" -ForegroundColor White
        Write-Host "3. Load extension in Chrome" -ForegroundColor White
    } else {
        Write-Host "❌ Connection test failed" -ForegroundColor Red
        Write-Host "Please check your password and try again" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not test connection automatically" -ForegroundColor Yellow
    Write-Host "Please run: node scripts/run-botd-migration.js" -ForegroundColor White
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
