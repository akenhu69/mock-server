---
description: 從 JSON Schema 或自然語言描述產生假資料
---

依照以下步驟產生假資料：

1. **確認輸入格式**：使用者可提供以下任一：
   - JSON Schema 定義（推薦）
   - 欄位清單（如：`id: number, name: string, email: email`）
   - 現有 JSON 範例（反推 schema）

2. **呼叫後端 API 生成資料**：
   - 先用 `POST /api/schema/import` 匯入 schema
   - 再用 `POST /api/schema/:id/generate` 產生假資料
   - 或直接呼叫 `lib/fake-generator.js` 的 `generateFromSchema(schema, count)`

3. **範例 Schema**：
```json
{
  "type": "object",
  "properties": {
    "id": { "type": "number" },
    "name": { "type": "string", "format": "name" },
    "email": { "type": "string", "format": "email" },
    "createdAt": { "type": "string", "format": "date" },
    "active": { "type": "boolean" }
  }
}
```

4. **支援的 format 類型**：
   - `name` → 隨機姓名
   - `email` → `user_xxx@example.com`
   - `date` → `2024-xx-xx`
   - `uuid` → UUID v4
   - `url` → `https://example.com/xxx`
   - `phone` → `09xx-xxx-xxx`

5. 將生成的假資料存入 `data/{name}.json`（JSON 陣列格式）。
