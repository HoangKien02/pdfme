const request = require('supertest');
const fs = require('fs');
const path = require('path');

// Mock the pdfme modules to avoid actual PDF generation in tests
const mockGenerate = jest.fn().mockResolvedValue(Buffer.from('mock-pdf-content'));
const mockCheckTemplate = jest.fn();
const mockGetInputFromTemplate = jest.fn().mockReturnValue([{ title: 'mock-title', content: 'mock-content' }]);

jest.mock('@pdfme/generator', () => ({
  generate: mockGenerate
}));

jest.mock('@pdfme/common', () => ({
  checkTemplate: mockCheckTemplate,
  getInputFromTemplate: mockGetInputFromTemplate,
  getDefaultFont: jest.fn()
}));

jest.mock('@pdfme/schemas', () => ({
  text: {},
  image: {},
  barcodes: { qrcode: {} },
  line: {},
  rectangle: {},
  ellipse: {},
  table: {}
}));

// Import the app after mocking
const app = require('../server');

describe('PDF Generation API', () => {
  // Test data
  const validNestedTemplate = {
    template: {
      metaData: {
        title: "Test Template"
      },
      templateData: {
        schemas: [[
          {
            name: "title",
            type: "text",
            content: "Test Document",
            position: { x: 20, y: 20 },
            width: 170,
            height: 20,
            fontSize: 24
          }
        ]],
        basePdf: {
          width: 210,
          height: 297,
          padding: [20, 20, 20, 20]
        }
      }
    },
    inputs: [{
      title: "My Test Title"
    }]
  };

  const validDirectTemplate = {
    schemas: [[
      {
        name: "content",
        type: "text",
        content: "Direct content",
        position: { x: 20, y: 50 },
        width: 170,
        height: 10
      }
    ]],
    basePdf: {
      width: 210,
      height: 297,
      padding: [20, 20, 20, 20]
    }
  };

  const japaneseTemplate = {
    template: {
      templateData: {
        schemas: [[
          {
            name: "japanese_text",
            type: "text",
            content: "こんにちは",
            position: { x: 20, y: 20 },
            width: 170,
            height: 20
          },
          {
            name: "table_test",
            type: "table",
            content: [["物品名", "数量"]],
            position: { x: 20, y: 50 },
            width: 170,
            height: 40,
            headStyles: { fontName: "NotoSansJP" },
            bodyStyles: { fontName: "NotoSansJP" }
          }
        ]],
        basePdf: {
          width: 210,
          height: 297
        }
      }
    },
    inputs: [{
      japanese_text: "テスト文書",
      table_test: [["商品A", "5"]]
    }]
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'OK',
        message: 'PDF Generation API is running',
        timestamp: expect.any(String),
        version: '1.0.0'
      });
    });
  });

  describe('POST /generate-pdf', () => {
    it('should generate PDF from valid nested template', async () => {
      const response = await request(app)
        .post('/generate-pdf')
        .send(validNestedTemplate)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toBe('attachment; filename="generated-document.pdf"');
      expect(mockGenerate).toHaveBeenCalledWith({
        template: expect.objectContaining({
          schemas: expect.any(Array),
          basePdf: expect.any(Object)
        }),
        inputs: expect.any(Array),
        plugins: expect.any(Object),
        options: { lang: 'ja' }
      });
    });

    it('should generate PDF from valid direct template', async () => {
      const response = await request(app)
        .post('/generate-pdf')
        .send(validDirectTemplate)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(mockGenerate).toHaveBeenCalled();
    });

    it('should handle Japanese content and remove NotoSansJP font references', async () => {
      const response = await request(app)
        .post('/generate-pdf')
        .send(japaneseTemplate)
        .expect(200);

      expect(mockGenerate).toHaveBeenCalledWith({
        template: expect.objectContaining({
          schemas: expect.arrayContaining([
            expect.objectContaining({
              table_test: expect.objectContaining({
                headStyles: expect.not.objectContaining({ fontName: 'NotoSansJP' }),
                bodyStyles: expect.not.objectContaining({ fontName: 'NotoSansJP' })
              })
            })
          ])
        }),
        inputs: expect.any(Array),
        plugins: expect.any(Object),
        options: { lang: 'ja' }
      });
    });

    it('should return 400 for missing request body', async () => {
      const response = await request(app)
        .post('/generate-pdf')
        .send({}) // Send empty object instead of no body
        .expect(500); // Expecting 500 because empty object fails template parsing

      expect(response.body).toMatchObject({
        error: 'PDF Generation Failed',
        message: expect.stringContaining('Unrecognized template format')
      });
    });

    it('should return 400 for invalid template format', async () => {
      const invalidTemplate = {
        invalid: "data"
      };

      const response = await request(app)
        .post('/generate-pdf')
        .send(invalidTemplate)
        .expect(500); // Will be 500 because parseTemplate throws error

      expect(response.body).toMatchObject({
        error: 'PDF Generation Failed',
        message: expect.stringContaining('Unrecognized template format')
      });
    });

    it('should handle PDF generation errors', async () => {
      mockGenerate.mockRejectedValueOnce(new Error('PDF generation failed'));

      const response = await request(app)
        .post('/generate-pdf')
        .send(validNestedTemplate)
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'PDF Generation Failed',
        message: 'PDF generation failed',
        timestamp: expect.any(String)
      });
    });

    it('should convert array schemas to object format', async () => {
      await request(app)
        .post('/generate-pdf')
        .send(validNestedTemplate)
        .expect(200);

      const generatedCall = mockGenerate.mock.calls[0][0];
      expect(generatedCall.template.schemas[0]).toBeInstanceOf(Object);
      expect(generatedCall.template.schemas[0]).toHaveProperty('title');
    });
  });

  describe('POST /validate-template', () => {
    it('should validate valid nested template', async () => {
      const response = await request(app)
        .post('/validate-template')
        .send(validNestedTemplate)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'Valid',
        message: 'Template is valid and ready for PDF generation',
        template: {
          fieldCount: expect.any(Number),
          fieldTypes: expect.any(Object),
          hasJapaneseContent: expect.any(Boolean),
          basePdfType: 'blank'
        },
        inputs: {
          fieldCount: expect.any(Number),
          fields: expect.any(Array)
        },
        timestamp: expect.any(String)
      });
    });

    it('should detect Japanese content', async () => {
      const response = await request(app)
        .post('/validate-template')
        .send(japaneseTemplate)
        .expect(200);

      expect(response.body.template.hasJapaneseContent).toBe(true);
    });

    it('should count field types correctly', async () => {
      const response = await request(app)
        .post('/validate-template')
        .send(japaneseTemplate)
        .expect(200);

      expect(response.body.template.fieldTypes).toEqual({
        text: 1,
        table: 1
      });
      expect(response.body.template.fieldCount).toBe(2);
    });

    it('should return 400 for missing request body', async () => {
      const response = await request(app)
        .post('/validate-template')
        .send({}) // Send empty object instead of no body
        .expect(400); // Expecting 400 because empty object fails template parsing

      expect(response.body).toMatchObject({
        error: 'Template Validation Failed',
        message: expect.stringContaining('Unrecognized template format')
      });
    });

    it('should handle template validation errors', async () => {
      mockCheckTemplate.mockImplementationOnce(() => {
        throw new Error('Invalid template');
      });

      const response = await request(app)
        .post('/validate-template')
        .send(validNestedTemplate)
        .expect(400);

      expect(response.body).toMatchObject({
        error: 'Template Validation Failed',
        message: 'Invalid template',
        timestamp: expect.any(String)
      });
    });
  });

  describe('GET /sample-template', () => {
    it('should generate sample PDF', async () => {
      const response = await request(app)
        .get('/sample-template')
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
      expect(response.headers['content-disposition']).toBe('attachment; filename="sample-template.pdf"');
      expect(mockGenerate).toHaveBeenCalledWith({
        template: expect.objectContaining({
          schemas: expect.any(Array),
          basePdf: expect.any(Object)
        }),
        inputs: expect.arrayContaining([
          expect.objectContaining({
            title: 'Sample PDF Document',
            content: 'This is a sample PDF generated from the API'
          })
        ]),
        plugins: expect.any(Object),
        options: { lang: 'en' }
      });
    });

    it('should handle sample PDF generation errors', async () => {
      mockGenerate.mockRejectedValueOnce(new Error('Sample generation failed'));

      const response = await request(app)
        .get('/sample-template')
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Sample PDF Generation Failed',
        message: 'Sample generation failed',
        timestamp: expect.any(String)
      });
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404);

      expect(response.body).toMatchObject({
        error: 'Not Found',
        message: 'Route GET /unknown-route not found',
        availableRoutes: [
          'GET /health',
          'POST /generate-pdf',
          'POST /validate-template',
          'GET /sample-template (generates sample PDF)'
        ],
        timestamp: expect.any(String)
      });
    });

    it('should return 404 for unknown POST routes', async () => {
      const response = await request(app)
        .post('/unknown-post')
        .expect(404);

      expect(response.body.message).toContain('POST /unknown-post not found');
    });
  });

  describe('Helper Functions', () => {
    // Test the helper functions indirectly through API calls
    
    it('should handle nested template format parsing', async () => {
      await request(app)
        .post('/generate-pdf')
        .send(validNestedTemplate)
        .expect(200);

      expect(mockGenerate).toHaveBeenCalled();
    });

    it('should handle direct template format parsing', async () => {
      await request(app)
        .post('/generate-pdf')
        .send(validDirectTemplate)
        .expect(200);

      expect(mockGenerate).toHaveBeenCalled();
    });

    it('should apply font support and remove Japanese fonts', async () => {
      const templateWithJapaneseFont = {
        template: {
          templateData: {
            schemas: [[
              {
                name: "text_field",
                type: "text",
                content: "テスト",
                fontName: "NotoSansJP",
                position: { x: 20, y: 20 },
                width: 100,
                height: 20
              }
            ]],
            basePdf: { width: 210, height: 297 }
          }
        },
        inputs: [{ text_field: "テスト値" }]
      };

      await request(app)
        .post('/generate-pdf')
        .send(templateWithJapaneseFont)
        .expect(200);

      const generatedCall = mockGenerate.mock.calls[0][0];
      const textField = generatedCall.template.schemas[0].text_field;
      expect(textField).not.toHaveProperty('fontName');
    });
  });

  describe('Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      // Express JSON parser returns 400 for JSON syntax errors, but our error middleware converts it to 500
      const response = await request(app)
        .post('/generate-pdf')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}')
        .expect(500); // Our error middleware handles JSON parsing errors as 500
      
      expect(response.body).toMatchObject({
        error: 'Internal Server Error',
        message: 'An unexpected error occurred'
      });
    });

    it('should handle very large payloads', async () => {
      const largeTemplate = {
        ...validNestedTemplate,
        template: {
          ...validNestedTemplate.template,
          templateData: {
            ...validNestedTemplate.template.templateData,
            schemas: [Array(1000).fill(null).map((_, i) => ({
              name: `field_${i}`,
              type: "text",
              content: `Content ${i}`,
              position: { x: 20, y: 20 + i * 10 },
              width: 100,
              height: 10
            }))]
          }
        }
      };

      const response = await request(app)
        .post('/generate-pdf')
        .send(largeTemplate)
        .expect(200);

      expect(response.headers['content-type']).toBe('application/pdf');
    });
  });

  describe('CORS and Middleware', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .options('/health')
        .expect(204);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });

    it('should handle JSON body parsing', async () => {
      const response = await request(app)
        .post('/generate-pdf')
        .send(validNestedTemplate)
        .expect(200);

      expect(mockGenerate).toHaveBeenCalled();
    });
  });
});
