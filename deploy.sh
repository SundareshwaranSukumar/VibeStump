#!/bin/bash
# ──────────────────────────────────────────────────────────────────────
# deploy.sh — VibeStump deploy script
#
# LOCAL COMMANDS:
#   bash deploy.sh local              Full local setup (deps + build)
#   bash deploy.sh start              Start both backend + frontend
#   bash deploy.sh local-backend      Setup backend only (deps + DB)
#   bash deploy.sh local-frontend     Setup + build frontend only
#
# GCLOUD COMMANDS:
#   bash deploy.sh setup              First-time deploy to GCloud
#   bash deploy.sh backend            Rebuild backend only (~2 min)
#   bash deploy.sh frontend           Rebuild frontend only (~2 min)
#   bash deploy.sh env                Update env vars only (instant)
#   bash deploy.sh status             Show live URLs and status
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
    [ -n "$TENOR_API_KEY" ]   && vars="${vars},TENOR_API_KEY=${TENOR_API_KEY}"
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
#  LOCAL — Install dependencies and run locally on Ubuntu
# ══════════════════════════════════════════════════════════════════════
cmd_local() {
    echo ""
    echo "══════════════════════════════════════════════"
    echo "  VibeStump — Local Ubuntu Setup"
    echo "══════════════════════════════════════════════"
    echo ""

    # Check/install Python
    if ! command -v python3 &> /dev/null; then
        echo "[INSTALL] Python 3..."
        sudo apt-get update && sudo apt-get install -y python3 python3-pip python3-venv
    fi
    echo "[OK] Python: $(python3 --version)"

    # Check/install Node.js
    if ! command -v node &> /dev/null; then
        echo "[INSTALL] Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    echo "[OK] Node.js: $(node --version)"
    echo "[OK] npm: $(npm --version)"

    # Load environment variables
    load_env

    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        echo "GEMINI_API_KEY=${GEMINI_API_KEY}" > .env
        [ -n "$YOUTUBE_API_KEY" ] && echo "YOUTUBE_API_KEY=${YOUTUBE_API_KEY}" >> .env
        [ -n "$TENOR_API_KEY" ] && echo "TENOR_API_KEY=${TENOR_API_KEY}" >> .env
        echo "[OK] Created .env file"
    fi

    # Backend setup
    echo ""
    echo "--- Backend Setup ---"
    cd backend
    python3 -m venv venv 2>/dev/null || true
    source venv/bin/activate
    pip install -r requirements.txt --quiet --prefer-binary \
        --trusted-host pypi.org --trusted-host pypi.python.org \
        --trusted-host files.pythonhosted.org 2>/dev/null \
        || pip install -r requirements.txt --quiet 2>/dev/null \
        || echo "[WARN] pip install failed — using cached packages"
    echo "[OK] Backend dependencies installed"

    # Initialize DB schema only — agents fetch real data on startup
    python3 -c "
from database import init_db
from seed import run_seed
init_db()
run_seed()
print('[OK] Database schema initialized')
    "
    cd ..

    # Frontend setup + build
    echo ""
    echo "--- Frontend Setup ---"
    cd frontend
    # Try npm install; prefer cached packages in offline/restricted networks
    npm install --silent --prefer-offline 2>/dev/null \
        || npm install --silent 2>/dev/null \
        || echo "[WARN] npm install failed — using existing node_modules"
    echo "[OK] Frontend dependencies installed"
    echo "[BUILD] Building frontend (this takes ~20s)..."
    npm run build
    # Copy static assets required by standalone server
    cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
    cp -r public .next/standalone/public 2>/dev/null || true
    echo "[OK] Frontend built and ready"
    cd ..

    echo ""
    echo "══════════════════════════════════════════════"
    echo "  Setup Complete!"
    echo ""
    echo "  To start both services:"
    echo "    bash deploy.sh start"
    echo ""
    echo "  Or start manually:"
    echo "  Terminal 1 (Backend):"
    echo "    cd backend && source venv/bin/activate"
    echo "    uvicorn main:app --host 0.0.0.0 --port 8000"
    echo ""
    echo "  Terminal 2 (Frontend):"
    echo "    cd frontend && node .next/standalone/server.js"
    echo ""
    echo "  Then open: http://localhost:3000"
    echo "══════════════════════════════════════════════"
}

