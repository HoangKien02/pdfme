#!/bin/bash

# PDF Generation API - Quick Start Script
# Use this to start the server quickly after setup

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

echo "🚀 PDF Generation API - Quick Start"
echo "=================================="

# Check if setup was completed
if [[ ! -d "fonts" ]] || [[ ! -f "fonts/NotoSansJP.ttf" ]]; then
    print_error "Setup not completed! Please run setup first:"
    echo ""
    echo "  ./setup.sh"
    echo ""
    exit 1
fi

# Check if dependencies are installed
if [[ ! -d "node_modules" ]]; then
    print_error "Dependencies not installed! Please run setup first:"
    echo ""
    echo "  ./setup.sh"
    echo ""
    exit 1
fi

# Check if port is available
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null; then
    print_error "Port 3001 is already in use!"
    echo ""
    echo "Stop the existing server first:"
    echo "  lsof -ti:3001 | xargs kill -9"
    echo ""
    exit 1
fi

print_status "Starting PDF Generation API server..."
print_status "Server will be available at: http://localhost:3001"
echo ""
print_success "✅ Ready! Press Ctrl+C to stop the server"
echo ""

# Start server
exec node server.js
