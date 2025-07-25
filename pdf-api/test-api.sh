#!/bin/bash

# PDF Generation API Test Script
echo "🚀 Testing PDF Generation API"
echo "=================================="

API_URL="http://localhost:3001"
echo "API Base URL: $API_URL"
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s $API_URL/health | jq '.'
echo ""

# Test 2: Validate Template
echo "2. Testing Template Validation..."
curl -s -X POST $API_URL/validate-template \
  -H "Content-Type: application/json" \
  -d @test-template.json | jq '.'
echo ""

# Test 3: Generate PDF (English)
echo "3. Generating English PDF..."
curl -X POST $API_URL/generate-pdf \
  -H "Content-Type: application/json" \
  -d @test-english.json \
  --output "api-test-english.pdf"

if [ -f "api-test-english.pdf" ]; then
    echo "✅ English PDF generated successfully: api-test-english.pdf"
else
    echo "❌ Failed to generate English PDF"
fi
echo ""

# Test 4: Generate PDF (Japanese)
echo "4. Generating Japanese Invoice PDF..."
curl -X POST $API_URL/generate-pdf \
  -H "Content-Type: application/json" \
  -d @../playground/test-template.json \
  --output "api-test-japanese.pdf"

if [ -f "api-test-japanese.pdf" ]; then
    echo "✅ Japanese PDF generated successfully: api-test-japanese.pdf"
    echo "📊 File size: $(ls -lh api-test-japanese.pdf | awk '{print $5}')"
else
    echo "❌ Failed to generate Japanese PDF"
fi
echo ""

# Test 5: Get Sample Template
echo "5. Getting Sample Template..."
curl -s $API_URL/sample-template | jq '.template.templateData.schemas[0][0]'
echo ""

echo "=================================="
echo "🎉 API Tests Completed!"
echo "Generated files:"
ls -la *.pdf 2>/dev/null | grep -E "\.(pdf)$" || echo "No PDF files found"