# ══════════════════════════════════════════════════════════════════════
#  LOCAL-BACKEND — Install backend dependencies only (local)
# ══════════════════════════════════════════════════════════════════════
cmd_local_backend() {
    echo ""
    echo "══════════════════════════════════════════════"
    echo "  VibeStump — Local Backend Setup"
    echo "══════════════════════════════════════════════"
    echo ""

    # Check/install Python
    if ! command -v python3 &> /dev/null; then
        echo "[INSTALL] Python 3..."
        sudo apt-get update && sudo apt-get install -y python3 python3-pip python3-venv
    fi
    echo "[OK] Python: $(python3 --version)"

    # Load environment variables
    load_env

    # Create .env if it doesn't exist
    if [ ! -f .env ]; then
        echo "GEMINI_API_KEY=${GEMINI_API_KEY}" > .env
        [ -n "$YOUTUBE_API_KEY" ] && echo "YOUTUBE_API_KEY=${YOUTUBE_API_KEY}" >> .env
        [ -n "$TENOR_API_KEY" ] && echo "TENOR_API_KEY=${TENOR_API_KEY}" >> .env
        echo "[OK] Created .env file"
    fi

    # Backend setup
    echo ""
    echo "--- Backend Setup ---"
    cd backend
    python3 -m venv venv 2>/dev/null || true
    source venv/bin/activate
    pip install -r requirements.txt --quiet --prefer-binary \
        --trusted-host pypi.org --trusted-host pypi.python.org \
        --trusted-host files.pythonhosted.org 2>/dev/null \
        || pip install -r requirements.txt --quiet 2>/dev/null \
        || echo "[WARN] pip install failed — using cached packages"
    echo "[OK] Backend dependencies installed"

    # Initialize DB schema only — agents fetch real data on startup
    python3 -c "
from database import init_db
from seed import run_seed
init_db()
run_seed()
print('[OK] Database schema initialized')
    "
    cd ..

    echo ""
    echo "══════════════════════════════════════════════"
    echo "  Backend Setup Complete! To start:"
    echo ""
    echo "    cd backend && source venv/bin/activate"
    echo "    uvicorn main:app --host 0.0.0.0 --port 8000 --reload"
    echo ""
    echo "  API docs will be at: http://localhost:8000/docs"
    echo "══════════════════════════════════════════════"
}

# ══════════════════════════════════════════════════════════════════════
#  LOCAL-FRONTEND — Install frontend dependencies only (local)
# ══════════════════════════════════════════════════════════════════════
cmd_local_frontend() {
    echo ""
    echo "══════════════════════════════════════════════"
    echo "  VibeStump — Local Frontend Setup"
    echo "══════════════════════════════════════════════"
    echo ""

    # Check/install Node.js
    if ! command -v node &> /dev/null; then
        echo "[INSTALL] Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
        sudo apt-get install -y nodejs
    fi
    echo "[OK] Node.js: $(node --version)"
    echo "[OK] npm: $(npm --version)"

    # Frontend setup
    echo ""
    echo "--- Frontend Setup ---"
    cd frontend
    npm install --silent --prefer-offline 2>/dev/null \
        || npm install --silent 2>/dev/null \
        || echo "[WARN] npm install failed — using existing node_modules"
    echo "[OK] Frontend dependencies installed"
    echo "[BUILD] Building frontend (this takes ~20s)..."
    npm run build
    # Copy static assets required by standalone server
    cp -r .next/static .next/standalone/.next/static 2>/dev/null || true
    cp -r public .next/standalone/public 2>/dev/null || true
    echo "[OK] Frontend built and ready"
    cd ..

    echo ""
    echo "══════════════════════════════════════════════"
    echo "  Frontend Setup Complete! To start:"
    echo ""
    echo "    cd frontend && node .next/standalone/server.js"
    echo ""
    echo "  Make sure backend is running on http://localhost:8000"
    echo "  Then open app at: http://localhost:3000"
    echo "══════════════════════════════════════════════"
}

