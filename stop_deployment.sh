#!/bin/bash

# Stop Pharmacy Revenue Management System Services

echo "🛑 Stopping Pharmacy Revenue Management System..."

# Kill backend processes
echo "🔄 Stopping backend..."
pkill -f "uvicorn" 2>/dev/null || true
if [ -f "BABL-WORK/backend/uvicorn.pid" ]; then
    kill $(cat BABL-WORK/backend/uvicorn.pid) 2>/dev/null || true
    rm BABL-WORK/backend/uvicorn.pid 2>/dev/null || true
fi

# Kill frontend processes
echo "🔄 Stopping frontend..."
pkill -f "react-scripts" 2>/dev/null || true
pkill -f "npm start" 2>/dev/null || true
if [ -f "BABL-WORK/frontend/npm.pid" ]; then
    kill $(cat BABL-WORK/frontend/npm.pid) 2>/dev/null || true
    rm BABL-WORK/frontend/npm.pid 2>/dev/null || true
fi

sleep 2

echo "✅ All services stopped"

