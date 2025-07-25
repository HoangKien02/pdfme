import React, { useRef, useState, useEffect } from "react";
import { toast } from 'react-toastify';
import { Template, checkTemplate, getInputFromTemplate } from "@pdfme/common";
import {
  getFontsData,
  readFile,
  isJsonString,
} from "../helper";
import { getPlugins } from '../plugins';
import { NavItem, NavBar } from "../components/NavBar";

interface PdfViewerState {
  template: Template | null;
  inputs: Record<string, any>;
  generatedPdfUrl: string | null;
  isGenerating: boolean;
}

function PdfViewer() {
  const [state, setState] = useState<PdfViewerState>({
    template: null,
    inputs: {},
    generatedPdfUrl: null,
    isGenerating: false,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfPreviewRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const stateRef = useRef(state);
  
  // Keep stateRef in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Import JSON template từ file
  const handleFileImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const jsonStr = await readFile(file, 'text') as string;
      const parsed = JSON.parse(jsonStr);
      
      // Handle different template formats
      let template: Template;
      let inputData: Record<string, any> = {};
      
      if (parsed.template && parsed.template.templateData) {
        // Nested format: { template: { templateData: {...} }, inputs: [...] }
        template = parsed.template.templateData;
        if (parsed.inputs && Array.isArray(parsed.inputs) && parsed.inputs[0]) {
          inputData = parsed.inputs[0];
        }
      } else if (parsed.schemas && parsed.basePdf) {
        // Direct format: { schemas: [...], basePdf: {...} }
        template = parsed;
      } else {
        throw new Error("Unrecognized template format");
      }
      
      checkTemplate(template);
      
      // Fix Japanese font support - set fontName for fields that don't have it
      if (template.schemas && template.schemas[0]) {
        const schema = template.schemas[0];
        const fields = Array.isArray(schema) ? schema : Object.values(schema);
        
        fields.forEach((field: any) => {
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
              const hasJapanese = field.head.some((header: string) => 
                /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(header)
              );
              
              if (hasJapanese) {
                // Set Japanese font for head styles if not already set
                if (field.headStyles && !field.headStyles.fontName) {
                  field.headStyles.fontName = 'NotoSansJP';
                }
                // Set Japanese font for body styles if not already set
                if (field.bodyStyles && !field.bodyStyles.fontName) {
                  field.bodyStyles.fontName = 'NotoSansJP';
                }
              }
            }
          }
        });
      }
      
      // Use provided inputs or generate defaults
      const defaultInputs = Object.keys(inputData).length > 0 
        ? inputData 
        : getInputFromTemplate(template)[0] || {};
      
      setState(prev => ({
        ...prev,
        template,
        inputs: defaultInputs,
        generatedPdfUrl: null,
        isGenerating: false,
      }));
      
      toast.success("Template imported successfully!");
      
      // Auto-generate PDF after template import
      setTimeout(() => {
        generatePdfPreview();
      }, 100);
    } catch (error) {
      toast.error(`Failed to import template: ${error}`);
      console.error(error);
    }
  };

  // Import JSON từ text input
  const handleJsonTextImport = (jsonText: string) => {
    try {
      if (!isJsonString(jsonText)) {
        throw new Error("Invalid JSON format");
      }
      
      const parsed = JSON.parse(jsonText);
      
      // Handle different template formats
      let template: Template;
      let inputData: Record<string, any> = {};
      
      if (parsed.template && parsed.template.templateData) {
        // Nested format: { template: { templateData: {...} }, inputs: [...] }
        template = parsed.template.templateData;
        if (parsed.inputs && Array.isArray(parsed.inputs) && parsed.inputs[0]) {
          inputData = parsed.inputs[0];
        }
      } else if (parsed.schemas && parsed.basePdf) {
        // Direct format: { schemas: [...], basePdf: {...} }
        template = parsed;
      } else {
        throw new Error("Unrecognized template format");
      }
      
      checkTemplate(template);
      
      // Fix Japanese font support - set fontName for fields that don't have it
      if (template.schemas && template.schemas[0]) {
        const schema = template.schemas[0];
        const fields = Array.isArray(schema) ? schema : Object.values(schema);
        
        fields.forEach((field: any) => {
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
              const hasJapanese = field.head.some((header: string) => 
                /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(header)
              );
              
              if (hasJapanese) {
                // Set Japanese font for head styles if not already set
                if (field.headStyles && !field.headStyles.fontName) {
                  field.headStyles.fontName = 'NotoSansJP';
                }
                // Set Japanese font for body styles if not already set
                if (field.bodyStyles && !field.bodyStyles.fontName) {
                  field.bodyStyles.fontName = 'NotoSansJP';
                }
              }
            }
          }
        });
      }
      
      // Use provided inputs or generate defaults
      const defaultInputs = Object.keys(inputData).length > 0 
        ? inputData 
        : getInputFromTemplate(template)[0] || {};
      
      setState(prev => ({
        ...prev,
        template,
        inputs: defaultInputs,
        generatedPdfUrl: null,
        isGenerating: false,
      }));
      
      toast.success("Template imported successfully!");
      
      // Auto-generate PDF after template import
      setTimeout(() => {
        generatePdfPreview();
      }, 100);
    } catch (error) {
      toast.error(`Failed to import template: ${error}`);
      console.error(error);
    }
  };

  // Update input data with auto-generation
  const handleInputChange = (fieldName: string, value: any) => {
    setState(prev => ({
      ...prev,
      inputs: {
        ...prev.inputs,
        [fieldName]: value,
      },
    }));
    
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    // Auto-generate PDF after a short delay to avoid too many generations
    timeoutRef.current = setTimeout(() => {
      if (stateRef.current.template) {
        generatePdfPreview();
      }
    }, 500);
  };

  // Generate PDF with auto-preview
  const generatePdfPreview = async () => {
    if (!state.template) {
      toast.error("Please import a template first");
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true }));

    try {
      const font = getFontsData();
      const { generate } = await import('@pdfme/generator');

      console.log('Generating PDF with template:', state.template);
      console.log('Using inputs:', state.inputs);

      const pdf = await generate({
        template: state.template,
        inputs: [state.inputs],
        options: {
          font,
          lang: 'ja', // Set Japanese language for proper font rendering
          title: 'Generated PDF',
        },
        plugins: getPlugins(),
      });

      // Clear previous URL to prevent memory leak
      if (state.generatedPdfUrl) {
        URL.revokeObjectURL(state.generatedPdfUrl);
      }

      const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setState(prev => ({
        ...prev,
        generatedPdfUrl: url,
        isGenerating: false,
      }));
      
      toast.success("PDF generated successfully!");
    } catch (error) {
      setState(prev => ({ ...prev, isGenerating: false }));
      toast.error(`Failed to generate PDF: ${error}`);
      console.error(error);
    }
  };

  // Download PDF
  const downloadPdf = () => {
    if (state.generatedPdfUrl) {
      const link = document.createElement('a');
      link.href = state.generatedPdfUrl;
      link.download = 'generated.pdf';
      link.click();
      toast.success("PDF downloaded!");
    }
  };

  // Clear all data
  const clearAll = () => {
    // Clean up URL
    if (state.generatedPdfUrl) {
      URL.revokeObjectURL(state.generatedPdfUrl);
    }
    
    setState({
      template: null,
      inputs: {},
      generatedPdfUrl: null,
      isGenerating: false,
    });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.info("All data cleared");
  };

  // Render input fields based on template schema
  const renderInputFields = () => {
    if (!state.template || !state.template.schemas || !state.template.schemas[0]) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📋</div>
          <p className="text-gray-500">No template imported</p>
          <p className="text-sm text-gray-400">Import a template to see input fields</p>
        </div>
      );
    }

    const schema = state.template.schemas[0];
    const fields = Array.isArray(schema) ? schema : Object.values(schema);

    if (fields.length === 0) {
      return (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📝</div>
          <p className="text-gray-500">No fields found in template</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {fields.map((field: any, index: number) => {
          if (!field.name || !field.type) return null;
          
          const fieldValue = state.inputs[field.name] || field.content || '';
          
          return (
            <div key={field.name || index} className="flex flex-col">
              <label className="text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold">
                  {field.type}
                </span>
                <span className="flex-1">
                  {field.name}
                  {field.content && field.content !== fieldValue && (
                    <span className="text-xs text-gray-500 ml-2">
                      (default: {field.content.length > 20 ? field.content.substring(0, 20) + '...' : field.content})
                    </span>
                  )}
                </span>
              </label>
              
              {field.type === 'multiVariableText' ? (
                <textarea
                  className="border rounded px-3 py-2 min-h-[100px] text-sm font-mono"
                  value={fieldValue}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={`Enter ${field.name} (supports multiple lines)`}
                />
              ) : field.type === 'image' ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    className="border rounded px-3 py-2 text-sm font-mono"
                    value={fieldValue}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    placeholder="Image URL or base64 data (data:image/...)"
                  />
                  <div className="text-xs text-gray-500">
                    💡 Tip: Use image URLs or base64 encoded images
                  </div>
                </div>
              ) : field.type === 'table' ? (
                <div className="space-y-2">
                  {/* Show table header info to help user understand column mapping */}
                  {field.head && field.head.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm">
                      <div className="font-medium text-blue-800 mb-1">📋 Table Columns:</div>
                      <div className="text-blue-700">
                        {field.head.map((header: string, index: number) => (
                          <span key={index} className="inline-block bg-blue-100 px-2 py-1 rounded mr-1 mb-1">
                            {index + 1}. {header}
                          </span>
                        ))}
                      </div>
                      <div className="text-blue-600 text-xs mt-2">
                        💡 Your data should match these {field.head.length} columns in order
                      </div>
                      <button
                        onClick={() => {
                          // Generate sample data based on headers
                          const sampleData = [
                            field.head.map((header: string, idx: number) => `Sample ${header} ${idx + 1}`),
                            field.head.map((header: string, idx: number) => `Data ${header} ${idx + 1}`)
                          ];
                          handleInputChange(field.name, sampleData);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600 mt-2"
                      >
                        🔄 Generate Sample Data
                      </button>
                    </div>
                  )}
                  
                  <textarea
                    className="border rounded px-3 py-2 min-h-[120px] text-sm font-mono"
                    value={Array.isArray(fieldValue) ? JSON.stringify(fieldValue, null, 2) : fieldValue}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        handleInputChange(field.name, parsed);
                      } catch {
                        // Handle as string for now
                        handleInputChange(field.name, e.target.value);
                      }
                    }}
                    placeholder={`Table data in JSON format:\n[\n  ["${field.head?.[0] || 'col1'}", "${field.head?.[1] || 'col2'}", "${field.head?.[2] || 'col3'}"${field.head?.length > 3 ? ', ...' : ''}],\n  ["row2col1", "row2col2", "row2col3"${field.head?.length > 3 ? ', ...' : ''}]\n]`}
                  />
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>📊 Table format: JSON array of arrays representing rows and columns</div>
                    <div>🔢 Each inner array represents one row of data</div>
                    <div>⚠️ Note: The "content" field in template is just a placeholder - use this input for actual data</div>
                  </div>
                </div>
              ) : field.type === 'qrcode' ? (
                <input
                  type="text"
                  className="border rounded px-3 py-2 text-sm"
                  value={fieldValue}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder="Text to encode in QR code"
                />
              ) : field.type === 'line' || field.type === 'rectangle' ? (
                <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
                  🎨 This is a visual element (no text input needed)
                </div>
              ) : (
                <input
                  type="text"
                  className="border rounded px-3 py-2 text-sm"
                  value={fieldValue}
                  onChange={(e) => handleInputChange(field.name, e.target.value)}
                  placeholder={`Enter ${field.name}`}
                />
              )}
              
              {field.fontSize && (
                <div className="text-xs text-gray-400 mt-1">
                  Font size: {field.fontSize}px
                  {field.fontColor && ` • Color: ${field.fontColor}`}
                  {field.alignment && ` • Align: ${field.alignment}`}
                </div>
              )}
            </div>
          );
        })}
        
        <div className="mt-6 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-800 font-medium mb-1">
            📊 Template Info
          </div>
          <div className="text-xs text-blue-600">
            Fields: {fields.length}
            {typeof state.template.basePdf === 'object' && 'width' in state.template.basePdf && (
              <> • Size: {state.template.basePdf.width}×{state.template.basePdf.height}mm</>
            )}
          </div>
        </div>
      </div>
    );
  };

  const navItems: NavItem[] = [
    {
      label: "Import Template",
      content: (
        <div className="flex gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json"
            className="w-full text-sm border rounded"
            onChange={handleFileImport}
          />
          <button
            className="px-3 py-1 border rounded hover:bg-gray-100 whitespace-nowrap"
            onClick={() => fileInputRef.current?.click()}
          >
            Browse
          </button>
        </div>
      ),
    },
    {
      label: "Actions",
      content: (
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded hover:bg-gray-100 bg-blue-50 border-blue-300 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={generatePdfPreview}
            disabled={!state.template || state.isGenerating}
          >
            {state.isGenerating ? '⏳ Generating...' : '🔄 Generate PDF'}
          </button>
          <button
            className="px-3 py-1 border rounded hover:bg-gray-100 bg-green-50 border-green-300"
            onClick={downloadPdf}
            disabled={!state.generatedPdfUrl}
          >
            ⬇️ Download
          </button>
          <button
            className="px-3 py-1 border rounded hover:bg-gray-100 bg-red-50 border-red-300"
            onClick={clearAll}
          >
            🗑️ Clear All
          </button>
        </div>
      ),
    },
    {
      label: "Sample",
      content: (
        <div className="flex gap-2">
          <button
            className="px-3 py-1 border rounded hover:bg-gray-100 bg-yellow-50 border-yellow-300"
            onClick={() => {
              const sampleTemplate = `{
  "basePdf": { "width": 210, "height": 297, "padding": [20, 20, 20, 20] },
  "schemas": [[
    { "name": "company_name", "type": "text", "position": { "x": 20, "y": 25 }, "width": 170, "height": 12, "content": "Your Company Name", "fontSize": 18, "fontColor": "#2563eb", "alignment": "center" },
    { "name": "document_title", "type": "text", "position": { "x": 20, "y": 45 }, "width": 170, "height": 10, "content": "Business Document", "fontSize": 14, "alignment": "center" },
    { "name": "customer_name", "type": "text", "position": { "x": 20, "y": 80 }, "width": 80, "height": 8, "content": "Customer Name", "fontSize": 12 },
    { "name": "customer_email", "type": "text", "position": { "x": 110, "y": 80 }, "width": 80, "height": 8, "content": "customer@example.com", "fontSize": 12, "fontColor": "#2563eb" },
    { "name": "description", "type": "multiVariableText", "position": { "x": 20, "y": 100 }, "width": 170, "height": 60, "content": "This is a multi-line description field where you can enter detailed information.", "fontSize": 11, "lineHeight": 1.5 },
    { "name": "amount", "type": "text", "position": { "x": 130, "y": 180 }, "width": 60, "height": 8, "content": "$1,250.00", "fontSize": 12, "fontColor": "#059669", "alignment": "right" }
  ]],
  "pdfmeVersion": "5.0.0"
}`;
              handleJsonTextImport(sampleTemplate);
            }}
          >
            📋 Simple
          </button>
          <button
            className="px-3 py-1 border rounded hover:bg-gray-100 bg-orange-50 border-orange-300"
            onClick={async () => {
              try {
                const response = await fetch('/test-template.json');
                const templateData = await response.text();
                handleJsonTextImport(templateData);
              } catch (error) {
                toast.error('Failed to load test template');
                console.error(error);
              }
            }}
          >
            🧾 Invoice (JP)
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <NavBar items={navItems} />
      <div className="flex-1 flex">
        {/* Left Panel - Template Import & Data Input */}
        <div className="w-1/3 p-4 border-r bg-gray-50 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">📄 Template JSON</h3>
            <textarea
              className="w-full h-40 border rounded px-3 py-2 font-mono text-sm resize-none"
              placeholder="Paste JSON template here or use file import above..."
              onChange={(e) => {
                if (e.target.value.trim()) {
                  handleJsonTextImport(e.target.value);
                }
              }}
            />
            {state.template && (
              <div className="mt-2 text-sm text-green-600 font-medium">
                ✅ Template loaded successfully!
              </div>
            )}
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">📝 Data Input</h3>
            <div className="max-h-96 overflow-y-auto">
              {renderInputFields()}
            </div>
          </div>
        </div>

        {/* Right Panel - PDF Preview */}
        <div className="flex-1 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">📖 PDF Preview</h3>
            <div className="flex items-center gap-2">
              {state.isGenerating && (
                <span className="text-sm text-blue-600 font-medium flex items-center gap-1">
                  <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                  Generating PDF...
                </span>
              )}
              {state.generatedPdfUrl && !state.isGenerating && (
                <span className="text-sm text-green-600 font-medium">
                  ✅ PDF ready for download
                </span>
              )}
            </div>
          </div>
          {state.generatedPdfUrl ? (
            <iframe
              ref={pdfPreviewRef}
              src={state.generatedPdfUrl}
              className="w-full flex-1 border rounded min-h-[500px]"
              title="PDF Preview"
            />
          ) : (
            <div className="w-full flex-1 border rounded flex items-center justify-center bg-gray-100 min-h-[500px]">
              <div className="text-center text-gray-500">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-lg mb-2">No PDF generated yet</p>
                <p className="text-sm">Import a template and click "Generate PDF" to see preview</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default PdfViewer;
