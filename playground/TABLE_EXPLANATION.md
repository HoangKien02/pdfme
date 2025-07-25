# Table Data Structure in pdfme

## Understanding Table Components

When working with tables in pdfme, there are three key components that might seem confusing but serve different purposes:

### 1. Table Headers (`head`)
```json
"head": ["物品名", "数量", "単価", "金額"]
```
- **Purpose**: These are the visible column headers shown in the generated PDF
- **Location**: Defined in the template schema
- **Display**: These appear as the first row of your table in the PDF

### 2. Template Content (`content`)
```json
"content": "[[\"[出庫] 物品名\",\"[出庫] 出庫数量\",\"[出庫] 納品単価\",\"[出庫] 金額\"]]"
```
- **Purpose**: This is just a placeholder/example showing the expected data structure
- **Location**: Defined in the template schema
- **Usage**: This is NOT the actual data - it's just a template reference

### 3. Input Data (your actual data)
```json
"入力項目18": [
  ["A,B,C", "12", "1", "12"]
]
```
- **Purpose**: This is the actual data that fills your table
- **Location**: Provided in the inputs when generating the PDF
- **Structure**: Array of arrays, where each inner array represents one row

## How They Work Together

1. **Headers are shown**: The PDF displays `["物品名", "数量", "単価", "金額"]` as column headers
2. **Data fills rows**: Your input data `[["A,B,C", "12", "1", "12"]]` becomes the table rows
3. **Template content is ignored**: The `content` field is just for reference

## The "Mismatch" Explained

The confusion comes from the fact that:
- **Headers**: `["物品名", "数量", "単価", "金額"]` (Japanese names)
- **Template content**: `["[出庫] 物品名", "[出庫] 出庫数量", "[出庫] 納品単価", "[出庫] 金額"]` (Field references)

**This is not a bug!** The template content field is just showing what kind of data structure is expected. The actual headers and data come from the `head` array and your input data respectively.

## Correct Usage

To fix your table data:

1. **Keep the headers as they are** (they're correct): `["物品名", "数量", "単価", "金額"]`
2. **Provide data that matches the column count**:
   ```json
   [
     ["商品A", "5", "100", "500"],
     ["商品B", "3", "200", "600"],
     ["商品C", "2", "150", "300"]
   ]
   ```

## Example Fix for Your Data

Instead of:
```json
[["A,B,C", "12", "1", "12"]]
```

Use something like:
```json
[
  ["ノートPC", "2", "50000", "100000"],
  ["マウス", "5", "1000", "5000"],
  ["キーボード", "3", "3000", "9000"]
]
```

This way:
- Column 1 (物品名): Product names
- Column 2 (数量): Quantities  
- Column 3 (単価): Unit prices
- Column 4 (金額): Total amounts
