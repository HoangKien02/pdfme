# PDF Generation API

A Node.js/Express API that generates PDF files from JSON templates using pdfme library.

## ✅ Current Status

- ✅ **Working**: PDF generation from JSON templates
- ✅ **Working**: Support for Japanese characters (using default fonts)
- ✅ **Working**: Multiple field types: text, table, images, QR codes, shapes
- ✅ **Working**: Template validation endpoint
- ✅ **Working**: Support for nested and direct template formats
- ✅ **Working**: CORS enabled for web applications
- ✅ **Working**: Error handling and validation

## Features

- 📄 Generate PDFs from JSON template data (like your test-template.json)
- 🇯🇵 Support for Japanese characters 
- 📊 Multiple field types: text, table, images, QR codes, shapes
- ✅ Template validation endpoint
- 🔧 Support for nested and direct template formats
- 🌐 CORS enabled for web applications
- ⚠️ Error handling and validation

## Quick Start

```bash
# Install dependencies
npm install

# Start the server
npm start
# or
node server.js
```

The server runs on `http://localhost:3001`

## API Endpoints

### 1. Health Check
```
GET /health
```
Returns server status and basic information.

**Example:**
```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "OK",
  "message": "PDF Generation API is running",
  "timestamp": "2025-07-25T03:15:11.906Z",
  "version": "1.0.0"
}
```

### 2. Generate PDF ⭐ **MAIN ENDPOINT**
```
POST /generate-pdf
Content-Type: application/json
```

**Request Body**: JSON template data (same format as test-template.json)
**Response**: PDF file as binary data

**Example with your Japanese invoice:**
```bash
curl -X POST http://localhost:3001/generate-pdf \
  -H "Content-Type: application/json" \
  -d @test-template.json \
  --output generated-invoice.pdf
```

**Example with custom data:**
```bash
curl -X POST http://localhost:3001/generate-pdf \
  -H "Content-Type: application/json" \
  -d '{
    "template": {
      "templateData": {
        "schemas": [[{
          "name": "title",
          "type": "text",
          "content": "Hello World",
          "position": {"x": 20, "y": 20},
          "width": 170,
          "height": 20,
          "fontSize": 24
        }]],
        "basePdf": {
          "width": 210,
          "height": 297,
          "padding": [20, 20, 20, 20]
        }
      }
    },
    "inputs": [{"title": "My Document"}]
  }' \
  --output custom-document.pdf
```

### 3. Validate Template
```
POST /validate-template
Content-Type: application/json
```

**Request Body**: JSON template data
**Response**: Validation result with template analysis

**Example:**
```bash
curl -X POST http://localhost:3001/validate-template \
  -H "Content-Type: application/json" \
  -d @test-template.json
```

**Response:**
```json
{
  "status": "Valid",
  "template": {
    "fieldCount": 26,
    "fieldTypes": {
      "text": 20,
      "table": 1,
      "qrcode": 1,
      "line": 3,
      "rectangle": 1
    },
    "hasJapaneseContent": true,
    "basePdfType": "blank"
  },
  "inputs": {
    "fieldCount": 22,
    "fields": ["入力項目1", "入力項目2", ...]
  }
}
```

### 4. Sample Template PDF ✨ **NEW**
```
GET /sample-template
```
Generates and downloads a sample PDF document for testing and demonstration.

**Example:**
```bash
curl http://localhost:3001/sample-template --output sample-document.pdf
```

This endpoint creates a simple PDF with sample text fields to demonstrate the API functionality.

## Template Format

The API accepts two template formats:

### Nested Format (like your test-template.json)
```json
{
  "template": {
    "metaData": {
      "title": "Document Title"
    },
    "templateData": {
      "schemas": [
        [
          {
            "name": "field1",
            "type": "text",
            "content": "Sample text",
            "position": {"x": 20, "y": 20},
            "width": 100,
            "height": 20
          }
        ]
      ],
      "basePdf": {
        "width": 210,
        "height": 297,
        "padding": [20, 20, 20, 20]
      }
    }
  },
  "inputs": [
    {
      "field1": "Actual value"
    }
  ]
}
```

