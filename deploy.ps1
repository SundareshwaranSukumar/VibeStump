# ──────────────────────────────────────────────────────────────────────
# deploy.ps1 — Deploy VibeStump to Google Cloud Run
#
# Usage:
#   .\deploy.ps1                  → Deploy everything (backend + frontend)
#   .\deploy.ps1 -BackendOnly     → Deploy backend only
#   .\deploy.ps1 -FrontendOnly    → Deploy frontend only
# ──────────────────────────────────────────────────────────────────────

param(
    [switch]$BackendOnly,
    [switch]$FrontendOnly
)

$ErrorActionPreference = "Stop"
$Region = "asia-south1"

# ── Load .env ────────────────────────────────────────────────────────
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), "Process")
        }
    }
    Write-Host "[OK] Loaded .env" -ForegroundColor Green
}

# ── Preflight ────────────────────────────────────────────────────────
try { gcloud version 2>$null | Out-Null } catch {
    Write-Host "[ERROR] gcloud CLI not found. Install from https://cloud.google.com/sdk" -ForegroundColor Red
    exit 1
}

$project = gcloud config get-value project 2>$null
if (-not $project) {
    Write-Host "[ERROR] No GCP project set. Run: gcloud config set project YOUR_PROJECT_ID" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] GCP Project: $project" -ForegroundColor Cyan

# ══════════════════════════════════════════════════════════════════════
#  BACKEND
# ══════════════════════════════════════════════════════════════════════
function Deploy-Backend {
    Write-Host "`n--- Deploying Backend ---" -ForegroundColor Cyan

    $envVars = "GEMINI_API_KEY=$($env:GEMINI_API_KEY)"
    if ($env:YOUTUBE_API_KEY) { $envVars += ",YOUTUBE_API_KEY=$($env:YOUTUBE_API_KEY)" }
    if ($env:RAPIDAPI_KEY)    { $envVars += ",RAPIDAPI_KEY=$($env:RAPIDAPI_KEY)" }

    gcloud run deploy vibestump-api `
        --source ./backend `
        --port 8000 `
        --region $Region `
        --set-env-vars $envVars `
        --memory 512Mi `
        --allow-unauthenticated `
        --quiet

    $url = gcloud run services describe vibestump-api --region $Region --format "value(status.url)"
    $url | Out-File -FilePath ".backend_url" -Encoding utf8 -NoNewline
    Write-Host "[OK] Backend live: $url" -ForegroundColor Green
    return $url
}

# ══════════════════════════════════════════════════════════════════════
#  FRONTEND
# ══════════════════════════════════════════════════════════════════════
function Deploy-Frontend {
    Write-Host "`n--- Deploying Frontend ---" -ForegroundColor Cyan

    # Get backend URL
    $backendUrl = ""
    if (Test-Path ".backend_url") {
        $backendUrl = (Get-Content ".backend_url" -Raw).Trim()
    } else {
        $backendUrl = gcloud run services describe vibestump-api --region $Region --format "value(status.url)" 2>$null
    }
    if (-not $backendUrl) {
        Write-Host "[ERROR] Backend not deployed yet. Run: .\deploy.ps1 -BackendOnly" -ForegroundColor Red
        exit 1
    }

    gcloud run deploy vibestump-ui `
        --source ./frontend `
        --port 3000 `
        --region $Region `
        --set-env-vars "NEXT_PUBLIC_API_URL=$backendUrl" `
        --memory 512Mi `
        --allow-unauthenticated `
        --quiet

    $url = gcloud run services describe vibestump-ui --region $Region --format "value(status.url)"

    Write-Host "`n" -NoNewline
    Write-Host "==================================================" -ForegroundColor Green
    Write-Host "  VIBESTUMP IS LIVE!" -ForegroundColor Green
    Write-Host "  App:      $url" -ForegroundColor Green
    Write-Host "  API:      $backendUrl" -ForegroundColor Green
    Write-Host "  API Docs: $backendUrl/docs" -ForegroundColor Green
    Write-Host "==================================================" -ForegroundColor Green
}

# ══════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════
if ($BackendOnly)       { Deploy-Backend }
elseif ($FrontendOnly)  { Deploy-Frontend }
else                    { Deploy-Backend; Deploy-Frontend }
