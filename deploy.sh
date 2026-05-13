#!/bin/bash
# ──────────────────────────────────────────────────────────────────────
# deploy.sh — Deploy VibeStump to Google Cloud Run
#
# Usage (from Google Cloud Shell or any bash terminal):
#   bash deploy.sh                     Deploy backend + frontend
#   bash deploy.sh --backend-only      Deploy backend only
#   bash deploy.sh --frontend-only     Deploy frontend only
# ──────────────────────────────────────────────────────────────────────
set -e

REGION="${GCP_REGION:-asia-south1}"

# ── Prompt for API key if not set ────────────────────────────────────
if [ -z "$GEMINI_API_KEY" ]; then
    if [ -f .env ]; then
        export $(grep -v '^#' .env | grep -v '^\s*$' | xargs)
    fi
fi

if [ -z "$GEMINI_API_KEY" ]; then
    echo ""
    read -rp "Enter your GEMINI_API_KEY: " GEMINI_API_KEY
    export GEMINI_API_KEY
fi

echo "[OK] GEMINI_API_KEY is set"

# ── Check gcloud ─────────────────────────────────────────────────────
PROJECT=$(gcloud config get-value project 2>/dev/null)
if [ -z "$PROJECT" ]; then
    echo "[ERROR] No GCP project set."
    echo "  Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi
echo "[OK] GCP Project: $PROJECT"
echo "[OK] Region: $REGION"

# ══════════════════════════════════════════════════════════════════════
deploy_backend() {
    echo ""
    echo "--- Deploying Backend ---"

    ENV_VARS="GEMINI_API_KEY=${GEMINI_API_KEY}"
    [ -n "$YOUTUBE_API_KEY" ] && ENV_VARS="${ENV_VARS},YOUTUBE_API_KEY=${YOUTUBE_API_KEY}"
    [ -n "$RAPIDAPI_KEY" ]    && ENV_VARS="${ENV_VARS},RAPIDAPI_KEY=${RAPIDAPI_KEY}"

    gcloud run deploy vibestump-api \
        --source ./backend \
        --port 8000 \
        --region "$REGION" \
        --set-env-vars "$ENV_VARS" \
        --memory 512Mi \
        --allow-unauthenticated \
        --quiet

    BACKEND_URL=$(gcloud run services describe vibestump-api \
        --region "$REGION" --format 'value(status.url)')
    echo "$BACKEND_URL" > .backend_url
    echo "[OK] Backend live: $BACKEND_URL"
}

deploy_frontend() {
    echo ""
    echo "--- Deploying Frontend ---"

    if [ -f .backend_url ]; then
        BACKEND_URL=$(cat .backend_url)
    else
        BACKEND_URL=$(gcloud run services describe vibestump-api \
            --region "$REGION" --format 'value(status.url)' 2>/dev/null || echo "")
    fi

    if [ -z "$BACKEND_URL" ]; then
        echo "[ERROR] Backend not deployed. Run: bash deploy.sh --backend-only"
        exit 1
    fi

    echo "[OK] Using backend: $BACKEND_URL"

    gcloud run deploy vibestump-ui \
        --source ./frontend \
        --port 3000 \
        --region "$REGION" \
        --set-env-vars "NEXT_PUBLIC_API_URL=$BACKEND_URL" \
        --memory 512Mi \
        --allow-unauthenticated \
        --quiet

    FRONTEND_URL=$(gcloud run services describe vibestump-ui \
        --region "$REGION" --format 'value(status.url)')

    echo ""
    echo "=================================================="
    echo "  VIBESTUMP IS LIVE!"
    echo "  App:      $FRONTEND_URL"
    echo "  API:      $BACKEND_URL"
    echo "  API Docs: $BACKEND_URL/docs"
    echo "=================================================="
}

# ══════════════════════════════════════════════════════════════════════
case "${1:-all}" in
    --backend-only)   deploy_backend ;;
    --frontend-only)  deploy_frontend ;;
    *)                deploy_backend; deploy_frontend ;;
esac