### Direct Format
```json
{
  "schemas": [[...]],
  "basePdf": {...}
}
```

## Supported Field Types

- **text**: Text fields with various formatting options
- **table**: Dynamic tables with headers and data rows (✅ Fixed table headers!)
- **image**: Images (URL or base64)
- **qrcode**: QR code generation
- **line**: Lines and borders
- **rectangle**: Rectangular shapes
- **ellipse**: Circular/oval shapes

## Japanese Character Support ✅

The API successfully handles Japanese characters:
- ✅ Text fields with Japanese content
- ✅ Table headers with Japanese text (物品名, 数量, 単価, 金額)
- ✅ Proper character rendering using default fonts
- ✅ Works with your test-template.json

## Real-World Example: Japanese Invoice

Your `test-template.json` creates a complete Japanese invoice with:
- 📋 **Table headers**: 物品名, 数量, 単価, 金額
- 📝 **Invoice data**: Company info, dates, amounts
- 📊 **Dynamic table**: Product list with pricing
- 📱 **QR code**: For digital verification

**Generated successfully!** ✅

## Usage Examples

### Using curl
```bash
# Generate your Japanese invoice
curl -X POST http://localhost:3001/generate-pdf \
  -H "Content-Type: application/json" \
  -d @test-template.json \
  --output japanese-invoice.pdf

# Validate template first
curl -X POST http://localhost:3001/validate-template \
  -H "Content-Type: application/json" \
  -d @test-template.json
```

### Using JavaScript/Fetch
```javascript
// Generate PDF
const response = await fetch('http://localhost:3001/generate-pdf', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(templateData)
});

if (response.ok) {
  const pdfBlob = await response.blob();
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'generated-document.pdf';
  a.click();
}
```

### Using Python requests
```python
import requests
import json

# Load your template
with open('test-template.json', 'r', encoding='utf-8') as f:
    template_data = json.load(f)

# Generate PDF
response = requests.post(
    'http://localhost:3001/generate-pdf',
    json=template_data,
    headers={'Content-Type': 'application/json'}
)

if response.status_code == 200:
    with open('generated-invoice.pdf', 'wb') as f:
        f.write(response.content)
    print("PDF generated successfully!")
else:
    print(f"Error: {response.json()}")
```

## Testing

Run the included test script:
```bash
chmod +x test-api.sh
./test-api.sh
```

This will test all endpoints and generate sample PDFs.

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- **200**: Success (PDF generated)
- **400**: Bad Request (invalid template format)
- **500**: Internal Server Error (PDF generation failed)

Example error response:
```json
{
  "error": "Template Validation Failed",
  "message": "Missing required field: schemas",
  "timestamp": "2025-07-25T10:30:00.000Z"
}
```

## Configuration

Environment variables:
- `PORT`: Server port (default: 3001)

## Architecture

```
Request → Template Parsing → Font Processing → PDF Generation → Response
   ↓           ↓                   ↓              ↓            ↓
JSON Data → Validation → Japanese Support → pdfme Engine → PDF File
```

## Files Generated

The API can generate PDFs from your templates:
- ✅ `japanese-invoice-v2.pdf` (from your test-template.json)
- ✅ `test-english.pdf` (from English template)
- ✅ Any custom templates you provide

## Dependencies

```json
{
  "express": "^4.18.2",
  "cors": "^2.8.5", 
  "@pdfme/generator": "^4.5.2",
  "@pdfme/common": "^4.5.2",
  "@pdfme/schemas": "^4.5.2"
}
```

## License

MIT

---

## 🎉 Success!

Your Japanese invoice template (`test-template.json`) is now working perfectly with the API! The table headers (物品名, 数量, 単価, 金額) are displaying correctly, and the PDF generation is fully functional.
