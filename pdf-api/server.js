const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { generate } = require('@pdfme/generator');
const { checkTemplate, getInputFromTemplate, getDefaultFont } = require('@pdfme/common');
const { text, image, barcodes, line, rectangle, ellipse, table } = require('@pdfme/schemas');
const { log } = require('console');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure plugins for pdfme
const plugins = {
  text,
  image,
  qrcode: barcodes.qrcode,
  line,
  rectangle,
  ellipse,
  table,
};

// Helper function to apply font support (automatically detect and set Japanese fonts)
function applyFontSupport(template) {
  if (template.schemas && template.schemas[0]) {
    const schema = template.schemas[0];
    const fields = Array.isArray(schema) ? schema : Object.values(schema);
    
    fields.forEach((field) => {
      // For text fields - automatically set Japanese font when needed
      if (field.type === 'text' || field.type === 'multiVariableText') {
        // If no fontName specified and content contains Japanese characters, use NotoSansJP
        if (!field.fontName && field.content && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(field.content)) {
          field.fontName = 'NotoSansJP';
        }
        // Also check if field name contains Japanese
        if (!field.fontName && field.name && /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(field.name)) {
          field.fontName = 'NotoSansJP';
        }
      }
      
      // Fix Japanese font support for table headers
      if (field.type === 'table') {
        // Check if table headers contain Japanese characters
        if (field.head && Array.isArray(field.head)) {
          const hasJapanese = field.head.some((header) => 
            /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(header)
          );
          
          if (hasJapanese) {
            // Set Japanese font for head styles if not already set
            if (!field.headStyles) {
              field.headStyles = {};
            }
            if (!field.headStyles.fontName) {
              field.headStyles.fontName = 'NotoSansJP';
            }
            // Set Japanese font for body styles if not already set  
            if (!field.bodyStyles) {
              field.bodyStyles = {};
            }
            if (!field.bodyStyles.fontName) {
              field.bodyStyles.fontName = 'NotoSansJP';
            }
          }
        }
      }
    });
  }
  
  return template;
}

// Helper function to parse different template formats
function parseTemplate(rawData) {
  let template;
  let inputData = {};
  console.log('Parsing template from raw data:', rawData);
  
  if (rawData.template && rawData.template.templateData) {
    // Nested format: { template: { templateData: {...} }, inputs: [...] }
    template = rawData.template.templateData;
    if (rawData.inputs && Array.isArray(rawData.inputs) && rawData.inputs[0]) {
      inputData = rawData.inputs[0];
    }
  } else if (rawData.template && rawData.template.schemas) {
    // Format: { template: { schemas: [...], basePdf: ... }, inputs: {...} }
    template = rawData.template;
    if (rawData.inputs) {
      inputData = rawData.inputs;
    }
  } else if (rawData.schemas && rawData.basePdf) {
    // Direct format: { schemas: [...], basePdf: {...} }
    template = rawData;
  } else {
    throw new Error("Unrecognized template format. Expected either nested format with 'template.templateData' or direct format with 'schemas' and 'basePdf'");
  }
  
  // Convert array schemas to object format if needed
  if (template.schemas && Array.isArray(template.schemas) && Array.isArray(template.schemas[0])) {
    // Convert from array format: [[{field1}, {field2}]] to object format: {field1: {}, field2: {}}
    const fieldsArray = template.schemas[0];
    const schemaObject = {};
    fieldsArray.forEach(field => {
      if (field.name) {
        schemaObject[field.name] = field;
      }
    });
    template.schemas = [schemaObject];
  }
  
  // Apply font support
  template = applyFontSupport(template);
  
  // Validate template
  checkTemplate(template);
  
  // Use provided inputs or generate defaults
  const finalInputs = Object.keys(inputData).length > 0 
    ? inputData 
    : getInputFromTemplate(template)[0] || {};
  
  return { template, inputs: finalInputs };
}

// Helper function to read raw request body for Ruby clients
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.setEncoding('utf8');
    
    req.on('data', (chunk) => {
      body += chunk;
    });
    
    req.on('end', () => {
      try {
        const data = JSON.parse(body);
        resolve(data);
      } catch (parseError) {
        reject(parseError);
      }
    });
    
    req.on('error', (err) => {
      reject(err);
    });
  });
}

// Font configuration data for Japanese support
function getFontsData() {
  const fontDir = path.join(__dirname, 'fonts');
  
  return {
    ...getDefaultFont(), // Include default fonts first
    'NotoSansJP': {
      data: fs.readFileSync(path.join(fontDir, 'NotoSansJP.ttf')),
      fallback: false,
    },
    'NotoSerifJP': {
      data: fs.readFileSync(path.join(fontDir, 'NotoSerifJP.ttf')),
      fallback: false,
    },
    'PinyonScript-Regular': {
      data: fs.readFileSync(path.join(fontDir, 'PinyonScript-Regular.ttf')),
      fallback: false,
    }
  };
}

