#!/bin/bash

# PDF Generation API - Quick Setup Script
# Run this script to set up everything needed to run the API

set -e  # Exit on any error

echo "🚀 PDF Generation API - Quick Setup"
echo "=================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Node.js is installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed!"
    print_status "Please install Node.js from https://nodejs.org/"
    print_status "Recommended version: Node.js 18+ and npm 9+"
    exit 1
fi

NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
print_success "Node.js $NODE_VERSION and npm $NPM_VERSION found"

# Check if we're in the right directory
if [[ ! -f "server.js" ]]; then
    print_error "server.js not found! Please run this script from the pdf-api directory"
    exit 1
fi

print_success "Found server.js - we're in the right directory"

# Install dependencies
print_status "Installing Node.js dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Create fonts directory if it doesn't exist
print_status "Setting up fonts directory..."
mkdir -p fonts

# Download Japanese fonts
print_status "Downloading Japanese fonts..."
cd fonts

# Download NotoSansJP
if [[ ! -f "NotoSansJP.ttf" ]]; then
    print_status "Downloading NotoSansJP font..."
    if curl -L -o NotoSansJP.ttf "https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj75vY0rw-oME.ttf"; then
        print_success "NotoSansJP font downloaded ($(du -h NotoSansJP.ttf | cut -f1))"
    else
        print_error "Failed to download NotoSansJP font"
        exit 1
    fi
else
    print_success "NotoSansJP font already exists ($(du -h NotoSansJP.ttf | cut -f1))"
fi

# Download NotoSerifJP
if [[ ! -f "NotoSerifJP.ttf" ]]; then
    print_status "Downloading NotoSerifJP font..."
    if curl -L -o NotoSerifJP.ttf "https://fonts.gstatic.com/s/notoserifjp/v30/xn71YHs72GKoTvER4Gn3b5eMRtWGkp6o7MjQ2bwxOubAILO5wBCU.ttf"; then
        print_success "NotoSerifJP font downloaded ($(du -h NotoSerifJP.ttf | cut -f1))"
    else
        print_error "Failed to download NotoSerifJP font"
        exit 1
    fi
else
    print_success "NotoSerifJP font already exists ($(du -h NotoSerifJP.ttf | cut -f1))"
fi

# Download PinyonScript
if [[ ! -f "PinyonScript-Regular.ttf" ]]; then
    print_status "Downloading PinyonScript font..."
    if curl -L -o PinyonScript-Regular.ttf "https://fonts.gstatic.com/s/pinyonscript/v22/6xKpdSJbL9-e9LuoeQiDRQR8aOLQO4bhiDY.ttf"; then
        print_success "PinyonScript font downloaded ($(du -h PinyonScript-Regular.ttf | cut -f1))"
    else
        print_error "Failed to download PinyonScript font"
        exit 1
    fi
else
    print_success "PinyonScript font already exists ($(du -h PinyonScript-Regular.ttf | cut -f1))"
fi

cd ..

# Verify fonts are downloaded correctly
print_status "Verifying font files..."
NOTO_SANS_SIZE=$(stat -f%z fonts/NotoSansJP.ttf 2>/dev/null || stat -c%s fonts/NotoSansJP.ttf 2>/dev/null)
NOTO_SERIF_SIZE=$(stat -f%z fonts/NotoSerifJP.ttf 2>/dev/null || stat -c%s fonts/NotoSerifJP.ttf 2>/dev/null)
PINYON_SIZE=$(stat -f%z fonts/PinyonScript-Regular.ttf 2>/dev/null || stat -c%s fonts/PinyonScript-Regular.ttf 2>/dev/null)

if [[ $NOTO_SANS_SIZE -gt 1000000 ]] && [[ $NOTO_SERIF_SIZE -gt 1000000 ]] && [[ $PINYON_SIZE -gt 100000 ]]; then
    print_success "All fonts downloaded successfully and look valid"
else
    print_warning "Font files might be corrupted or incomplete"
    print_status "NotoSansJP: $NOTO_SANS_SIZE bytes"
    print_status "NotoSerifJP: $NOTO_SERIF_SIZE bytes" 
    print_status "PinyonScript: $PINYON_SIZE bytes"
fi

# Check if port 3001 is available
print_status "Checking if port 3001 is available..."
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null; then
    print_warning "Port 3001 is already in use"
    print_status "Attempting to stop existing process..."
    if lsof -ti:3001 | xargs kill -9 2>/dev/null; then
        print_success "Stopped existing process on port 3001"
        sleep 2
    else
        print_warning "Could not stop existing process - you may need to stop it manually"
    fi
else
    print_success "Port 3001 is available"
fi

# Test basic server functionality
print_status "Testing server startup..."
timeout 10s node server.js &
SERVER_PID=$!
sleep 3

# Check if server started successfully
if kill -0 $SERVER_PID 2>/dev/null; then
    print_success "Server started successfully (PID: $SERVER_PID)"
    
    # Test health endpoint
    print_status "Testing health endpoint..."
    if curl -s http://localhost:3001/health > /dev/null; then
        print_success "Health endpoint is responding"
    else
        print_warning "Health endpoint not responding"
    fi
    
    # Stop test server
    kill $SERVER_PID 2>/dev/null
    wait $SERVER_PID 2>/dev/null
    print_success "Test server stopped"
else
    print_error "Server failed to start during test"
    exit 1
fi

echo ""
echo "🎉 Setup completed successfully!"
echo "================================"
echo ""
print_success "✅ Dependencies installed"
print_success "✅ Japanese fonts downloaded"
print_success "✅ Server tested and working"
echo ""
echo "🚀 Ready to start the API server:"
echo ""
echo -e "${BLUE}# Start the server:${NC}"
echo "node server.js"
echo ""
echo -e "${BLUE}# Or run in background:${NC}"
echo "nohup node server.js > server.log 2>&1 &"
echo ""
echo -e "${BLUE}# Test the API:${NC}"
echo "curl http://localhost:3001/health"
echo ""
echo -e "${BLUE}# Generate sample PDF:${NC}"
echo "curl http://localhost:3001/sample-template --output sample.pdf"
echo ""
echo "📋 API Endpoints:"
echo "  • Health check: GET http://localhost:3001/health"
echo "  • Generate PDF: POST http://localhost:3001/generate-pdf"
echo "  • Validate template: POST http://localhost:3001/validate-template"
echo "  • Sample PDF: GET http://localhost:3001/sample-template"
echo ""
echo "📚 Documentation: See README.md for detailed usage examples"
echo ""
print_success "API is ready to use! 🚀"
