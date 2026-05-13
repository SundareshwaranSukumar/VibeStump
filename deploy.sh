#!/bin/bash
# ──────────────────────────────────────────────────────────────────────
# deploy.sh — VibeStump deploy & update script for Google Cloud Run
#
# Commands:
#   bash deploy.sh setup       First-time: build + deploy both services
#   bash deploy.sh backend     Rebuild & update backend only (~2 min)
#   bash deploy.sh frontend    Rebuild & update frontend only (~2 min)
#   bash deploy.sh env         Update env vars without rebuilding (instant)
#   bash deploy.sh status      Show live URLs and service status
# ──────────────────────────────────────────────────────────────────────
set -e

REGION="${GCP_REGION:-asia-south1}"
BACKEND="vibestump-api"
FRONTEND="vibestump-ui"

# ── Load .env ────────────────────────────────────────────────────────
load_env() {
    if [ -f .env ]; then
        export $(grep -v '^#' .env | grep -v '^\s*$' | xargs)
        echo "[OK] Loaded .env"
    fi
    if [ -z "$GEMINI_API_KEY" ]; then
        read -rp "Enter GEMINI_API_KEY: " GEMINI_API_KEY
        export GEMINI_API_KEY
    fi
}

# ── Build env-vars string ────────────────────────────────────────────
build_env_string() {
    local vars="GEMINI_API_KEY=${GEMINI_API_KEY}"
    [ -n "$YOUTUBE_API_KEY" ] && vars="${vars},YOUTUBE_API_KEY=${YOUTUBE_API_KEY}"
    [ -n "$RAPIDAPI_KEY" ]    && vars="${vars},RAPIDAPI_KEY=${RAPIDAPI_KEY}"
    echo "$vars"
}

# ── Get backend URL ──────────────────────────────────────────────────
get_backend_url() {
    if [ -f .backend_url ]; then
        cat .backend_url
    else
        gcloud run services describe "$BACKEND" \
            --region "$REGION" --format 'value(status.url)' 2>/dev/null || echo ""
    fi
}

# ══════════════════════════════════════════════════════════════════════
#  SETUP — First-time full deploy
# ══════════════════════════════════════════════════════════════════════
cmd_setup() {
    load_env
    PROJECT=$(gcloud config get-value project 2>/dev/null)
    echo "[OK] Project: $PROJECT | Region: $REGION"

    echo ""
    echo "--- [1/2] Deploying Backend ---"
    gcloud run deploy "$BACKEND" \
        --source ./backend \
        --port 8000 \
        --region "$REGION" \
        --set-env-vars "$(build_env_string)" \
        --memory 512Mi \
        --allow-unauthenticated \
        --quiet

    BACKEND_URL=$(gcloud run services describe "$BACKEND" \
        --region "$REGION" --format 'value(status.url)')
    echo "$BACKEND_URL" > .backend_url
    echo "[OK] Backend: $BACKEND_URL"

    echo ""
    echo "--- [2/2] Deploying Frontend ---"
    gcloud run deploy "$FRONTEND" \
        --source ./frontend \
        --port 3000 \
        --region "$REGION" \
        --set-env-vars "API_URL=$BACKEND_URL" \
        --memory 512Mi \
        --allow-unauthenticated \
        --quiet

    FRONTEND_URL=$(gcloud run services describe "$FRONTEND" \
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
#  BACKEND — Rebuild and redeploy backend only (fast, uses build cache)
# ══════════════════════════════════════════════════════════════════════
cmd_backend() {
    load_env
    echo "--- Updating Backend (uses build cache) ---"
    gcloud run deploy "$BACKEND" \
        --source ./backend \
        --port 8000 \
        --region "$REGION" \
        --set-env-vars "$(build_env_string)" \
        --memory 512Mi \
        --allow-unauthenticated \
        --quiet

    URL=$(gcloud run services describe "$BACKEND" \
        --region "$REGION" --format 'value(status.url)')
    echo "$URL" > .backend_url
    echo "[OK] Backend updated: $URL"
}

# ══════════════════════════════════════════════════════════════════════
#  FRONTEND — Rebuild and redeploy frontend only
# ══════════════════════════════════════════════════════════════════════
cmd_frontend() {
    BACKEND_URL=$(get_backend_url)
    if [ -z "$BACKEND_URL" ]; then
        echo "[ERROR] Backend URL not found. Run: bash deploy.sh setup"
        exit 1
    fi

    echo "--- Updating Frontend (uses build cache) ---"
    gcloud run deploy "$FRONTEND" \
        --source ./frontend \
        --port 3000 \
        --region "$REGION" \
        --set-env-vars "API_URL=$BACKEND_URL" \
        --memory 512Mi \
        --allow-unauthenticated \
        --quiet

    URL=$(gcloud run services describe "$FRONTEND" \
        --region "$REGION" --format 'value(status.url)')
    echo "[OK] Frontend updated: $URL"
}

# ══════════════════════════════════════════════════════════════════════
#  ENV — Update environment variables without rebuilding (instant)
# ══════════════════════════════════════════════════════════════════════
cmd_env() {
    load_env
    echo "--- Updating env vars (no rebuild, instant) ---"

    gcloud run services update "$BACKEND" \
        --region "$REGION" \
        --update-env-vars "$(build_env_string)" \
        --quiet
    echo "[OK] Backend env updated"

    BACKEND_URL=$(get_backend_url)
    if [ -n "$BACKEND_URL" ]; then
        gcloud run services update "$FRONTEND" \
            --region "$REGION" \
            --update-env-vars "API_URL=$BACKEND_URL" \
            --quiet
        echo "[OK] Frontend env updated"
    fi

    echo "[OK] Done — new env vars are live (no rebuild needed)"
}

# ══════════════════════════════════════════════════════════════════════
#  STATUS — Show current deployment info
# ══════════════════════════════════════════════════════════════════════
cmd_status() {
    echo ""
    echo "--- VibeStump Status ---"
    echo ""

    BURL=$(gcloud run services describe "$BACKEND" \
        --region "$REGION" --format 'value(status.url)' 2>/dev/null || echo "NOT DEPLOYED")
    FURL=$(gcloud run services describe "$FRONTEND" \
        --region "$REGION" --format 'value(status.url)' 2>/dev/null || echo "NOT DEPLOYED")

    echo "  Backend:  $BURL"
    echo "  Frontend: $FURL"
    [ "$BURL" != "NOT DEPLOYED" ] && echo "  API Docs: $BURL/docs"
    echo ""
}

# ══════════════════════════════════════════════════════════════════════
#  MAIN
# ══════════════════════════════════════════════════════════════════════
case "${1:-help}" in
    setup)    cmd_setup ;;
    backend)  cmd_backend ;;
    frontend) cmd_frontend ;;
    env)      cmd_env ;;
    status)   cmd_status ;;
    *)
        echo ""
        echo "  VibeStump Deploy Script"
        echo ""
        echo "  FIRST TIME:"
        echo "    bash deploy.sh setup       Build + deploy everything"
        echo ""
        echo "  AFTER CHANGES:"
        echo "    bash deploy.sh backend     Rebuild backend only (~2 min)"
        echo "    bash deploy.sh frontend    Rebuild frontend only (~2 min)"
        echo "    bash deploy.sh env         Update API keys only (instant)"
        echo ""
        echo "  INFO:"
        echo "    bash deploy.sh status      Show live URLs"
        echo ""
        echo "  The build cache is used automatically — subsequent"
        echo "  deploys are much faster than the first one."
        echo ""
        ;;
esac
