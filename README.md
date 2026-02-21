# Mock API Server

一個簡化的 Mock API 伺服器，提供動態回應功能，支援各種測試場景。

## 🚀 快速開始

### 安裝與啟動

```bash
# 安裝依賴
npm install

# 啟動伺服器
node server.js
```

伺服器將在 `http://localhost:8084` 啟動。

## 📍 API 端點

### 主要端點

- **URL**: `/api/mock/dynamic`
- **方法**: 支援所有 HTTP 方法 (GET, POST, PUT, DELETE, PATCH 等)
- **功能**: 動態回應，支援多種測試場景

## ⚙️ 功能說明

### 1. Timeout 延遲回應

模擬網路延遲或慢速回應，用於測試應用程式在慢速網路下的表現。

#### 參數
- `timeout`: 延遲時間（毫秒）

#### 使用範例

**GET 請求：**
```bash
curl "http://localhost:8084/api/mock/dynamic?timeout=3000"
```

**POST 請求：**
```bash
curl -X POST http://localhost:8084/api/mock/dynamic \
  -H "Content-Type: application/json" \
  -d '{"timeout": 5000}'
```

**回應：**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "message": "Response after 5000ms delay"
  },
  "methodCode": null,
  "s1": null
}
```

### 2. HTTP 狀態碼模擬

模擬各種 HTTP 錯誤狀態，用於測試錯誤處理邏輯。

#### 參數
- `httpStatus`: HTTP 狀態碼

#### 支援的狀態碼

| 狀態碼 | 說明 |
|--------|------|
| 400 | 請求參數錯誤 |
| 401 | 未授權訪問 |
| 403 | 禁止訪問 |
| 404 | 資源不存在 |
| 409 | 資源衝突 |
| 422 | 請求格式錯誤 |
| 429 | 請求過於頻繁 |
| 500 | 伺服器內部錯誤 |
| 502 | 網關錯誤 |
| 503 | 服務暫時不可用 |
| 504 | 網關超時 |

#### 使用範例

```bash
# 模擬 500 錯誤
curl "http://localhost:8084/api/mock/dynamic?httpStatus=500"

# 模擬 404 錯誤
curl "http://localhost:8084/api/mock/dynamic?httpStatus=404"
```

**500 錯誤回應：**
```json
{
  "code": 500,
  "msg": "[500] 伺服器內部錯誤"
}
```

**404 錯誤回應：**
```json
{
  "code": 404,
  "msg": "[404] 資源不存在",
  "data": null,
  "methodCode": null,
  "s1": null
}
```

### 3. 自定義回應資料

返回自定義的 JSON 回應，用於模擬特定的 API 回應格式。

#### 參數
- `code`: 回應代碼
- `message`: 回應訊息
- `data`: 回應資料（JSON 格式）

#### 使用範例

**GET 請求：**
```bash
curl "http://localhost:8084/api/mock/dynamic?code=30000&message=網路連線不佳&data=%7B%22test%22:%22value%22%7D"
```

**POST 請求：**
```bash
curl -X POST http://localhost:8084/api/mock/dynamic \
  -H "Content-Type: application/json" \
  -d '{
    "code": 0,
    "message": "success",
    "data": {
      "userId": 123,
      "name": "測試用戶",
      "status": "active"
    }
  }'
```

**回應：**
```json
{
  "code": 0,
  "msg": "success",
  "data": {
    "userId": 123,
    "name": "測試用戶",
    "status": "active"
  },
  "methodCode": null,
  "s1": null
}
```

## 🔧 回應格式

所有回應都遵循統一的 JSON 格式：

```json
{
  "code": 0,
  "msg": "success",
  "data": { ... },
  "methodCode": null,
  "s1": null
}
```

### 欄位說明

- `code`: 回應代碼（0 表示成功，其他值表示錯誤）
- `msg`: 回應訊息
- `data`: 回應資料（可以是任何 JSON 格式）
- `methodCode`: 方法代碼（通常為 null）
- `s1`: 額外欄位（通常為 null）

## 📝 使用場景

### 1. 前端開發測試
模擬後端 API 回應，讓前端開發者可以在後端 API 完成前進行開發和測試。

```javascript
// 前端代碼範例
fetch('/api/mock/dynamic?code=0&message=success&data={"users":[]}')
  .then(response => response.json())
  .then(data => {
    console.log('API 回應:', data);
  });
```

### 2. 網路延遲測試
測試應用程式在慢速網路下的表現和用戶體驗。

```javascript
// 測試 3 秒延遲
fetch('/api/mock/dynamic?timeout=3000')
  .then(response => response.json())
  .then(data => {
    console.log('延遲回應:', data);
  });
```

### 3. 錯誤處理測試
模擬各種錯誤情況，測試應用程式的錯誤處理邏輯。

```javascript
// 測試 500 錯誤
fetch('/api/mock/dynamic?httpStatus=500')
  .then(response => {
    if (!response.ok) {
      throw new Error('伺服器錯誤');
    }
    return response.json();
  })
  .catch(error => {
    console.error('錯誤處理:', error);
  });
```

### 4. API 整合測試
提供穩定的測試環境，用於自動化測試。

```bash
# 測試腳本範例
#!/bin/bash

# 測試成功回應
curl -s "http://localhost:8084/api/mock/dynamic?code=0&message=success" | jq .

# 測試錯誤回應
curl -s "http://localhost:8084/api/mock/dynamic?httpStatus=500" | jq .

# 測試延遲回應
time curl -s "http://localhost:8084/api/mock/dynamic?timeout=2000" | jq .
```

## 🌐 伺服器配置

### 環境設定

- **Port**: 8084
- **CORS**: 已啟用，支援以下來源：
  - `http://localhost:3000`
  - `http://0.0.0.0:3000`
  - `https://uatweb.nonfood.mcddailyapp.com.tw`

### 靜態文件服務

伺服器支援靜態文件服務，可以放置 HTML、CSS、JS 等文件在 `public` 目錄中。

## 🔍 除錯與日誌

伺服器會在控制台輸出詳細的請求日誌：

```
[Mock Dynamic] Method: GET, Params: { timeout: '3000' }
[Mock Dynamic] Timeout: 3000ms
```

## 📚 進階用法

### 組合使用

可以同時使用多個功能：

```bash
# 延遲 2 秒後返回 500 錯誤
curl "http://localhost:8084/api/mock/dynamic?timeout=2000&httpStatus=500"
```

### 複雜資料結構

```bash
curl -X POST http://localhost:8084/api/mock/dynamic \
  -H "Content-Type: application/json" \
  -d '{
    "code": 0,
    "message": "用戶資料獲取成功",
    "data": {
      "user": {
        "id": 123,
        "name": "張三",
        "email": "zhang@example.com",
        "profile": {
          "age": 30,
          "city": "台北市",
          "interests": ["程式設計", "音樂", "旅行"]
        }
      },
      "permissions": ["read", "write"],
      "lastLogin": "2024-01-15T10:30:00Z"
    }
  }'
```

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request 來改善這個 Mock API 伺服器。

## 📄 授權

MIT License
