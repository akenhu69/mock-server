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
let projects = []
let selectedSchemaId = null

async function loadSchemas() {
    try {
        const res = await fetch('/api/schema/list')
        const json = await res.json()
        schemas = json.data?.schemas || []
        projects = json.data?.projects || []
        renderSchemaList()
        renderSchemaSelect()
    } catch (e) {
        console.error('Failed to load schemas:', e)
    }
}

// 展開/收合狀態記錄
const expandedProjects = new Set()

function toggleProject(projectId) {
    if (expandedProjects.has(projectId)) {
        expandedProjects.delete(projectId)
    } else {
        expandedProjects.add(projectId)
    }
    renderSchemaList()
}

function renderSchemaList() {
    const container = document.getElementById('schema-list')
    if (!container) return

    if (schemas.length === 0 && projects.length === 0) {
        container.innerHTML = `
            <div class="text-center py-10 text-slate-400">
                <div class="text-4xl mb-3">📭</div>
                <p class="text-sm">尚未匯入任何 Schema 或專案</p>
                <p class="text-xs mt-1">從上方匯入區塊開始吧</p>
            </div>`
        return
    }

    let html = ''

    // 渲染 Projects
    if (projects.length > 0) {
        projects.forEach(p => {
            const isExpanded = expandedProjects.has(p.id)
            html += `
            <div class="mb-3 bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                <!-- Project Header -->
                <div class="flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer" onclick="toggleProject('${p.id}')">
                    <div class="flex items-center gap-2">
                        <span class="text-lg w-5 text-center">${isExpanded ? '📂' : '📁'}</span>
                        <div>
                            <div class="font-bold text-slate-800 text-sm">${escapeHtml(p.name)}</div>
                            <div class="text-xs text-slate-500 mt-0.5">${p.schemaCount} 個 Schemas</div>
                        </div>
                    </div>
                    <div class="flex items-center gap-2" onclick="event.stopPropagation()">
                        <button onclick="reloadProject('${p.id}')" title="從來源網址重新載入專案" class="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">🔄</button>
                        <button onclick="deleteProject('${p.id}')" title="刪除專案" class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors">🗑️</button>
                    </div>
                </div>
                
                <!-- Project Children (Schemas) -->
                ${isExpanded ? `
                <div class="border-t border-slate-100 bg-white">
                    ${p.schemas.map(s => `
                    <div class="flex items-center justify-between py-2.5 px-4 hover:bg-slate-50 border-b border-slate-50 last:border-0 group">
                        <div class="flex items-center gap-3 min-w-0">
                            <span class="text-slate-300 text-sm">📄</span>
                            <div>
                                <div class="text-sm font-medium text-slate-700 truncate">${escapeHtml(s.name)}</div>
                                <div class="text-[11px] text-slate-400">${s.fieldCount || 0} 欄位</div>
                            </div>
                        </div>
                        <div class="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onclick="selectSchema('project::${p.id}::${s.id}')" class="px-2 py-1 text-[11px] bg-violet-100 text-violet-700 hover:bg-violet-200 rounded font-medium">生成</button>
                            <button onclick="openEditor('${s.id}', '${p.id}')" class="px-2 py-1 text-[11px] bg-slate-100 text-slate-600 hover:bg-slate-200 rounded font-medium">編輯</button>
                        </div>
                    </div>
                    `).join('')}
                </div>
                ` : ''}
            </div>
            `
        })
    }

    // 渲染獨立 Schemas
    if (schemas.length > 0) {
        if (projects.length > 0) {
            html += `<div class="text-xs font-bold text-slate-400 uppercase tracking-wider mt-4 mb-2 px-1">獨立 Schemas</div>`
        }
        schemas.forEach(s => {
            html += `
            <div class="flex items-center gap-3 p-3 mb-2 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors group">
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
                <div class="flex gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onclick="selectSchema('${s.id}')" class="px-2.5 py-1 text-xs bg-violet-600 hover:bg-violet-700 text-white rounded transition-colors font-medium">生成</button>
                    <button onclick="openEditor('${s.id}')" class="px-2.5 py-1 text-xs bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition-colors font-medium">編輯</button>
                    <button onclick="deleteSchema('${s.id}')" class="px-2 py-1 text-xs bg-white hover:bg-red-50 text-red-400 hover:text-red-600 border border-slate-200 rounded transition-colors">🗑</button>
                </div>
            </div>`
        })
    }

    container.innerHTML = html
}

