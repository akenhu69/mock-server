import cors from 'cors'
import express from 'express'
import cookieParser from 'cookie-parser'

// 引入路由
import dynamicRouter from './routes/dynamic.js'
import waitingRoomRouter from './routes/waiting-room.js'
import schemaRouter from './routes/schema.js'

const app = express()
const PORT = 8084

// 啟用 CORS
app.use(cors({ origin: ['http://localhost:3000','http://localhost:3001', 'http://0.0.0.0:3000', 'https://uatweb.nonfood.mcddailyapp.com.tw'], credentials: true }))

// 設置 Cookie 解析
app.use(cookieParser())

// 設置 JSON 解析
app.use(express.json())

// 設置靜態文件服務
app.use(express.static('public'))

// ===== 首頁路由 =====

// 首頁重定向到靜態文件
app.get('/', (req, res) => {
  res.redirect('/index.html')
})

// ===== 掛載路由 =====

// 動態 Mock API
app.use('/api/mock/dynamic', dynamicRouter)

// Cloudflare Waiting Room
app.use('/api/waiting-room', waitingRoomRouter)

// Schema Manager & Fake Data Generator
app.use('/api/schema', schemaRouter)


// 啟動服務器
app.listen(PORT, () => {
  console.log(`Mock API server running at http://localhost:${PORT}/api`)
})
