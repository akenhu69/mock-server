import express from 'express'
import { readFile, writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { generateFromSchema } from '../lib/fake-generator.js'

const router = express.Router()
const __dirname = dirname(fileURLToPath(import.meta.url))
const SCHEMAS_DIR = join(__dirname, '../schemas')
const INDEX_FILE  = join(SCHEMAS_DIR, 'index.json')

// ── 工具函式 ─────────────────────────────────────────

async function ensureSchemasDir() {
  if (!existsSync(SCHEMAS_DIR)) {
    await mkdir(SCHEMAS_DIR, { recursive: true })
  }
}

async function readIndex() {
  await ensureSchemasDir()
  if (!existsSync(INDEX_FILE)) {
    await writeFile(INDEX_FILE, JSON.stringify({ schemas: [] }, null, 2), 'utf8')
    return { schemas: [] }
  }
  return JSON.parse(await readFile(INDEX_FILE, 'utf8'))
}

async function writeIndex(data) {
  await writeFile(INDEX_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}

// ── 基礎驗證 ─────────────────────────────────────────

function isValidSchema(schema) {
  if (!schema || typeof schema !== 'object') return false
  // 允許有 type 或有 properties 的 schema
  return schema.type || schema.properties || schema.$schema || schema.definitions
}

// ── Routes ───────────────────────────────────────────

/**
 * GET /api/schema/list
 * 列出所有 schemas
 */
router.get('/list', async (req, res) => {
  try {
    const { schemas } = await readIndex()
    res.json({
      code: 0,
      msg: 'success',
      data: schemas
    })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

/**
 * POST /api/schema/import
 * 匯入 JSON Schema（body 或貼上）
 * Body: { name: string, schema: object }
 */
router.post('/import', async (req, res) => {
  try {
    const { name, schema } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ code: 400, msg: '請提供 Schema 名稱 (name)' })
    }
    if (!isValidSchema(schema)) {
      return res.status(400).json({ code: 400, msg: '無效的 JSON Schema，請確認格式正確' })
    }

    const id = generateId()
    const entry = {
      id,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      fieldCount: Object.keys(schema.properties || {}).length,
      rootType: schema.type || 'object'
    }

    // 儲存 schema 檔案
    const schemaFile = join(SCHEMAS_DIR, `${id}.schema.json`)
    await writeFile(schemaFile, JSON.stringify(schema, null, 2), 'utf8')

    // 更新索引
    const index = await readIndex()
    index.schemas.unshift(entry)
    await writeIndex(index)

    res.status(201).json({
      code: 0,
      msg: '匯入成功',
      data: entry
    })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

/**
 * POST /api/schema/import-url
 * 從 URL 下載並匯入 JSON Schema
 * Body: { name: string, url: string }
 */
router.post('/import-url', async (req, res) => {
  try {
    const { name, url } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ code: 400, msg: '請提供 Schema 名稱 (name)' })
    }
    if (!url || !url.startsWith('http')) {
      return res.status(400).json({ code: 400, msg: '請提供有效的 URL' })
    }

    // Fetch the schema
    let schema
    try {
      const response = await fetch(url, {
        headers: { 'Accept': 'application/json' },
        signal: AbortSignal.timeout(10000)
      })
      if (!response.ok) {
        return res.status(400).json({ code: 400, msg: `無法取得 URL 內容：HTTP ${response.status}` })
      }
      schema = await response.json()
    } catch (fetchErr) {
      return res.status(400).json({ code: 400, msg: `Fetch 失敗：${fetchErr.message}` })
    }

    if (!isValidSchema(schema)) {
      return res.status(400).json({ code: 400, msg: '取得的內容不是有效的 JSON Schema' })
    }

    const id = generateId()
    const entry = {
      id,
      name: name.trim(),
      sourceUrl: url,
      createdAt: new Date().toISOString(),
      fieldCount: Object.keys(schema.properties || {}).length,
      rootType: schema.type || 'object'
    }

    const schemaFile = join(SCHEMAS_DIR, `${id}.schema.json`)
    await writeFile(schemaFile, JSON.stringify(schema, null, 2), 'utf8')

    const index = await readIndex()
    index.schemas.unshift(entry)
    await writeIndex(index)

    res.status(201).json({ code: 0, msg: '從 URL 匯入成功', data: entry })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

/**
 * GET /api/schema/:id
 * 取得單一 schema 定義
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const schemaFile = join(SCHEMAS_DIR, `${id}.schema.json`)

    if (!existsSync(schemaFile)) {
      return res.status(404).json({ code: 404, msg: '找不到指定的 Schema' })
    }

    const schema = JSON.parse(await readFile(schemaFile, 'utf8'))
    const { schemas } = await readIndex()
    const meta = schemas.find(s => s.id === id)

    res.json({ code: 0, msg: 'success', data: { meta, schema } })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

/**
 * DELETE /api/schema/:id
 * 刪除 schema
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const schemaFile = join(SCHEMAS_DIR, `${id}.schema.json`)

    if (!existsSync(schemaFile)) {
      return res.status(404).json({ code: 404, msg: '找不到指定的 Schema' })
    }

    const { unlink } = await import('fs/promises')
    await unlink(schemaFile)

    const index = await readIndex()
    index.schemas = index.schemas.filter(s => s.id !== id)
    await writeIndex(index)

    res.json({ code: 0, msg: '刪除成功' })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

/**
 * POST /api/schema/:id/generate
 * 依照 schema 生成假資料
 * Body: { count: number (default 10) }
 */
router.post('/:id/generate', async (req, res) => {
  try {
    const { id } = req.params
    const count = Math.min(parseInt(req.body.count || 10), 500) // 最多 500 筆

    if (count < 1) {
      return res.status(400).json({ code: 400, msg: 'count 必須為正整數' })
    }

    const schemaFile = join(SCHEMAS_DIR, `${id}.schema.json`)
    if (!existsSync(schemaFile)) {
      return res.status(404).json({ code: 404, msg: '找不到指定的 Schema' })
    }

    const schema = JSON.parse(await readFile(schemaFile, 'utf8'))
    const fakeData = generateFromSchema(schema, count)

    res.json({
      code: 0,
      msg: 'success',
      data: {
        count: fakeData.length,
        items: fakeData
      }
    })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

export default router
