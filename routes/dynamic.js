import express from 'express'
const router = express.Router()

// 為了維持與原 server.js 邏輯一致，將原本的 app.all 邏輯移過來
// 注意：原本掛載點是 /api/mock/dynamic，所以這裡的 path 設為 ['/', '/*']
// 因為在 server.js 中會使用 app.use('/api/mock/dynamic', dynamicRouter)

router.all(['/', '/*'], (req, res) => {
  // 從 query (GET) 或 body (POST) 中取得參數
  const params = req.method === 'GET' ? req.query : req.body

  console.log(`[Mock Dynamic] Method: ${req.method}, Params:`, params)

  // 檢查是否啟用原始回應模式 (不包裝 code/msg)
  const isRaw = params.raw === 'true' || params.raw === true || params.raw === '1'

  // 解析 responseData (優先解析，供後續使用)
  let responseData = null
  if (req.method === 'POST') {
    responseData = params.data
  } else if (params.data) {
    try {
      responseData = JSON.parse(decodeURIComponent(params.data))
    } catch (error) {
      console.log(`[Mock Dynamic] JSON parse error: ${error.message}`)
      responseData = params.data // 如果解析失敗，直接使用原始字符串
    }
  }

  // 檢查是否有 delay 參數（延遲後返回成功回應）
  if (params.delay) {
    const delayMs = parseInt(params.delay)
    console.log(`[Mock Dynamic] Delay: ${delayMs}ms`)
    
    setTimeout(() => {
      if (isRaw) {
         return res.status(200).json(responseData)
      }

      res.status(200).json({
        code: 0,
        msg: 'success',
        data: { message: `Response after ${delayMs}ms delay` },
        methodCode: null,
        s1: null
      })
    }, delayMs)
    return
  }

  // 檢查是否有 timeout 參數（超時錯誤）
  if (params.timeout) {
    const timeoutMs = parseInt(params.timeout)
    console.log(`[Mock Dynamic] Timeout: ${timeoutMs}ms`)
    
    setTimeout(() => {
      // 如果是用戶自定義的 timeout 測試，Raw 模式下可能也希望回傳自定義 body
      if (isRaw) {
        return res.status(408).json(responseData)
      }

      res.status(408).json({
        code: 408,
        msg: '[408] Request Timeout',
        data: { message: `Request timed out after ${timeoutMs}ms` },
        methodCode: null,
        s1: null
      })
    }, timeoutMs)
    return
  }

  // 檢查是否是 HTTP 狀態碼模式
  if (params.httpStatus) {
    const httpStatus = parseInt(params.httpStatus)

    console.log(`[Mock Dynamic] HTTP Status: ${httpStatus}`)

    if (isRaw) {
      return res.status(httpStatus).json(responseData)
    }

    const errorMessages = {
      400: { code: 400, msg: '[400] 請求參數錯誤' },
      401: { code: 401, msg: '[401] 未授權訪問' },
      403: { code: 403, msg: '[403] 禁止訪問' },
      404: { code: 404, msg: '[404] 資源不存在' },
      409: { code: 409, msg: '[409] 資源衝突' },
      422: { code: 422, msg: '[422] 請求格式錯誤' },
      429: { code: 429, msg: '[429] 請求過於頻繁' },
      500: { code: 500, msg: '[500] 伺服器內部錯誤' },
      502: { code: 502, msg: '[502] 網關錯誤' },
      503: { code: 503, msg: '[503] 服務暫時不可用' },
      504: { code: 504, msg: '[504] 網關超時' }
    }

    // 定義回應預設結構
    const defaultResponse = {
      data: null, // Error response usually has null data unless specified otherwise
      methodCode: null,
      s1: null
    }

    // 取得基礎錯誤訊息物件
    const baseError = errorMessages[httpStatus]

    // 其他錯誤回傳
    return res.status(httpStatus).json({
      ...defaultResponse,
      ...(baseError || {
        code: httpStatus,
        msg: `[${httpStatus}]${httpStatus >= 500 ? '伺服器錯誤' : '錯誤'}`
      })
    })
  }

  // 原有的完整 Mock 資料模式 (Success case)
  const code = parseInt(params.code || '0')
  const message = params.message || null
  
  // 如果是 Raw 模式，直接回傳 responseData
  if (isRaw) {
    console.log(`[Mock Dynamic] Raw Response Mode`)
    return res.status(200).json(responseData)
  }

  console.log(`[Mock Dynamic] API: ${params.api}, code=${code}, message=${message}`)

  res.status(200).json({
    code,
    msg: code ? `[${code}] ${message}` : message,
    data: responseData,
    methodCode: null,
    s1: null
  })
})

export default router
