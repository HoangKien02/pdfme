# PDF Viewer - Import JSON và Show PDF

## Tổng quan
Chức năng **PDF Viewer** cho phép bạn import file JSON template và tạo PDF real-time dựa trên data input. Đây là chức năng ngược với Designer - thay vì tạo template, bạn sử dụng template có sẵn để tạo PDF.

## Workflow

### 1. Import Template JSON
- **Cách 1**: Sử dụng file input để upload file `.json`
- **Cách 2**: Paste JSON trực tiếp vào textarea
- **Cách 3**: Sử dụng "Load Sample" để test nhanh

### 2. Điền Data
- Form input sẽ tự động được tạo dựa trên schema của template
- Mỗi field trong template sẽ có input tương ứng
- Support nhiều loại field: text, multiVariableText, image, etc.

### 3. Generate PDF
- PDF được tạo real-time khi bạn thay đổi data (debounce 500ms)
- Hoặc click nút "Generate PDF" để tạo manual
- Preview trực tiếp trong iframe

### 4. Download PDF
- Click "Download" để tải file PDF về máy

## Ví dụ Template JSON

```json
{
  "basePdf": {
    "width": 210,
    "height": 297,
    "padding": [20, 20, 20, 20]
  },
  "schemas": [
    [
      {
        "name": "title",
        "type": "text",
        "position": { "x": 20, "y": 30 },
        "width": 170,
        "height": 15,
        "content": "Sample Document",
        "fontSize": 16,
        "alignment": "center"
      },
      {
        "name": "name",
        "type": "text",
        "position": { "x": 20, "y": 60 },
        "width": 80,
        "height": 10,
        "content": "John Doe",
        "fontSize": 12
      },
      {
        "name": "email",
        "type": "text",
        "position": { "x": 110, "y": 60 },
        "width": 80,
        "height": 10,
        "content": "john@example.com",
        "fontSize": 12
      }
    ]
  ]
}
```

## Features

### ✅ Đã implement
- Import JSON từ file hoặc text
- Auto-generate form input từ template schema
- Real-time PDF generation với debounce
- PDF preview trong iframe
- Download PDF
- Sample template để test nhanh
- Memory management (URL cleanup)
- Error handling với toast notifications
- Responsive UI với icons

### 🚀 Có thể mở rộng
- Drag & drop file upload
- Multiple templates support
- Batch PDF generation
- PDF history/cache
- Template validation với better error messages
- Export data as JSON
- Print functionality
- Full screen preview mode

## Cách sử dụng

1. Mở `http://localhost:5174/pdf-viewer`
2. Click "Load Sample" để test nhanh hoặc import template JSON của bạn
3. Điền data vào form bên trái
4. Xem PDF preview bên phải
5. Click "Download" để tải PDF

## So sánh với các chức năng khác

| Chức năng | Mục đích | Input | Output |
|-----------|----------|--------|--------|
| **Designer** | Tạo template | Drag & drop elements | Template JSON |
| **Form/Viewer** | Điền form và xem | Template + Data | PDF preview |
| **PDF Viewer** | Import template và tạo PDF | Template JSON + Data | PDF file |

**PDF Viewer** là cầu nối hoàn hảo giữa Designer và việc sử dụng template trong production. Bạn có thể export template từ Designer, sau đó import vào PDF Viewer để tạo PDF hàng loạt.