// Helper function to generate PDF from data
async function generatePdfFromData(rawData, res) {
  try {
    if (!rawData) {
      return res.status(400).json({
        error: 'Missing request body',
        message: 'Please provide JSON data in the request body'
      });
    }
    
    console.log('Received PDF generation request');
    console.log('Raw data:', rawData);
    
    // Parse and validate template
    const { template, inputs } = parseTemplate(rawData);
    
    console.log('Template parsed successfully, generating PDF...');
    log('Template:', JSON.stringify(template, null, 2));
    log('Inputs:', JSON.stringify(inputs, null, 2));
    
    // Get font configuration for Japanese support
    const fonts = getFontsData();
    console.log('🔤 Font configuration:', Object.keys(fonts));
    console.log('📁 Font loaded from local files (NotoSansJP size:', fonts.NotoSansJP.data.length, 'bytes)');
    
    
    // Generate PDF with Japanese language support
    const pdfBytes = await generate({
      template,
      inputs: [inputs],
      plugins,
      options: {
        lang: 'ja', // Set language to Japanese for proper character rendering
        font: fonts, // Use custom font configuration
      }
    });
    
    console.log('PDF generated successfully');
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="generated-document.pdf"');
    res.setHeader('Content-Length', pdfBytes.length);
    
    // Send PDF as binary data
    res.end(Buffer.from(pdfBytes), 'binary');
    
  } catch (error) {
    console.error('Error generating PDF:', error);
    
    res.status(500).json({
      error: 'PDF Generation Failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Helper function to validate template data
function validateTemplateData(rawData, res) {
  try {
    if (!rawData) {
      return res.status(400).json({
        error: 'Missing request body',
        message: 'Please provide JSON data in the request body'
      });
    }
    
    // Parse and validate template
    const { template, inputs } = parseTemplate(rawData);
    
    // Count fields by type
    const fieldCounts = {};
    if (template.schemas && template.schemas[0]) {
      const fields = Array.isArray(template.schemas[0]) ? template.schemas[0] : Object.values(template.schemas[0]);
      fields.forEach(field => {
        fieldCounts[field.type] = (fieldCounts[field.type] || 0) + 1;
      });
    }
    
    res.json({
      status: 'Valid',
      message: 'Template is valid and ready for PDF generation',
      template: {
        fieldCount: Object.values(fieldCounts).reduce((a, b) => a + b, 0),
        fieldTypes: fieldCounts,
        hasJapaneseContent: JSON.stringify(template).match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/) !== null,
        basePdfType: typeof template.basePdf === 'object' ? 'blank' : 'existing'
      },
      inputs: {
        fieldCount: Object.keys(inputs).length,
        fields: Object.keys(inputs)
      },
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error validating template:', error);
    
    res.status(400).json({
      error: 'Template Validation Failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'PDF Generation API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API endpoint to generate PDF from raw JSON data
// Supports both standard JSON requests and Ruby body_stream
app.post('/generate-pdf', async (req, res) => {
  // Check if we have parsed JSON body (standard request)
  if (req.body && Object.keys(req.body).length > 0) {
    // Standard JSON request
    await generatePdfFromData(req.body, res);
  } else {
    // Handle raw stream data from Ruby clients using body_stream
    try {
      const rawData = await readRawBody(req);
      await generatePdfFromData(rawData, res);
    } catch (parseError) {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: 'Unable to parse request body as JSON',
        details: parseError.message
      });
    }
  }
});

// API endpoint to validate template without generating PDF
// Supports both standard JSON requests and Ruby body_stream  
app.post('/validate-template', async (req, res) => {
  // Check if we have parsed JSON body (standard request)
  if (req.body && Object.keys(req.body).length > 0) {
    // Standard JSON request
    validateTemplateData(req.body, res);
  } else {
    // Handle raw stream data from Ruby clients using body_stream
    try {
      const rawData = await readRawBody(req);
      validateTemplateData(rawData, res);
    } catch (parseError) {
      return res.status(400).json({
        error: 'Invalid JSON',
        message: 'Unable to parse request body as JSON',
        details: parseError.message
      });
    }
  }
});

// API endpoint to generate sample PDF
app.get('/sample-template', async (req, res) => {
  try {
    const sampleTemplate = {
      "template": {
        "metaData": {
          "title": "Sample Template",
          "description": "A sample template for API testing"
        },
        "templateData": {
          "schemas": [
            [
              {
                "name": "title",
                "type": "text",
                "content": "Sample Document",
                "position": { "x": 20, "y": 20 },
                "width": 170,
                "height": 20,
                "fontSize": 24,
                "fontColor": "#000000"
              },
              {
                "name": "content",
                "type": "text", 
                "content": "This is sample content",
                "position": { "x": 20, "y": 50 },
                "width": 170,
                "height": 10,
                "fontSize": 12,
                "fontColor": "#000000"
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
          "title": "Sample PDF Document",
          "content": "This is a sample PDF generated from the API"
        }
      ]
    };
    
    console.log('Generating sample PDF...');
    
    // Parse and validate template
    const { template, inputs } = parseTemplate(sampleTemplate);
    
    // Generate PDF
    const pdfBytes = await generate({
      template,
      inputs: [inputs],
      plugins,
      options: {
        lang: 'en',
      }
    });
    
    console.log('Sample PDF generated successfully');
    
    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="sample-template.pdf"');
    res.setHeader('Content-Length', pdfBytes.length);
    
    // Send PDF as binary data
    res.end(Buffer.from(pdfBytes), 'binary');
    
  } catch (error) {
    console.error('Error generating sample PDF:', error);
    
    res.status(500).json({
      error: 'Sample PDF Generation Failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    availableRoutes: [
      'GET /health',
      'POST /generate-pdf',
      'POST /validate-template',
      'GET /sample-template (generates sample PDF)'
    ],
    timestamp: new Date().toISOString()
  });
});

// Start server only if not in test environment
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 PDF Generation API is running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`📄 Generate PDF: POST http://localhost:${PORT}/generate-pdf`);
    console.log(`✅ Validate template: POST http://localhost:${PORT}/validate-template`);
    console.log(`📋 Sample PDF: GET http://localhost:${PORT}/sample-template`);
    console.log(`🔧 Now supports Ruby body_stream requests!`);
  });
}

module.exports = app;
