#!/bin/bash

# Stop deployment script for Pharmacy Revenue Management System

echo "🛑 Stopping Pharmacy Revenue Management System..."

# Kill backend processes
echo "🔄 Stopping backend..."
pkill -f "uvicorn.*main_complete" 2>/dev/null && echo "✅ Backend stopped" || echo "⚠️  No backend process found"

# Kill frontend processes
echo "🔄 Stopping frontend..."
pkill -f "react-scripts" 2>/dev/null && echo "✅ Frontend stopped" || echo "⚠️  No frontend process found"

# Clean up PID files
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
rm -f "$SCRIPT_DIR/backend/uvicorn.pid" 2>/dev/null
rm -f "$SCRIPT_DIR/frontend/npm.pid" 2>/dev/null

echo "✅ All services stopped!"
