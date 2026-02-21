# CLAUDE.md — Mock API Server

> 給 AI 助手（Claude、Gemini 等）的專案說明文件。

## 專案概覽

這是一個輕量級 Express Mock API Server，用於前端開發測試。

| 項目 | 說明 |
|------|------|
| 語言 | JavaScript (Node.js ESM — `"type": "module"`) |
| 框架 | Express 4.x |
| 套件管理 | pnpm |
| Port | 8084 |
| 啟動指令 | `node server.js` |

## 目錄結構

```
mock-server/
├── server.js          ← 主程式，掛載所有路由
├── routes/
│   ├── dynamic.js     ← /api/mock/dynamic — 動態 Mock API
│   ├── waiting-room.js← /api/waiting-room — CF Waiting Room 模擬
│   └── schema.js      ← /api/schema — Schema 管理 & 假資料生成
├── lib/
│   └── fake-generator.js ← 純 JS 假資料生成器
├── data/              ← 靜態 JSON 資料集 (products, users, orders...)
├── schemas/           ← 使用者匯入的 JSON Schema 定義
│   └── index.json     ← Schema 索引（id, name, createdAt）
├── public/            ← 靜態前端頁面 (Tailwind CSS)
│   ├── index.html     ← 主文件頁面（Tab 式設計）
│   ├── script.js      ← 前端互動邏輯
│   ├── markdown.js    ← Markdown 複製功能
│   └── style.css      ← 額外 CSS
├── CLAUDE.md          ← 本文件
├── SKILL.md           ← AI 技能描述
├── README.md          ← 使用者文件
└── API.md             ← API 參考文件
```

## 路由規範

新增路由的標準流程：

1. 在 `routes/` 建立新的路由檔案（使用 `express.Router()`）
2. 在 `server.js` 以 `import` 引入並掛載

```js
// routes/my-feature.js
import express from 'express'
const router = express.Router()

router.get('/', (req, res) => {
  res.json({ data: [] })
})

export default router
```

```js
// server.js — 新增掛載
import myFeatureRouter from './routes/my-feature.js'
app.use('/api/my-feature', myFeatureRouter)
```

> ⚠️ 注意：專案使用 **ESM** (`import/export`)，禁止使用 `require()`。

## 資料層規範

- 靜態假資料放在 `data/*.json`（JSON 陣列格式）
- Schema 定義放在 `schemas/*.schema.json`
- 讀寫資料使用 Node.js `fs` 模組（`fs/promises`）

```js
// 讀取 JSON 檔案範例
import { readFile, writeFile } from 'fs/promises'
const data = JSON.parse(await readFile('./data/users.json', 'utf8'))
```

## 前端設計規範

- 前端使用 **Tailwind CSS** (CDN) + 原生 JavaScript
- 設計為 Tab 式單頁應用
- 新增功能請在 `index.html` 新增對應 Tab
- 共用函式放在 `script.js`

## 現有 API 端點

### Dynamic Mock API
```
ALL /api/mock/dynamic
  ?delay=3000         → 延遲 N ms 後 200 OK
  ?timeout=2000       → 延遲 N ms 後 408 Timeout
  ?httpStatus=500     → 回傳指定 HTTP 狀態碼
  ?code=0&message=ok  → 自定義 Wrapper 內容
  ?raw=true           → 不使用 Wrapper 直接回傳 data
```

### Waiting Room
```
ALL /api/waiting-room
  ?status=waiting     → 重置，進入排隊狀態 (409)
  ?status=allowed     → 強制通過 (200)
  ?duration=120       → 設定排隊秒數
```

### Schema Manager
```
GET    /api/schema/list
POST   /api/schema/import            ← body: { name, schema }
POST   /api/schema/import-url        ← body: { name, url }
DELETE /api/schema/:id
POST   /api/schema/:id/generate      ← body: { count }
```

## CORS 白名單

```js
// server.js
cors({ origin: [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://0.0.0.0:3000',
  'https://uatweb.nonfood.mcddailyapp.com.tw'
]})
```

新增開發 origin 時請修改 `server.js` 的 CORS 設定。

## 常見任務

| 任務 | 說明 |
|------|------|
| 新增路由 | 用 `/add-route` slash command 或參考路由規範 |
| 產生假資料 | 用 `/gen-fake-data` slash command |
| 修改假資料 | 直接編輯 `data/*.json` |
| 新增靜態頁面 | 放到 `public/` 目錄 |
