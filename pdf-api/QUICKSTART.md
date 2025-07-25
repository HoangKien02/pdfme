# 🚀 Quick Start Guide

Get the PDF Generation API running in under 2 minutes!

## For New Users (Automated Setup)

```bash
# 1. Make setup script executable and run it
chmod +x setup.sh
./setup.sh

# 2. Start the server
./start.sh
```

That's it! The setup script will handle everything automatically.

## For Experienced Users (npm)

```bash
# 1. Install dependencies and setup fonts
npm install
npm run setup:fonts

# 2. Start server
npm start
```

## Test Your Installation

```bash
# Test health endpoint
curl http://localhost:3001/health

# Generate sample PDF
curl http://localhost:3001/sample-template --output test.pdf
```

## What the Setup Does

- ✅ Checks Node.js installation
- ✅ Installs npm dependencies (@pdfme/generator, express, cors)
- ✅ Downloads Japanese fonts:
  - NotoSansJP.ttf (5.5MB) - Primary Japanese font
  - NotoSerifJP.ttf (7.7MB) - Japanese serif font
  - PinyonScript-Regular.ttf (145KB) - Decorative font
- ✅ Verifies server startup
- ✅ Tests API endpoints

## Available Commands

After setup:

```bash
# Start server
./start.sh
# or
npm start

# Test health
npm run health

# Generate sample PDF
npm run sample

# Check fonts
ls -la fonts/
```

## Troubleshooting

### Port 3001 already in use
```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9
```

### Missing Node.js
Install from https://nodejs.org/ (version 18+ recommended)

### Font download failed
```bash
# Re-download fonts manually
npm run setup:fonts
```

### Server won't start
```bash
# Check if all dependencies installed
npm install

# Check if fonts exist
ls fonts/

# Run setup again
./setup.sh
```

## Next Steps

1. **Read the API docs**: See `README.md` for full documentation
2. **Test with your data**: Use `POST /generate-pdf` with your templates
3. **Japanese support**: The API auto-detects and applies Japanese fonts
4. **Ruby integration**: Supports Ruby body_stream requests

## API Endpoints Summary

- `GET /health` - Server health check
- `POST /generate-pdf` - Generate PDF from template
- `POST /validate-template` - Validate template format
- `GET /sample-template` - Download sample PDF

**Server URL**: http://localhost:3001

Ready to generate PDFs! 🎉
