/**
 * fake-generator.js
 * 純 JS 假資料生成器，依照 JSON Schema 定義產生假資料
 * 不依賴任何外部套件
 */

// ── 隨機工具 ──────────────────────────────────────────
const rand = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const uid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

// ── 假資料字典 ────────────────────────────────────────
const FIRST_NAMES = ['Wei', 'Ming', 'Li', 'Ying', 'Jia', 'Yi', 'Xiao', 'Da', 'Mei', 'Jun']
const LAST_NAMES  = ['Chen', 'Lin', 'Wang', 'Li', 'Chang', 'Wu', 'Liu', 'Huang', 'Cheng', 'Hsu']
const WORDS       = ['alpha', 'beta', 'gamma', 'delta', 'echo', 'foxtrot', 'golf', 'hotel', 'india', 'juliet', 'kilo', 'lima', 'mike', 'nova', 'omega', 'pulse', 'quest', 'raven', 'sigma', 'titan']
const DOMAINS     = ['example.com', 'test.io', 'mock.dev', 'demo.org', 'fakemail.net']
const TLD_PATHS   = ['/article', '/product', '/user', '/post', '/page', '/item', '/blog', '/news']
const CITIES      = ['台北市', '新北市', '台中市', '高雄市', '台南市', '桃園市', '新竹市', '基隆市']
const STATUS_LIST = ['active', 'inactive', 'pending', 'suspended', 'verified']
const COLORS      = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink', 'cyan']

// ── 基礎型別生成器 ────────────────────────────────────

function genString(schema = {}) {
  const format = schema.format || schema['x-format']
  const minLen = schema.minLength || 3
  const maxLen = schema.maxLength || 12

  switch (format) {
    case 'email':
      return `${pick(WORDS)}_${rand(100, 999)}@${pick(DOMAINS)}`
    case 'uuid':
      return uid()
    case 'date':
      return `${rand(2020, 2025)}-${String(rand(1, 12)).padStart(2, '0')}-${String(rand(1, 28)).padStart(2, '0')}`
    case 'date-time':
      return new Date(Date.now() - rand(0, 86400000 * 365)).toISOString()
    case 'time':
      return `${String(rand(0, 23)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}:${String(rand(0, 59)).padStart(2, '0')}`
    case 'url':
    case 'uri':
      return `https://${pick(DOMAINS)}${pick(TLD_PATHS)}/${rand(1, 999)}`
    case 'name':
    case 'full-name':
      return `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`
    case 'first-name':
      return pick(FIRST_NAMES)
    case 'last-name':
      return pick(LAST_NAMES)
    case 'phone':
    case 'tel':
      return `09${rand(10, 99)}-${rand(100, 999)}-${rand(100, 999)}`
    case 'city':
      return pick(CITIES)
    case 'color':
      return pick(COLORS)
    case 'status':
      return pick(STATUS_LIST)
    case 'password':
      return `P@ss${rand(1000, 9999)}!`
    case 'ipv4':
      return `${rand(1, 254)}.${rand(1, 254)}.${rand(1, 254)}.${rand(1, 254)}`
    case 'hostname':
      return `${pick(WORDS)}.${pick(DOMAINS)}`
    default: {
      // 根據欄位名稱猜測格式
      const len = rand(minLen, maxLen)
      return WORDS.slice(0, Math.ceil(len / 4)).join('-').substring(0, len) || pick(WORDS)
    }
  }
}

function smartStringByKey(key) {
  const k = key.toLowerCase()
  if (k.includes('email'))                          return genString({ format: 'email' })
  if (k.includes('phone') || k.includes('tel'))     return genString({ format: 'phone' })
  if (k === 'name' || k.includes('fullname'))        return genString({ format: 'name' })
  if (k.includes('firstname') || k === 'first')     return genString({ format: 'first-name' })
  if (k.includes('lastname') || k === 'last')       return genString({ format: 'last-name' })
  if (k.includes('url') || k.includes('link') || k.includes('href')) return genString({ format: 'url' })
  if (k.includes('uuid') || k === 'guid')           return uid()
  if (k.includes('status'))                         return pick(STATUS_LIST)
  if (k.includes('city'))                           return genString({ format: 'city' })
  if (k.includes('color'))                          return genString({ format: 'color' })
  if (k.includes('password') || k === 'pwd')        return genString({ format: 'password' })
  if (k.includes('ip'))                             return genString({ format: 'ipv4' })
  if (k.includes('date') || k.includes('time') || k.includes('at')) return new Date(Date.now() - rand(0, 86400000 * 365)).toISOString()
  if (k.includes('description') || k === 'desc' || k.includes('content') || k === 'bio') {
    return pick(WORDS).charAt(0).toUpperCase() + pick(WORDS) + ' ' + pick(WORDS) + ' ' + pick(WORDS) + '.'
  }
  if (k.includes('title') || k === 'subject')      return pick(WORDS).charAt(0).toUpperCase() + pick(WORDS)
  if (k.includes('tag') || k.includes('label'))    return pick(WORDS)
  if (k.includes('token') || k.includes('key') || k.includes('secret')) {
    return `mock-${uid().replace(/-/g, '').substring(0, 20)}`
  }
  return pick(WORDS)
}

