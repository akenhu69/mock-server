// ═══════════════════════════════════════════════
//  Tab Switching
// ═══════════════════════════════════════════════
function switchTab(tabName) {
    const tabs = ['dynamic', 'waiting', 'schema']
    const activeClass = ['bg-white', 'text-brand-700', 'shadow-sm', 'ring-1', 'ring-black/5']
    const inactiveClass = ['text-slate-500', 'hover:text-slate-900']

    tabs.forEach(t => {
        const content = document.getElementById(`tab-${t}`)
        const btn = document.getElementById(`tab-btn-${t}`)
        if (!content || !btn) return
        content.classList.add('hidden')
        btn.classList.remove(...activeClass)
        btn.classList.add(...inactiveClass)
    })

    const activeContent = document.getElementById(`tab-${tabName}`)
    const activeBtn = document.getElementById(`tab-btn-${tabName}`)
    if (activeContent) activeContent.classList.remove('hidden')
    if (activeBtn) {
        activeBtn.classList.remove(...inactiveClass)
        activeBtn.classList.add(...activeClass)
    }

    if (tabName === 'schema') {
        loadSchemas()
    }
}

// ═══════════════════════════════════════════════
//  複製代碼功能
// ═══════════════════════════════════════════════
function copyCode(button) {
    const container = button.parentElement
    const codeElement = container.querySelector('code')
    if (!codeElement) return

    navigator.clipboard.writeText(codeElement.textContent).then(() => {
        const originalText = button.textContent
        button.textContent = '已複製!'
        button.classList.replace('bg-slate-700', 'bg-green-600')
        setTimeout(() => {
            button.textContent = originalText
            button.classList.replace('bg-green-600', 'bg-slate-700')
        }, 2000)
    })
}

// ═══════════════════════════════════════════════
//  平滑滾動
// ═══════════════════════════════════════════════
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const targetId = this.getAttribute('href')
        if (targetId === '#') return
        const target = document.querySelector(targetId)
        if (target) {
            e.preventDefault()
            target.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }
    })
})

// ═══════════════════════════════════════════════
//  Schema Manager
// ═══════════════════════════════════════════════

let schemas = []
let selectedSchemaId = null

async function loadSchemas() {
    try {
        const res = await fetch('/api/schema/list')
        const json = await res.json()
        schemas = json.data || []
        renderSchemaList()
        renderSchemaSelect()
    } catch (e) {
        console.error('Failed to load schemas:', e)
    }
}

function renderSchemaList() {
    const container = document.getElementById('schema-list')
    if (!container) return

    if (schemas.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 text-slate-400">
                <div class="text-4xl mb-3">📭</div>
                <p class="text-sm">尚未匯入任何 Schema</p>
                <p class="text-xs mt-1">從上方匯入區塊開始吧</p>
            </div>`
        return
    }

    container.innerHTML = schemas.map(s => `
        <div class="flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group">
            <div class="w-9 h-9 bg-violet-100 rounded-lg flex items-center justify-center flex-shrink-0 text-base">
                ${s.rootType === 'array' ? '📋' : '🗂️'}
            </div>
            <div class="flex-1 min-w-0">
                <div class="font-medium text-slate-800 text-sm truncate">${escapeHtml(s.name)}</div>
                <div class="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>${s.fieldCount || 0} 個欄位</span>
                    <span>·</span>
                    <span>${formatDate(s.createdAt)}</span>
                    ${s.sourceUrl ? `<span>· <a href="${escapeHtml(s.sourceUrl)}" target="_blank" class="text-blue-400 hover:underline truncate max-w-[120px] inline-block align-bottom">URL</a></span>` : ''}
                </div>
            </div>
            <div class="flex gap-1 flex-shrink-0">
                <button onclick="selectSchema('${s.id}')"
                    class="px-2.5 py-1.5 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded-md transition-colors font-medium">
                    生成
                </button>
                <button onclick="deleteSchema('${s.id}')"
                    class="px-2 py-1.5 text-xs bg-white hover:bg-red-50 text-red-400 hover:text-red-600 border border-slate-200 rounded-md transition-colors">
                    🗑
                </button>
            </div>
        </div>`
    ).join('')
}

function renderSchemaSelect() {
    const sel = document.getElementById('schema-select')
    if (!sel) return
    const prev = sel.value
    sel.innerHTML = schemas.length === 0
        ? '<option value="">— 尚未匯入任何 Schema —</option>'
        : '<option value="">選擇 Schema...</option>' +
          schemas.map(s => `<option value="${s.id}">${escapeHtml(s.name)}</option>`).join('')
    if (prev) sel.value = prev
}

function selectSchema(id) {
    selectedSchemaId = id
    const schema = schemas.find(s => s.id === id)
    if (!schema) return

    // 更新 select
    const sel = document.getElementById('schema-select')
    if (sel) sel.value = id

    // 捲動到生成區
    document.getElementById('generate-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    document.getElementById('generate-btn')?.focus()
}

async function deleteSchema(id) {
    if (!confirm('確定要刪除此 Schema 嗎？')) return
    try {
        const res = await fetch(`/api/schema/${id}`, { method: 'DELETE' })
        const json = await res.json()
        if (json.code === 0) {
            schemas = schemas.filter(s => s.id !== id)
            renderSchemaList()
            renderSchemaSelect()
            if (selectedSchemaId === id) {
                selectedSchemaId = null
                clearGenerateResult()
            }
            showToast('已刪除 Schema')
        } else {
            showToast(json.msg || '刪除失敗', 'error')
        }
    } catch (e) {
        showToast('刪除失敗：' + e.message, 'error')
    }
}

async function generateFakeData() {
    const schemaId = document.getElementById('schema-select').value
    const count = parseInt(document.getElementById('gen-count').value) || 10

    if (!schemaId) {
        showToast('請先選擇一個 Schema', 'warn')
        return
    }

    const btn = document.getElementById('generate-btn')
    btn.disabled = true
    btn.textContent = '⏳ 生成中...'

    try {
        const res = await fetch(`/api/schema/${schemaId}/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ count })
        })
        const json = await res.json()
        if (json.code === 0) {
            const items = json.data.items
            const resultEl = document.getElementById('generate-result')
            const resultJson = document.getElementById('generate-json')
            const resultMeta = document.getElementById('generate-meta')

            resultEl.classList.remove('hidden')
            resultJson.textContent = JSON.stringify(items, null, 2)
            resultMeta.textContent = `✅ 成功生成 ${items.length} 筆資料`
            showToast(`已生成 ${items.length} 筆假資料`)
        } else {
            showToast(json.msg || '生成失敗', 'error')
        }
    } catch (e) {
        showToast('生成失敗：' + e.message, 'error')
    } finally {
        btn.disabled = false
        btn.textContent = '⚡ Generate'
    }
}

