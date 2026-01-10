#!/bin/bash

# Pharmacy Revenue Management System - Deployment Script
# This script sets up and deploys the full-stack application

set -e  # Exit on error

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$SCRIPT_DIR/BABL-WORK"
BACKEND_DIR="$REPO_DIR/backend"
FRONTEND_DIR="$REPO_DIR/frontend"

echo "🚀 Starting Pharmacy Revenue Management System Deployment..."
echo ""

# Check if repository exists
if [ ! -d "$REPO_DIR" ]; then
    echo "❌ Repository not found. Please clone it first."
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists python3; then
    echo "❌ Python 3 is not installed. Please install Python 3.9+ first."
    exit 1
fi

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Kill any existing processes
echo "🔄 Stopping existing processes..."
pkill -f "uvicorn" 2>/dev/null || true
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
sleep 2

# Backend Setup
echo "🐍 Setting up Backend (Python/FastAPI)..."
cd "$BACKEND_DIR"

# Determine best Python version to use
PYTHON_CMD="python3"
if command_exists python3.11; then
    PYTHON_VERSION=$(python3.11 --version 2>&1 | grep -oP '\d+\.\d+' | head -1)
    PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d'.' -f2)
    if [ "$PYTHON_MINOR" -ge 11 ]; then
        PYTHON_CMD="python3.11"
        echo "✅ Using Python 3.11 for better compatibility"
    fi
else
    CURRENT_VERSION=$(python3 --version 2>&1 | grep -oP '\d+\.\d+' | head -1)
    CURRENT_MINOR=$(echo $CURRENT_VERSION | cut -d'.' -f2)
    if [ "$CURRENT_MINOR" -ge 13 ]; then
        echo "⚠️  Python 3.13+ detected. Some packages may need updates."
    fi
fi

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "📦 Creating Python virtual environment with $PYTHON_CMD..."
    $PYTHON_CMD -m venv venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
if [ -f "requirements.txt" ]; then
    echo "📥 Installing Python dependencies..."
    pip install --upgrade pip
    pip install -r requirements.txt
else
    echo "⚠️  requirements.txt not found. Installing common FastAPI dependencies..."
    pip install --upgrade pip
    pip install fastapi uvicorn sqlalchemy python-multipart pandas openpyxl python-jose[cryptography] passlib[bcrypt] python-dotenv
fi

# Start backend
echo "🚀 Starting Backend server..."
nohup $PYTHON_CMD -m uvicorn app.main_complete:app --host 127.0.0.1 --port 8000 --reload > uvicorn.log 2>&1 &
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
    if [ $i -eq 30 ]; then
        echo "⚠️  Backend may still be starting. Check logs at $BACKEND_DIR/uvicorn.log"
    fi
    sleep 1
done

# Frontend Setup
echo ""
echo "⚛️  Setting up Frontend (React)..."
cd "$FRONTEND_DIR"

# Install dependencies
if [ -f "package.json" ]; then
    if [ ! -d "node_modules" ]; then
        echo "📥 Installing Node.js dependencies..."
        npm install
    else
        echo "✅ Node modules already installed"
    fi
else
    echo "❌ package.json not found in frontend directory"
    exit 1
fi

# Start frontend
echo "🚀 Starting Frontend server..."
nohup npm start > npm.log 2>&1 &
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
    if [ $i -eq 60 ]; then
        echo "⚠️  Frontend may still be starting. Check logs at $FRONTEND_DIR/npm.log"
    fi
    sleep 1
done

echo ""
echo "🎉 Deployment Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://127.0.0.1:8000"
echo "📚 API Docs: http://127.0.0.1:8000/docs"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🔑 Default Login Credentials:"
echo "   Super Admin: admin / admin123"
echo "   Admin: manager / manager123"
echo "   User: user / user123"
echo ""
echo "📝 To stop services, run: ./stop_deployment.sh"
echo "📋 Backend logs: tail -f $BACKEND_DIR/uvicorn.log"
echo "📋 Frontend logs: tail -f $FRONTEND_DIR/npm.log"
echo ""

