#!/bin/bash

# Deployment script for Pharmacy Revenue Management System
# Deploys backend on port 8000 and frontend on port 3000

echo "🚀 Starting Pharmacy Revenue Management System..."
echo "📍 Deploying to localhost:3000 (frontend) and localhost:8000 (backend)"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Kill any existing processes
echo "🔄 Stopping existing processes..."
pkill -f "uvicorn.*main_complete" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
sleep 2

# Start Backend
echo "🐍 Starting Backend (Python/FastAPI) on port 8000..."
cd "$BACKEND_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install dependencies if needed
if [ ! -f "venv/.deps_installed" ]; then
    echo "📦 Installing backend dependencies..."
    pip install -r requirements.txt
    touch venv/.deps_installed
fi

# Start backend in background
nohup python3 -m uvicorn app.main_complete:app --host 127.0.0.1 --port 8000 --reload > uvicorn.log 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > uvicorn.pid
echo "✅ Backend started with PID: $BACKEND_PID"

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
for i in {1..30}; do
    if curl -s http://127.0.0.1:8000/docs >/dev/null 2>&1; then
        echo "✅ Backend is ready!"
        break
    fi
    sleep 1
done

# Start Frontend
echo "⚛️  Starting Frontend (React) on port 3000..."
cd "$FRONTEND_DIR"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

# Start frontend in background
PORT=3000 nohup npm start > npm.log 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > npm.pid
echo "✅ Frontend started with PID: $FRONTEND_PID"

# Wait for frontend to be ready
echo "⏳ Waiting for frontend to be ready..."
for i in {1..60}; do
    if curl -s http://localhost:3000 >/dev/null 2>&1; then
        echo "✅ Frontend is ready!"
        break
    fi
    sleep 1
done

echo ""
echo "🎉 System is ready!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://127.0.0.1:8000"
echo "📚 API Docs: http://127.0.0.1:8000/docs"
echo ""
echo "🔑 Login Credentials:"
echo "   Username: admin"
echo "   Password: admin123"
echo ""
echo "To stop services, run: pkill -f 'uvicorn.*main_complete' && pkill -f 'react-scripts'"
echo "Or use: ./stop_deployment.sh"
echo ""
