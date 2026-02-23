import express from 'express'
import { readFile, writeFile, mkdir, rm } from 'fs/promises'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { generateFromSchema } from '../lib/fake-generator.js'

const router = express.Router()
const __dirname = dirname(fileURLToPath(import.meta.url))
const SCHEMAS_DIR = join(__dirname, '../schemas')
const PROJECTS_DIR = join(SCHEMAS_DIR, 'projects')
const INDEX_FILE  = join(SCHEMAS_DIR, 'index.json')

// ── 工具函式 ─────────────────────────────────────────

async function ensureDirs() {
  if (!existsSync(SCHEMAS_DIR)) {
    await mkdir(SCHEMAS_DIR, { recursive: true })
  }
  if (!existsSync(PROJECTS_DIR)) {
    await mkdir(PROJECTS_DIR, { recursive: true })
  }
}

async function readIndex() {
  await ensureDirs()
  if (!existsSync(INDEX_FILE)) {
    const initData = { schemas: [], projects: [] }
    await writeFile(INDEX_FILE, JSON.stringify(initData, null, 2), 'utf8')
    return initData
  }
  const data = JSON.parse(await readFile(INDEX_FILE, 'utf8'))
  if (!data.projects) data.projects = []
  return data
}

async function writeIndex(data) {
  await writeFile(INDEX_FILE, JSON.stringify(data, null, 2), 'utf8')
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 7)
}

function isValidSchema(schema) {
  if (!schema || typeof schema !== 'object') return false
  return schema.type || schema.properties || schema.$schema || schema.definitions || schema.items
}

// 遞迴解析 OpenAPI 的 $ref
function resolveRefs(schema, rootSchema, depth = 0) {
  if (depth > 20) return schema // 避免無窮迴圈
  if (!schema || typeof schema !== 'object') return schema
  if (Array.isArray(schema)) {
    return schema.map(item => resolveRefs(item, rootSchema, depth + 1))
  }
  if (schema.$ref) {
    const refPath = schema.$ref.replace('#/', '').split('/')
    let resolved = rootSchema
    for (const key of refPath) {
      if (resolved && resolved[key] !== undefined) {
        resolved = resolved[key]
      } else {
        resolved = null
        break
      }
    }
    if (resolved) {
       const res = resolveRefs(resolved, rootSchema, depth + 1)
       if (schema.description && !res.description) res.description = schema.description
       return res
    }
    return schema
  }
  const result = {}
  for (const [key, value] of Object.entries(schema)) {
    result[key] = resolveRefs(value, rootSchema, depth + 1)
  }
  return result
}

// 抓取並解析 OpenAPI Spec，回傳 schemas 陣列並直接寫入指定 project 目錄
async function processOpenAPI(url, projectId) {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/json' },
    signal: AbortSignal.timeout(15000)
  })
  if (!response.ok) {
    throw new Error(`無法取得 URL 內容：HTTP ${response.status}`)
  }
  const spec = await response.json()
  
  let targetSchemas = {}
  if (spec.components && spec.components.schemas) {
    targetSchemas = spec.components.schemas
  } else if (spec.definitions) {
    targetSchemas = spec.definitions
  } else {
    throw new Error('在此檔案中找不到 OpenAPI/Swagger 的 schemas 或 definitions')
  }

  const projectDir = join(PROJECTS_DIR, projectId)
  await mkdir(projectDir, { recursive: true })

  const projectSchemas = []

  // 遍歷所有 Schema
  for (const [schemaName, originalSchema] of Object.entries(targetSchemas)) {
    let resolvedSchema = resolveRefs(originalSchema, spec)
    // 強制補上 root type 如果缺漏
    if (!resolvedSchema.type && resolvedSchema.properties) {
      resolvedSchema.type = 'object'
    }
    
    projectSchemas.push({
      id: schemaName,
      name: schemaName,
      fieldCount: Object.keys(resolvedSchema.properties || {}).length,
      rootType: resolvedSchema.type || 'object'
    })
    
    // 寫入檔案
    const schemaFile = join(projectDir, `${schemaName}.schema.json`)
    await writeFile(schemaFile, JSON.stringify(resolvedSchema, null, 2), 'utf8')
  }

  return {
    name: spec.info?.title || '未命名 OpenAPI 專案',
    sourceUrl: url,
    schemaCount: projectSchemas.length,
    schemas: projectSchemas
  }
}

