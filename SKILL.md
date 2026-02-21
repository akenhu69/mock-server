---
name: mock-server-assistant
description: |
  協助開發與維護 Express Mock API Server 的 AI 技能。
  能夠新增路由、調整假資料、生成 Schema 和設計前端 UI。
---

# Mock Server Assistant

## 核心能力

### 1. 新增 Mock 路由 (add-route)
根據需求新增 Express 路由，遵循 ESM 規範，自動更新 `server.js`。

**觸發方式**：使用 `/add-route` slash command

**輸入**：
- 路由路徑（如 `/api/payment`）
- HTTP 方法（GET/POST/PUT/DELETE）
- 預期回應結構（JSON）

**輸出**：
- 新的路由檔案 `routes/{name}.js`
- 更新 `server.js` 掛載點

---

### 2. 假資料生成 (gen-fake-data)
依照 JSON Schema 定義或欄位描述，生成符合格式的假資料 JSON。

**觸發方式**：使用 `/gen-fake-data` slash command

**輸入**：
- JSON Schema 定義
- 或自然語言描述欄位（如「id, name, email, age, isActive」）
- 生成筆數

**輸出**：
- JSON 陣列，放入 `data/{name}.json`

---

### 3. Schema 管理 (schema-manager)
協助使用者：
- 解析外部 API 文件並轉為 JSON Schema
- 驗證 JSON Schema 格式
- 從現有 JSON 資料反推 schema

---

### 4. 前端 UI 調整 (update-ui)
修改 `public/index.html` 的文件頁面：
- 新增功能卡片
- 更新參數表格
- 新增使用範例

---

### 5. CORS 設定調整 (update-cors)
安全地新增或移除 CORS 白名單中的 origin。

---

## 使用須知

- 本專案使用 **ESM**，所有檔案用 `import/export`，不用 `require`
- 假資料儲存在 `data/` 目錄（JSON 陣列格式）
- Schema 定義儲存在 `schemas/` 目錄
- 前端用 Tailwind CSS CDN，不需 build step

## 參考
- [CLAUDE.md](./CLAUDE.md) — 完整專案開發規範
- [README.md](./README.md) — 使用者文件
- [API.md](./API.md) — API 參考
