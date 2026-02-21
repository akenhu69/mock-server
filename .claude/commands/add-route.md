---
description: 快速新增一個 Express 路由模板
---

依照以下步驟新增一個新的 Express 路由：

1. 在 `routes/` 建立新路由檔案 `routes/{name}.js`，內容如下：

```js
import express from 'express'
const router = express.Router()

router.get('/', (req, res) => {
  res.json({
    code: 0,
    msg: 'success',
    data: []
  })
})

export default router
```

2. 在 `server.js` 新增 import 和掛載：

```js
import {name}Router from './routes/{name}.js'
app.use('/api/{name}', {name}Router)
```

3. 更新 `CLAUDE.md` 的「現有 API 端點」表格，新增新路由說明。

注意事項：
- 使用 ESM 語法（import/export），不用 require
- 路由前綴統一用 `/api/` 開頭
- 回傳格式建議遵循 `{ code, msg, data }` 結構