// ── 獨立 Schema 路由 ─────────────────────────────────────────

router.get('/list', async (req, res) => {
  try {
    const data = await readIndex()
    res.json({ code: 0, msg: 'success', data })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

router.post('/import', async (req, res) => {
  try {
    const { name, schema } = req.body
    if (!name || !name.trim()) return res.status(400).json({ code: 400, msg: '請提供 Schema 名稱' })
    if (!isValidSchema(schema)) return res.status(400).json({ code: 400, msg: '無效的 JSON Schema' })

    const id = generateId()
    const entry = {
      id,
      name: name.trim(),
      createdAt: new Date().toISOString(),
      fieldCount: Object.keys(schema.properties || {}).length,
      rootType: schema.type || 'object'
    }

    const schemaFile = join(SCHEMAS_DIR, `${id}.schema.json`)
    await writeFile(schemaFile, JSON.stringify(schema, null, 2), 'utf8')

    const index = await readIndex()
    index.schemas.unshift(entry)
    await writeIndex(index)

    res.status(201).json({ code: 0, msg: '匯入成功', data: entry })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

router.post('/import-url', async (req, res) => {
  try {
    const { name, url } = req.body
    if (!name || !name.trim()) return res.status(400).json({ code: 400, msg: '請提供 Schema 名稱' })
    if (!url || !url.startsWith('http')) return res.status(400).json({ code: 400, msg: '請提供有效的 URL' })

    const response = await fetch(url, { headers: { 'Accept': 'application/json' }, signal: AbortSignal.timeout(10000) })
    if (!response.ok) return res.status(400).json({ code: 400, msg: `無法取得 URL 內容：HTTP ${response.status}` })
    const schema = await response.json()

    if (!isValidSchema(schema)) return res.status(400).json({ code: 400, msg: '取得的內容不是有效的 JSON Schema' })

    const id = generateId()
    const entry = { id, name: name.trim(), sourceUrl: url, createdAt: new Date().toISOString(), fieldCount: Object.keys(schema.properties || {}).length, rootType: schema.type || 'object' }

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

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { schema } = req.body
    const schemaFile = join(SCHEMAS_DIR, `${id}.schema.json`)

    if (!existsSync(schemaFile)) return res.status(404).json({ code: 404, msg: '找不到指定的 Schema' })
    if (!isValidSchema(schema)) return res.status(400).json({ code: 400, msg: '無效的 JSON Schema' })

    await writeFile(schemaFile, JSON.stringify(schema, null, 2), 'utf8')
    res.json({ code: 0, msg: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const schemaFile = join(SCHEMAS_DIR, `${id}.schema.json`)
    if (!existsSync(schemaFile)) return res.status(404).json({ code: 404, msg: '找不到指定的 Schema' })

    const schema = JSON.parse(await readFile(schemaFile, 'utf8'))
    const { schemas } = await readIndex()
    const meta = schemas.find(s => s.id === id)

    res.json({ code: 0, msg: 'success', data: { meta, schema } })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const schemaFile = join(SCHEMAS_DIR, `${id}.schema.json`)
    if (existsSync(schemaFile)) await rm(schemaFile)

    const index = await readIndex()
    index.schemas = index.schemas.filter(s => s.id !== id)
    await writeIndex(index)

    res.json({ code: 0, msg: '刪除成功' })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

router.post('/:id/generate', async (req, res) => {
  try {
    const { id } = req.params
    const count = Math.min(parseInt(req.body.count || 10), 500)
    if (count < 1) return res.status(400).json({ code: 400, msg: 'count 必須為正整數' })

    const schemaFile = join(SCHEMAS_DIR, `${id}.schema.json`)
    if (!existsSync(schemaFile)) return res.status(404).json({ code: 404, msg: '找不到指定的 Schema' })

    const schema = JSON.parse(await readFile(schemaFile, 'utf8'))
    const fakeData = generateFromSchema(schema, count)

    res.json({ code: 0, msg: 'success', data: { count: fakeData.length, items: fakeData } })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

// ── OpenAPI Project 路由 ─────────────────────────────────────────

router.post('/projects', async (req, res) => {
  try {
    const { name, url } = req.body
    if (!url || !url.startsWith('http')) return res.status(400).json({ code: 400, msg: '請提供有效的 URL' })

    const projectId = 'proj-' + generateId()
    const projectResult = await processOpenAPI(url, projectId)
    
    const newProject = {
      id: projectId,
      name: name && name.trim() ? name.trim() : projectResult.name,
      sourceUrl: projectResult.sourceUrl,
      createdAt: new Date().toISOString(),
      schemaCount: projectResult.schemaCount,
      schemas: projectResult.schemas
    }

    const index = await readIndex()
    index.projects.unshift(newProject)
    await writeIndex(index)

    res.status(201).json({ code: 0, msg: '專案匯入成功', data: newProject })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

router.post('/projects/:projectId/reload', async (req, res) => {
  try {
    const { projectId } = req.params
    const index = await readIndex()
    const projIndex = index.projects.findIndex(p => p.id === projectId)
    if (projIndex === -1) return res.status(404).json({ code: 404, msg: '找不到指定的專案' })

    const oldProject = index.projects[projIndex]
    if (!oldProject.sourceUrl) return res.status(400).json({ code: 400, msg: '此專案沒有 sourceUrl，無法 Reload' })

    const projectDir = join(PROJECTS_DIR, projectId)
    if (existsSync(projectDir)) {
      await rm(projectDir, { recursive: true, force: true })
    }

    const projectResult = await processOpenAPI(oldProject.sourceUrl, projectId)
    
    index.projects[projIndex].schemas = projectResult.schemas
    index.projects[projIndex].schemaCount = projectResult.schemaCount
    
    await writeIndex(index)

    res.json({ code: 0, msg: '專案重新載入成功', data: index.projects[projIndex] })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

router.get('/projects/:projectId/:schemaId', async (req, res) => {
  try {
    const { projectId, schemaId } = req.params
    const schemaFile = join(PROJECTS_DIR, projectId, `${schemaId}.schema.json`)
    
    if (!existsSync(schemaFile)) return res.status(404).json({ code: 404, msg: '找不到指定的 Schema' })

    const schema = JSON.parse(await readFile(schemaFile, 'utf8'))
    const { projects } = await readIndex()
    const proj = projects.find(p => p.id === projectId)
    let meta = null
    if (proj && proj.schemas) {
      meta = proj.schemas.find(s => s.id === schemaId)
    }

    res.json({ code: 0, msg: 'success', data: { meta, schema } })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

router.put('/projects/:projectId/:schemaId', async (req, res) => {
  try {
    const { projectId, schemaId } = req.params
    const { schema } = req.body
    
    if (!schema || typeof schema !== 'object') return res.status(400).json({ code: 400, msg: '無效的 JSON Schema' })

    const schemaFile = join(PROJECTS_DIR, projectId, `${schemaId}.schema.json`)
    if (!existsSync(schemaFile)) return res.status(404).json({ code: 404, msg: '找不到指定的 Schema' })

    await writeFile(schemaFile, JSON.stringify(schema, null, 2), 'utf8')
    res.json({ code: 0, msg: '更新成功' })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

router.post('/projects/:projectId/:schemaId/generate', async (req, res) => {
  try {
    const { projectId, schemaId } = req.params
    const count = Math.min(parseInt(req.body.count || 10), 500)
    if (count < 1) return res.status(400).json({ code: 400, msg: 'count 必須為正整數' })

    const schemaFile = join(PROJECTS_DIR, projectId, `${schemaId}.schema.json`)
    if (!existsSync(schemaFile)) return res.status(404).json({ code: 404, msg: '找不到指定的 Schema' })

    const schema = JSON.parse(await readFile(schemaFile, 'utf8'))
    const fakeData = generateFromSchema(schema, count)

    res.json({ code: 0, msg: 'success', data: { count: fakeData.length, items: fakeData } })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

router.delete('/projects/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params
    const projectDir = join(PROJECTS_DIR, projectId)
    if (existsSync(projectDir)) {
      await rm(projectDir, { recursive: true, force: true })
    }

    const index = await readIndex()
    index.projects = index.projects.filter(p => p.id !== projectId)
    await writeIndex(index)

    res.json({ code: 0, msg: '刪除專案成功' })
  } catch (err) {
    res.status(500).json({ code: 500, msg: err.message })
  }
})

export default router