function renderSchemaSelect() {
    const sel = document.getElementById('schema-select')
    if (!sel) return
    const prev = sel.value
    
    let html = ''
    if (schemas.length === 0 && projects.length === 0) {
        html = '<option value="">— 尚未匯入任何 Schema —</option>'
    } else {
        html = '<option value="">選擇 Schema...</option>'
        if (projects.length > 0) {
            projects.forEach(p => {
                html += `<optgroup label="📂 ${escapeHtml(p.name)}">`
                p.schemas.forEach(s => {
                    html += `<option value="project::${p.id}::${s.id}">${escapeHtml(s.name)}</option>`
                })
                html += `</optgroup>`
            })
        }
        if (schemas.length > 0) {
            html += `<optgroup label="獨立 Schemas">`
            schemas.forEach(s => {
                html += `<option value="${s.id}">${escapeHtml(s.name)}</option>`
            })
            html += `</optgroup>`
        }
    }
    
    sel.innerHTML = html
    if (prev) sel.value = prev
}

function selectSchema(id) {
    selectedSchemaId = id
    const sel = document.getElementById('schema-select')
    if (sel) sel.value = id

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

async function deleteProject(projectId) {
    if (!confirm('確定要刪除整個專案及其下所有的 Schema 嗎？')) return
    try {
        const res = await fetch(`/api/schema/projects/${projectId}`, { method: 'DELETE' })
        const json = await res.json()
        if (json.code === 0) {
            projects = projects.filter(p => p.id !== projectId)
            renderSchemaList()
            renderSchemaSelect()
            showToast('已刪除專案')
        } else {
            showToast(json.msg || '刪除失敗', 'error')
        }
    } catch (e) {
        showToast('刪除失敗：' + e.message, 'error')
    }
}

async function reloadProject(projectId) {
    if (!confirm('確定要從原始網址重新載入？這將會覆蓋您在此專案中所有手動修改過的 Schema。')) return
    try {
        showToast('重新載入中...', 'wait')
        const res = await fetch(`/api/schema/projects/${projectId}/reload`, { method: 'POST' })
        const json = await res.json()
        if (json.code === 0) {
            const index = projects.findIndex(p => p.id === projectId)
            if (index !== -1) projects[index] = json.data
            renderSchemaList()
            renderSchemaSelect()
            showToast('專案重新載入成功')
        } else {
            showToast(json.msg || '載入失敗', 'error')
        }
    } catch (e) {
        showToast('載入失敗：' + e.message, 'error')
    }
}

async function generateFakeData() {
    const val = document.getElementById('schema-select').value
    const count = parseInt(document.getElementById('gen-count').value) || 10

    if (!val) {
        showToast('請先選擇一個 Schema', 'warn')
        return
    }

    const btn = document.getElementById('generate-btn')
    btn.disabled = true
    btn.textContent = '⏳ 生成中...'

    let endpoint = `/api/schema/${val}/generate`
    if (val.startsWith('project::')) {
        const parts = val.split('::')
        const projectId = parts[1]
        const schemaId = parts[2]
        endpoint = `/api/schema/projects/${projectId}/${schemaId}/generate`
    }

    try {
        const res = await fetch(endpoint, {
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
    const val = document.getElementById('schema-select').value
    const filename = val.replace(/::/g, '_') + '_fake_data.json'
    const blob = new Blob([text], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
    showToast('已下載 JSON 檔案')
}

// ── Edit Schema (Modal) ──────────────────────────────────
let currentEditingSchemaId = null;
let currentEditingProjectId = null;

async function openEditor(schemaId, projectId = null) {
    currentEditingSchemaId = schemaId;
    currentEditingProjectId = projectId;
    
    document.getElementById('editor-schema-name').textContent = schemaId;
    document.getElementById('editor-textarea').value = '載入中...';
    document.getElementById('editor-error').classList.add('hidden');
    document.getElementById('editor-modal').classList.remove('hidden');

    const endpoint = projectId ? `/api/schema/projects/${projectId}/${schemaId}` : `/api/schema/${schemaId}`;
    
    try {
        const res = await fetch(endpoint)
        const json = await res.json()
        if (json.code === 0) {
            document.getElementById('editor-textarea').value = JSON.stringify(json.data.schema, null, 2);
        } else {
            document.getElementById('editor-textarea').value = `Error: ${json.msg}`;
        }
    } catch (e) {
        document.getElementById('editor-textarea').value = `Fetch error: ${e.message}`;
    }
}

function closeEditor() {
    document.getElementById('editor-modal').classList.add('hidden');
    currentEditingSchemaId = null;
    currentEditingProjectId = null;
}

async function saveEditor() {
    const raw = document.getElementById('editor-textarea').value;
    const errEl = document.getElementById('editor-error');
    errEl.classList.add('hidden');

    let schema;
    try {
        schema = JSON.parse(raw);
    } catch (e) {
        errEl.textContent = `JSON 格式錯誤：${e.message}`;
        errEl.classList.remove('hidden');
        return;
    }

    const btn = document.getElementById('editor-save-btn');
    btn.disabled = true;
    btn.textContent = '儲存中...';

    const endpoint = currentEditingProjectId 
        ? `/api/schema/projects/${currentEditingProjectId}/${currentEditingSchemaId}` 
        : `/api/schema/${currentEditingSchemaId}`;

    try {
        const res = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ schema })
        })
        const json = await res.json()
        if (json.code === 0) {
            showToast('✅ Schema 儲存成功');
            closeEditor();
            loadSchemas(); // Refresh meta in list
        } else {
            errEl.textContent = `儲存失敗：${json.msg}`;
            errEl.classList.remove('hidden');
        }
    } catch (e) {
        errEl.textContent = `網路錯誤：${e.message}`;
        errEl.classList.remove('hidden');
    } finally {
        btn.disabled = false;
        btn.textContent = '💾 儲存變更';
    }
}

// ── 匯入 Schema ──────────────────────────────────

let importMode = 'paste' // 'paste' | 'file' | 'url' | 'openapi'

function switchImportMode(mode) {
    importMode = mode
    const modes = ['paste', 'file', 'url', 'openapi']
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
    
    // OpenAPI mode needs URL, Name is optional
    if (importMode !== 'openapi' && !name) { 
        showToast('請輸入 Schema 名稱', 'warn'); 
        return 
    }

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
        } else if (importMode === 'openapi') {
            const url = document.getElementById('openapi-url').value.trim()
            if (!url) { showToast('請輸入 OpenAPI URL', 'warn'); return }
            await doImportOpenAPI(name, url)
        }
    } finally {
        submitBtn.disabled = false
        submitBtn.textContent = '✅ 匯入'
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

async function doImportOpenAPI(name, url) {
    const res = await fetch('/api/schema/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, url })
    })
    const json = await res.json()
    if (json.code === 0) {
        projects.unshift(json.data)
        expandedProjects.add(json.data.id) // 預設展開新專案
        renderSchemaList()
        renderSchemaSelect()
        document.getElementById('schema-name').value = ''
        document.getElementById('openapi-url').value = ''
        showToast(`✅ OpenAPI 專案「${json.data.name}」匯入成功！共 ${json.data.schemaCount} 個 Schemas。`)
    } else {
        showToast(json.msg || 'OpenAPI 匯入失敗', 'error')
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
    const colors = { success: '#16a34a', error: '#dc2626', warn: '#d97706', wait: '#4f46e5' }
    toast.style.background = colors[type] || colors.success
    toast.style.color = '#fff'
    toast.style.opacity = '1'
    toast.textContent = msg
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { toast.style.opacity = '0' }, (type === 'wait' ? 10000 : 3000))
}
