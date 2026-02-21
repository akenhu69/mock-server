import express from 'express'
const router = express.Router()

// 記憶體中儲存使用者的等待狀態
// Key: cookie (string), Value: startTime (timestamp)
const waitingSessions = new Map()

// 設定總等待時間 (秒)
const TOTAL_WAIT_SECONDS = 60

router.all('/', (req, res) => {
  // 1. 檢查 Accept Header
  const acceptHeader = req.headers['accept']
  if (acceptHeader !== 'application/json') {
    return res.status(200).send('<!DOCTYPE html><html><body><h1>Cloudflare Waiting Room</h1><p>Please use Accept: application/json for API access.</p></body></html>')
  }

  // 2. Cookie 處理
  let cfWaitingRoomCookie = req.cookies && req.cookies['__cfwaitingroom']
  let isNewUser = false

  // 如果沒有 cookie，生成一個新的
  if (!cfWaitingRoomCookie) {
    cfWaitingRoomCookie = 'mock-cookie-' + Date.now()
    isNewUser = true
  }

  // 3. 狀態與倒數計時邏輯
  const now = Date.now()
  let session = waitingSessions.get(cfWaitingRoomCookie)

  // 取得請求中的 duration 參數 (如果有)，預設 60 秒
  const queryDuration = req.query.duration ? parseInt(req.query.duration) : null

  // 如果是新用戶，或者這個 cookie 沒有記錄
  // 或者如果使用者刻意帶了 status=waiting，代表想重置
  if (!session || req.query.status === 'waiting') {
    session = {
      startTime: now,
      duration: queryDuration || TOTAL_WAIT_SECONDS
    }
    waitingSessions.set(cfWaitingRoomCookie, session)
  } 
  // 如果已經有 session 但使用者想改 duration (且不是重置狀態)，我們可以選擇更新或忽略
  // 這裡選擇：如果帶了 duration 就更新總時長，但起點不變 (這會導致 remaining 瞬間變動，方便測試)
  else if (queryDuration) {
    session.duration = queryDuration
    waitingSessions.set(cfWaitingRoomCookie, session)
  }

  // 計算已經過時間 (秒)
  const elapsedSeconds = (now - session.startTime) / 1000
  let remainingSeconds = session.duration - elapsedSeconds

  // 強制狀態覆蓋 (用於測試)
  if (req.query.status === 'allowed') {
    remainingSeconds = -1
  }

  // 判斷是否還在等待室
  const inWaitingRoom = remainingSeconds > 0
  const waitTime = inWaitingRoom ? Math.ceil(remainingSeconds / 60) : 0 // Cloudflare 通常顯示分鐘
  const waitTimeSeconds = inWaitingRoom ? Math.ceil(remainingSeconds) : 0
  
  // 格式化顯示時間 (模擬真實 Cloudflare 行為，只顯示分鐘)
  let waitTimeFormatted = "0 minutes"
  if (inWaitingRoom) {
      if (waitTime > 1) {
          waitTimeFormatted = `${waitTime} minutes`
      } else {
          waitTimeFormatted = "less than a minute"
      }
  }

  // 判斷是否為 HTTPS (包含 Proxy 後)
  const isSecure = req.secure || req.headers['x-forwarded-proto'] === 'https'

  // 更新 Cookie (模擬 Cloudflare)
  res.cookie('__cfwaitingroom', cfWaitingRoomCookie, { 
    maxAge: 900000, // 15 min
    httpOnly: true,
    secure: isSecure, 
    sameSite: isSecure ? 'None' : 'Lax'
  })

  // 建構回應
  const response = {
    "cfWaitingRoom": {
      "inWaitingRoom": inWaitingRoom,
      "waitTime": waitTime, // Cloudflare 單位通常是分鐘，但也可能是動態的，這裡我們主要看 inWaitingRoom
      "waitTimeKnown": true,
      "waitTimeFormatted": waitTimeFormatted,
      "queueIsFull": false,
      "queueAll": false,
      "lastUpdated": new Date().toISOString(),
      "refreshIntervalSeconds": 20 // Cloudflare default
    }
  }

  // 決定 HTTP Status Code
  // 用戶排隊中 (inWaitingRoom: true) -> 429 Conflict
  // 用戶已通過 (inWaitingRoom: false) -> 200 OK
  const statusCode = inWaitingRoom ? 429 : 200

  return res.status(statusCode).json(response)
})

export default router