# ══════════════════════════════════════════════════════════════════════
#  START — Start backend + frontend locally (after setup)
# ══════════════════════════════════════════════════════════════════════
cmd_start() {
    echo ""
    echo "══════════════════════════════════════════════"
    echo "  VibeStump — Starting Services"
    echo "══════════════════════════════════════════════"
    echo ""

    # Verify backend is set up
    if [ ! -d "backend/venv" ]; then
        echo "[ERROR] Backend not set up. Run: bash deploy.sh local"
        exit 1
    fi

    # Verify frontend is built
    if [ ! -f "frontend/.next/standalone/server.js" ]; then
        echo "[ERROR] Frontend not built. Run: bash deploy.sh local"
        exit 1
    fi

    # Load env
    load_env

    # Kill any existing processes on those ports
    pkill -f "uvicorn main" 2>/dev/null || true
    pkill -f "standalone/server.js" 2>/dev/null || true
    fuser -k 8000/tcp 2>/dev/null || kill $(lsof -ti:8000) 2>/dev/null || true
    fuser -k 3000/tcp 2>/dev/null || kill $(lsof -ti:3000) 2>/dev/null || true
    sleep 2

    # Start backend (with env vars)
    echo "[START] Backend on http://localhost:8000 ..."
    cd backend
    source venv/bin/activate
    nohup env GEMINI_API_KEY="$GEMINI_API_KEY" YOUTUBE_API_KEY="$YOUTUBE_API_KEY" TENOR_API_KEY="$TENOR_API_KEY" \
        uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/vibestump-backend.log 2>&1 &
    BACKEND_PID=$!
    cd ..
    echo "[OK] Backend started (PID: $BACKEND_PID)"

    # Wait for backend to be ready
    echo "[WAIT] Waiting for backend..."
    for i in $(seq 1 15); do
        if curl -sf http://localhost:8000/ > /dev/null 2>&1; then
            echo "[OK] Backend is ready"
            break
        fi
        sleep 1
    done

    # Start frontend (next start handles static file serving locally)
    echo "[START] Frontend on http://localhost:3000 ..."
    cd frontend
    nohup npm start > /tmp/vibestump-frontend.log 2>&1 &
    FRONTEND_PID=$!
    cd ..
    echo "[OK] Frontend started (PID: $FRONTEND_PID)"

    # Wait for frontend to be ready
    echo "[WAIT] Waiting for frontend..."
    for i in $(seq 1 15); do
        if curl -sf http://localhost:3000/ > /dev/null 2>&1; then
            echo "[OK] Frontend is ready"
            break
        fi
        sleep 1
    done

    echo ""
    echo "══════════════════════════════════════════════"
    echo "  VibeStump is running!"
    echo ""
    echo "  App:      http://localhost:3000"
    echo "  API:      http://localhost:8000"
    echo "  API Docs: http://localhost:8000/docs"
    echo ""
    echo "  Logs:"
    echo "    Backend:  tail -f /tmp/vibestump-backend.log"
    echo "    Frontend: tail -f /tmp/vibestump-frontend.log"
    echo ""
    echo "  To stop: pkill -f 'uvicorn main' && pkill -f 'standalone/server.js'"
    echo "══════════════════════════════════════════════"
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
    local)           cmd_local ;;
    start)           cmd_start ;;
    local-backend)   cmd_local_backend ;;
    local-frontend)  cmd_local_frontend ;;
    setup)           cmd_setup ;;
    backend)         cmd_backend ;;
    frontend)        cmd_frontend ;;
    env)             cmd_env ;;
    status)          cmd_status ;;
    *)
        echo ""
        echo "  VibeStump Deploy Script"
        echo ""
        echo "  LOCAL SETUP (Ubuntu):"
        echo "    bash deploy.sh local           Full setup (both backend + frontend)"
        echo "    bash deploy.sh start           Start both services (after setup)"
        echo "    bash deploy.sh local-backend   Backend only (Python + deps + DB)"
        echo "    bash deploy.sh local-frontend  Frontend only (Node.js + build)"
        echo ""
        echo "  GCLOUD SETUP:"
        echo "    bash deploy.sh setup           First-time deploy to Cloud Run"
        echo ""
        echo "  GCLOUD UPDATES:"
        echo "    bash deploy.sh backend         Rebuild backend only (~2 min)"
        echo "    bash deploy.sh frontend        Rebuild frontend only (~2 min)"
        echo "    bash deploy.sh env             Update env vars only (instant)"
        echo ""
        echo "  INFO:"
        echo "    bash deploy.sh status          Show live URLs"
        echo ""
        ;;
esac