function genNumber(schema = {}) {
  const min = schema.minimum ?? schema.min ?? 0
  const max = schema.maximum ?? schema.max ?? 1000
  if (schema.format === 'float' || schema.format === 'double' || schema.multipleOf) {
    return parseFloat((Math.random() * (max - min) + min).toFixed(2))
  }
  return rand(min, max)
}

function genBoolean() {
  return Math.random() > 0.5
}

function genArray(schema = {}, depth = 0) {
  if (depth > 3) return []
  const minItems = schema.minItems ?? 1
  const maxItems = schema.maxItems ?? 5
  const count = rand(minItems, maxItems)
  const items = schema.items || { type: 'string' }
  return Array.from({ length: count }, () => generateValue(items, depth + 1))
}

function genEnum(enumValues) {
  return pick(enumValues)
}

// ── 核心：從 Schema 生成單個值 ──────────────────────────

function generateValue(schema, depth = 0, key = '') {
  if (!schema || depth > 5) return null

  // enum 優先
  if (schema.enum && schema.enum.length > 0) return genEnum(schema.enum)

  // oneOf / anyOf
  if (schema.oneOf) return generateValue(pick(schema.oneOf), depth, key)
  if (schema.anyOf) return generateValue(pick(schema.anyOf), depth, key)

  // const
  if ('const' in schema) return schema.const

  // nullable / null type
  if (Array.isArray(schema.type)) {
    const nonNull = schema.type.filter(t => t !== 'null')
    if (nonNull.length === 0) return null
    return generateValue({ ...schema, type: pick(nonNull) }, depth, key)
  }

  switch (schema.type) {
    case 'string':
      return key ? smartStringByKey(key) || genString(schema) : genString(schema)
    case 'number':
    case 'integer':
      return genNumber(schema)
    case 'boolean':
      return genBoolean()
    case 'array':
      return genArray(schema, depth)
    case 'object':
      return generateObject(schema, depth)
    case 'null':
      return null
    default:
      // 沒有 type 但有 properties → 當 object 處理
      if (schema.properties) return generateObject(schema, depth)
      return key ? smartStringByKey(key) : pick(WORDS)
  }
}

// ── 生成 Object ──────────────────────────────────────

function generateObject(schema, depth = 0) {
  if (depth > 5) return {}
  const result = {}
  const props = schema.properties || {}

  for (const [key, propSchema] of Object.entries(props)) {
    // 如果有 required，優先填入；否則全部填入（mock 需要完整資料）
    result[key] = generateValue(propSchema, depth + 1, key)
  }

  // additionalProperties
  if (schema.additionalProperties && typeof schema.additionalProperties === 'object') {
    const extra = schema.additionalProperties
    const extraCount = rand(0, 2)
    for (let i = 0; i < extraCount; i++) {
      const k = `extra_${pick(WORDS)}`
      result[k] = generateValue(extra, depth + 1, k)
    }
  }

  return result
}

// ── 主要匯出函式 ─────────────────────────────────────

/**
 * 從 JSON Schema 生成假資料陣列
 * @param {Object} schema - JSON Schema
 * @param {number} count - 生成筆數
 * @returns {Array} 假資料陣列
 */
export function generateFromSchema(schema, count = 10) {
  const result = []
  for (let i = 0; i < count; i++) {
    let item = generateValue(schema)
    // 如果根 schema 是 object 且包含 id 欄位，自動遞增 id
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      if ('id' in item && typeof item.id === 'number') {
        item.id = i + 1
      }
    }
    result.push(item)
  }
  return result
}

/**
 * 快速生成單筆假資料
 * @param {Object} schema - JSON Schema
 * @returns {*} 假資料
 */
export function generateOne(schema) {
  return generateValue(schema)
}