function clearGenerateResult() {
    document.getElementById('generate-result')?.classList.add('hidden')
}

async function copyGeneratedJson() {
    const text = document.getElementById('generate-json')?.textContent
    if (!text) return
    await navigator.clipboard.writeText(text)
    showToast('已複製 JSON')
}

function downloadGeneratedJson() {
    const text = document.getElementById('generate-json')?.textContent
    if (!text) return
    const schemaId = document.getElementById('schema-select').value
    const schema = schemas.find(s => s.id === schemaId)
    const filename = schema ? `${schema.name.replace(/\s+/g, '_')}_fake_data.json` : 'fake_data.json'
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    showToast('已下載 JSON 檔案')
}

// ── 匯入 Schema ──────────────────────────────────

let importMode = 'paste' // 'paste' | 'file' | 'url'

function switchImportMode(mode) {
    importMode = mode
    const modes = ['paste', 'file', 'url']
    modes.forEach(m => {
        document.getElementById(`import-${m}`)?.classList.add('hidden')
        document.getElementById(`import-tab-${m}`)?.classList.remove('border-violet-500', 'text-violet-600', 'bg-white')
        document.getElementById(`import-tab-${m}`)?.classList.add('text-slate-500')
    })
    document.getElementById(`import-${mode}`)?.classList.remove('hidden')
    const activeTab = document.getElementById(`import-tab-${mode}`)
    activeTab?.classList.add('border-violet-500', 'text-violet-600', 'bg-white')
    activeTab?.classList.remove('text-slate-500')
}

async function submitImport() {
    const name = document.getElementById('schema-name').value.trim()
    if (!name) { showToast('請輸入 Schema 名稱', 'warn'); return }

    const submitBtn = document.getElementById('import-submit-btn')
    submitBtn.disabled = true
    submitBtn.textContent = '⏳ 匯入中...'

    try {
        if (importMode === 'paste') {
            const raw = document.getElementById('schema-paste').value.trim()
            if (!raw) { showToast('請貼入 JSON Schema', 'warn'); return }
            let schema
            try { schema = JSON.parse(raw) } catch { showToast('JSON 格式錯誤，請確認', 'error'); return }
            await doImport(name, schema)
        } else if (importMode === 'file') {
            const file = document.getElementById('schema-file').files[0]
            if (!file) { showToast('請選擇檔案', 'warn'); return }
            const text = await file.text()
            let schema
            try { schema = JSON.parse(text) } catch { showToast('JSON 格式錯誤', 'error'); return }
            await doImport(name, schema)
        } else if (importMode === 'url') {
            const url = document.getElementById('schema-url').value.trim()
            if (!url) { showToast('請輸入 URL', 'warn'); return }
            await doImportUrl(name, url)
        }
    } finally {
        submitBtn.disabled = false
        submitBtn.textContent = '✅ 匯入 Schema'
    }
}

async function doImport(name, schema) {
    const res = await fetch('/api/schema/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, schema })
    })
    const json = await res.json()
    if (json.code === 0) {
        schemas.unshift(json.data)
        renderSchemaList()
        renderSchemaSelect()
        document.getElementById('schema-name').value = ''
        document.getElementById('schema-paste').value = ''
        showToast(`✅ Schema「${name}」匯入成功！`)
    } else {
        showToast(json.msg || '匯入失敗', 'error')
    }
}

async function doImportUrl(name, url) {
    const res = await fetch('/api/schema/import-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url })
    })
    const json = await res.json()
    if (json.code === 0) {
        schemas.unshift(json.data)
        renderSchemaList()
        renderSchemaSelect()
        document.getElementById('schema-name').value = ''
        document.getElementById('schema-url').value = ''
        showToast(`✅ 從 URL 匯入成功！`)
    } else {
        showToast(json.msg || 'URL 匯入失敗', 'error')
    }
}

// ── 工具 ─────────────────────────────────────────────

function escapeHtml(str) {
    return String(str ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function formatDate(iso) {
    if (!iso) return ''
    const d = new Date(iso)
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

let toastTimer
function showToast(msg, type = 'success') {
    let toast = document.getElementById('toast')
    if (!toast) {
        toast = document.createElement('div')
        toast.id = 'toast'
        toast.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:9999;padding:10px 18px;border-radius:10px;font-size:14px;font-weight:500;box-shadow:0 4px 20px rgba(0,0,0,.15);transition:opacity .3s;max-width:320px'
        document.body.appendChild(toast)
    }
    const colors = { success: '#16a34a', error: '#dc2626', warn: '#d97706' }
    toast.style.background = colors[type] || colors.success
    toast.style.color = '#fff'
    toast.style.opacity = '1'
    toast.textContent = msg
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast.style.opacity = '0' }, 3000)
}
