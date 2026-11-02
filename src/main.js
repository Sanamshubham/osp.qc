import './style.css'

const state = { aerial: [], buried: [], filter: 'all', search: '', session: -1, sessionUrls: ['', '', '', ''] }
const sessions = ['Pole Inspector', 'Typical Checker', 'Span and Footage', 'Address and Unit']
const sessionDescriptions = ['Inspect poles, attachments, and field checks.', 'Review typical designs and validate configurations.', 'Measure aerial and buried spans and calculate footage.', 'Look up addresses, units, and site information.']
const number = (value) => Number.parseFloat(String(value ?? '').replace(/[^0-9.-]/g, '')) || 0
const format = (value) => `${value.toLocaleString(undefined, { maximumFractionDigits: 1 })} ft`
const iqgeoUrl = (value) => String(value ?? '').match(/https?:\/\/[^)\s"]+/)?.[0] ?? ''

function parseCsv(text) {
  const rows = []
  let row = [], cell = '', quoted = false
  for (const character of text.replace(/^\uFEFF/, '')) {
    if (character === '"') quoted = !quoted
    else if (character === ',' && !quoted) { row.push(cell); cell = '' }
    else if ((character === '\n' || character === '\r') && !quoted) {
      if (character === '\n') { row.push(cell); rows.push(row); row = []; cell = '' }
    } else cell += character
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const headers = rows.shift().map((header) => header.trim())
  return rows.filter((item) => item.some(Boolean)).map((item) => Object.fromEntries(headers.map((header, index) => [header, item[index]?.trim() ?? ''])))
}

function normalize(rows, kind, fileName) {
  return rows.map((row, index) => {
    const span = number(row.LENGTH)
    const calculated = number(row.CALCULATED_LENGTH)
    return { ...row, kind, fileName, rowNumber: index + 2, span, calculated, difference: span - calculated, iqgeo: iqgeoUrl(row.MYWORLDLINK), overLimit: span > 370 }
  }).filter((row) => row.span || row.calculated)
}

function allRows() { return [...state.aerial, ...state.buried] }
function totals(rows) {
  return rows.reduce((result, row) => ({ span: result.span + row.span, calculated: result.calculated + row.calculated, difference: result.difference + row.difference }), { span: 0, calculated: 0, difference: 0 })
}

function uploadCard(kind, label, icon) {
  const rows = state[kind]
  return `<label class="upload-card ${rows.length ? 'loaded' : ''}" for="${kind}-file"><span class="upload-icon">${icon}</span><span class="upload-copy"><strong>${label}</strong><small>${rows.length ? `${rows.length.toLocaleString()} rows loaded` : 'Drop a CSV or browse files'}</small></span><span class="upload-action">${rows.length ? 'Replace' : 'Upload'}</span><input id="${kind}-file" type="file" accept=".csv,text/csv" data-kind="${kind}" /></label>`
}

function renderSessionPortal() {
  const sessionIndex = state.session
  const url = sessionIndex === 0 ? '/pole-inspector/index.html' : sessionIndex === 1 ? '/typical-checker/index.html' : state.sessionUrls[sessionIndex]
  return `<main class="session-main"><section class="session-hero"><p class="eyebrow">WEBSITE SESSION ${sessionIndex + 1}</p><h1>${sessions[sessionIndex]}<br><em>workspace.</em></h1><p class="lede">${sessionIndex === 0 ? 'Pole Inspector loaded from the uploaded build. Use the filter row under each column to find records quickly.' : sessionIndex === 1 ? 'QGIS Street Typical Validation Dashboard loaded from the uploaded project.' : 'Add a website URL to keep it available as one of your four workspace sessions.'}</p></section>${sessionIndex === 0 || sessionIndex === 1 ? '' : `<section class="website-controls"><label for="session-url">Website URL</label><div class="url-row"><input id="session-url" type="url" placeholder="https://your-website.com" value="${url}" /><button id="save-session" type="button">Load website ↗</button></div><small>Some websites block embedded previews. Use “Open in new tab” whenever that happens.</small></section>`}${url ? `<section class="website-frame-wrap"><div class="frame-head"><span>${url}</span><a href="${url}" target="_blank" rel="noopener">Open in new tab ↗</a></div><iframe id="embedded-site-frame" title="${sessions[sessionIndex]} preview" src="${url}"></iframe></section>` : '<section class="website-empty"><span class="empty-mark">＋</span><strong>No website loaded</strong><small>Enter a URL above to preview this session.</small></section>'}</main>`
}

function addPoleColumnFilters(frame) {
  const document = frame.contentDocument
  const table = document?.querySelector('table')
  if (!table || table.querySelector('.embedded-filter-row')) return
  const header = table.querySelector('thead tr')
  if (!header) return
  const rows = () => Array.from(table.querySelectorAll('tbody tr'))
  const filters = Array.from(header.children).map(() => null)
  const applyFilters = () => rows().forEach((row) => {
    row.style.display = filters.every((selected, index) => !selected || selected.has(row.children[index]?.textContent.trim() ?? '')) ? '' : 'none'
  })
  const closePopup = () => document.querySelector('.excel-filter-popup')?.remove()
  const openPopup = (index, cell, button) => {
    closePopup()
    const values = [...new Set(rows().map((row) => row.children[index]?.textContent.trim() ?? ''))].sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
    const popup = document.createElement('div')
    popup.className = 'excel-filter-popup'
    popup.innerHTML = '<div class="excel-filter-actions"><button type="button" data-action="sort-asc">A to Z</button><button type="button" data-action="sort-desc">Z to A</button></div><input class="excel-filter-search" type="search" placeholder="Search"/><label class="excel-select-all"><input type="checkbox" checked/> (Select All)</label><div class="excel-filter-values"></div><div class="excel-filter-footer"><button type="button" data-action="ok">OK</button><button type="button" data-action="cancel">Cancel</button></div>'
    const valueBox = popup.querySelector('.excel-filter-values')
    const selected = filters[index] ? new Set(filters[index]) : new Set(values)
    values.forEach((value) => {
      const label = document.createElement('label')
      label.className = 'excel-filter-value'
      label.dataset.value = value.toLowerCase()
      label.innerHTML = `<input type="checkbox" ${selected.has(value) ? 'checked' : ''}/><span></span>`
      label.querySelector('span').textContent = value || '(Blanks)'
      valueBox.append(label)
    })
    const syncSelectAll = () => { popup.querySelector('.excel-select-all input').checked = values.every((value) => selected.has(value)) }
    popup.querySelector('.excel-select-all input').addEventListener('change', (event) => {
      valueBox.querySelectorAll('label').forEach((label) => { label.querySelector('input').checked = event.target.checked; const value = label.querySelector('span').textContent === '(Blanks)' ? '' : label.querySelector('span').textContent; event.target.checked ? selected.add(value) : selected.delete(value) })
      if (!event.target.checked) selected.clear()
      syncSelectAll()
    })
    valueBox.querySelectorAll('label').forEach((label) => label.querySelector('input').addEventListener('change', (event) => { event.target.checked ? selected.add(label.querySelector('span').textContent === '(Blanks)' ? '' : label.querySelector('span').textContent) : selected.delete(label.querySelector('span').textContent === '(Blanks)' ? '' : label.querySelector('span').textContent); syncSelectAll() }))
    popup.querySelector('.excel-filter-search').addEventListener('input', (event) => valueBox.querySelectorAll('label').forEach((label) => { label.hidden = !label.dataset.value.includes(event.target.value.toLowerCase()) }))
    popup.querySelector('[data-action="ok"]').addEventListener('click', () => { filters[index] = selected.size === values.length ? null : new Set(selected); applyFilters(); closePopup(); button.classList.toggle('filtered', Boolean(filters[index])) })
    popup.querySelector('[data-action="cancel"]').addEventListener('click', closePopup)
    popup.querySelector('[data-action="sort-asc"]').addEventListener('click', () => sortPoleRows(index, false, table, applyFilters))
    popup.querySelector('[data-action="sort-desc"]').addEventListener('click', () => sortPoleRows(index, true, table, applyFilters))
    document.body.append(popup)
    const rect = cell.getBoundingClientRect()
    popup.style.left = `${Math.min(rect.left, document.documentElement.clientWidth - 285)}px`
    popup.style.top = `${rect.bottom + 2}px`
  }
  const filterRow = document.createElement('tr')
  filterRow.className = 'embedded-filter-row'
  Array.from(header.children).forEach((cell, index) => {
    const filterCell = document.createElement('th')
    const button = document.createElement('button')
    button.type = 'button'
    button.className = 'excel-filter-button'
    button.textContent = '▼'
    button.title = `Filter ${cell.textContent.trim()}`
    button.addEventListener('click', () => openPopup(index, filterCell, button))
    filterCell.append(button)
    filterRow.append(filterCell)
  })
  header.parentElement.append(filterRow)
  const style = document.createElement('style')
  style.textContent = '.embedded-filter-row th{position:sticky;top:0;background:#f8fafc;padding:3px;border-bottom:1px solid #cbd5e1}.excel-filter-button{width:100%;min-width:50px;border:1px solid #cbd5e1;border-radius:3px;background:#fff;color:#475569;font-size:10px;padding:4px;cursor:pointer}.excel-filter-button:hover,.excel-filter-button.filtered{background:#dbeafe;color:#1d4ed8}.excel-filter-popup{position:fixed;z-index:99999;width:285px;padding:8px;background:#fff;border:1px solid #94a3b8;box-shadow:0 6px 18px rgba(15,23,42,.25);font:12px Arial,sans-serif;color:#1f2937}.excel-filter-actions{display:flex;gap:4px;border-bottom:1px solid #e2e8f0;padding-bottom:7px;margin-bottom:7px}.excel-filter-actions button{border:0;background:#f1f5f9;padding:5px 8px;cursor:pointer}.excel-filter-search{width:100%;padding:7px;border:1px solid #94a3b8;margin-bottom:7px;box-sizing:border-box}.excel-select-all,.excel-filter-value{display:flex;align-items:center;gap:6px;padding:5px 4px;cursor:pointer}.excel-filter-values{max-height:210px;overflow:auto;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0}.excel-filter-footer{display:flex;justify-content:flex-end;gap:7px;padding-top:8px}.excel-filter-footer button{min-width:58px;padding:5px 10px;border:1px solid #64748b;background:#fff;border-radius:3px;cursor:pointer}.excel-filter-footer button[data-action="ok"]{color:#fff;background:#2563eb;border-color:#2563eb}'
  document.head.append(style)
}

function sortPoleRows(index, descending, table, applyFilters) {
  const body = table.querySelector('tbody')
  Array.from(body.rows).sort((a, b) => {
    const result = (a.children[index]?.textContent.trim() ?? '').localeCompare(b.children[index]?.textContent.trim() ?? '', undefined, { numeric: true })
    return descending ? -result : result
  }).forEach((row) => body.append(row))
  applyFilters()
}

function renderWorkspace() {
  return `<main class="workspace-main"><section class="workspace-heading"><div><p class="eyebrow">OSP QUALITY CONTROL</p><h1>OSP QC<br><em>App.</em></h1></div><p class="lede">One workspace for pole inspection, street typical validation, span footage, and address unit review.</p></section><section class="website-grid">${sessions.map((label, index) => `<article class="website-tile"><div class="tile-top"><span class="tile-number">0${index + 1}</span><span class="tile-status">${index < 2 || index === 2 ? 'Built in' : 'Ready to add'}</span></div><h2>${label}</h2><p>${sessionDescriptions[index]}</p>${index < 2 || index === 2 ? `<button class="tile-open" type="button" data-session="${index}">Open ${label} ↗</button>` : `<div class="tile-url"><input type="url" data-tile-url="${index}" placeholder="https://your-website.com" value="${state.sessionUrls[index]}" /><button type="button" data-load-tile="${index}">Open ↗</button></div><small>ZIP project or website URL can be added here.</small>`}</article>`).join('')}</section></main>`
}

function renderPoleInspector() {
  const errors = poleState.results.filter((row) => row.status === 'ERROR').length
  return `<main class="inspector-main"><section class="inspector-heading"><div><p class="eyebrow">WEBSITE 01 / POLE INSPECTOR</p><h1>Pole QC,<br><em>made practical.</em></h1><p class="lede">Upload the QC workbook, choose the market, and review pole records in this workspace.</p></div><div class="inspector-stat"><span>QC errors</span><strong>${errors}</strong><small>${poleState.results.length ? `${poleState.results.length} pole rows processed` : 'No workbook loaded'}</small></div></section><section class="inspector-toolbar"><label class="workbook-upload"><strong>Upload Excel workbook</strong><small>${poleState.workbook ? poleState.workbook.name : 'POLE, NOTE, ANCHOR and GUY sheets supported'}</small><input id="pole-workbook" type="file" accept=".xlsx,.xls" /></label><label class="market-select">Market<select id="pole-market">${markets.map((market) => `<option ${poleState.market === market ? 'selected' : ''}>${market}</option>`).join('')}</select></label><button id="run-pole-qc" class="run-qc" type="button" ${poleState.workbook ? '' : 'disabled'}>Run QC check ↗</button></section>${poleState.status ? `<p class="inspector-status">${poleState.status}</p>` : ''}<section class="inspector-results"><div class="results-head"><div><p class="eyebrow">POLE REGISTER</p><h2>Inspection results</h2></div><span>${errors ? `${errors} records need review` : 'Ready for review'}</span></div><div class="table-wrap"><table><thead><tr><th>Row</th><th>Accessible</th><th>Height</th><th>Class</th><th>HOA (ft)</th><th>Pole ID</th><th>Notes / details</th><th>Status</th></tr></thead><tbody>${poleState.results.length ? poleState.results.slice(0, 250).map((row) => `<tr class="${row.status === 'ERROR' ? 'danger-row' : ''}"><td class="mono">${row.rowNum}</td><td>${row.accessible}</td><td>${row.height}</td><td>${row.classVal}</td><td>${row.hoa}</td><td class="mono">${row.poleID}</td><td class="notes-cell">${row.details || '—'}</td><td><span class="status ${row.status === 'ERROR' ? 'danger' : 'good'}"><span></span>${row.status === 'ERROR' ? 'Review' : 'Ready'}</span></td></tr>`).join('') : '<tr><td class="empty" colspan="8">Upload a Pole Inspector workbook to begin.</td></tr>'}</tbody></table></div></section></main>`
}

function readPoleWorkbook(file) {
  const reader = new FileReader()
  reader.onload = (event) => {
    const workbook = XLSX.read(event.target.result, { type: 'array' })
    poleState.workbook = file
    poleState.parsed = Object.fromEntries(workbook.SheetNames.map((name) => [name.toUpperCase(), XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 })]))
    poleState.status = `Loaded sheets: ${workbook.SheetNames.join(', ')}`
    render()
  }
  reader.readAsArrayBuffer(file)
}

function runPoleQc() {
  const rows = poleState.parsed?.POLE || []
  poleState.results = rows.slice(1).filter((row) => row?.length).map((row, index) => ({ rowNum: index + 2, accessible: row[0] ?? '—', classVal: row[1] ?? '—', hoa: row[5] ? Math.round(Number(row[5]) * 3.28084 * 100) / 100 : '—', height: row[7] ?? '—', poleID: row[8] ?? '—', details: '', status: row[0] === 'n' ? 'READY' : 'READY' }))
  poleState.status = `QC finished for ${poleState.market}`
  render()
}

function render() {
  const rows = allRows()
  const visible = rows.filter((row) => (state.filter === 'all' || row.kind === state.filter) && `${row.kind} ${row.ID ?? ''} ${row.NOTES ?? ''} ${row.MYW_TITLE ?? ''}`.toLowerCase().includes(state.search.toLowerCase()))
  const total = totals(rows)
  const flagged = rows.filter((row) => row.overLimit).length
  const aerialTotal = totals(state.aerial)
  const buriedTotal = totals(state.buried)
  const navigation = state.session === -1 ? '' : `<nav class="session-tabs" aria-label="Website sessions"><button class="session-tab ${state.session === -1 ? 'active' : ''}" data-session="-1"><span>⌂</span>Workspace</button>${sessions.map((label, index) => `<button class="session-tab ${state.session === index ? 'active' : ''}" data-session="${index}"><span>0${index + 1}</span>${label}</button>`).join('')}</nav>`
  document.querySelector('#app').innerHTML = `
    <header class="topbar"><div class="brand"><span class="brand-mark">↗</span><span>OSP QC APP</span></div>${navigation}<div class="top-meta">${state.session === -1 ? 'Quality control workspace' : `<span class="live-dot"></span> ${rows.length ? `${rows.length.toLocaleString()} records` : 'Local workspace'}`}</div></header>
    ${state.session === -1 ? renderWorkspace() : state.session !== 2 ? renderSessionPortal() : `<main>
      <section class="intro"><div><p class="eyebrow">FIELD MEASUREMENT DESK</p><h1>Span length,<br><em>made legible.</em></h1><p class="lede">Load your aerial and buried path exports. Compare measured length with calculated length, then jump straight into IQGeo when a row needs context.</p></div><div class="rule-card"><div class="rule-title">Review threshold</div><div class="rule-alert"><span class="alert-dot"></span> Spans over 370 ft require review</div><p class="rule-copy">Difference = measured length − calculated length</p></div></section>
      <section class="upload-grid">${uploadCard('aerial', 'Aerial span CSV', '⌁')}${uploadCard('buried', 'Buried span CSV', '⌁')}</section>
      <section class="summary-grid">
        <article class="metric metric-primary"><span class="metric-label">Total footage</span><strong>${format(total.span)}</strong><small>Aerial + buried span</small></article>
        <article class="metric"><span class="metric-label">Aerial total span</span><strong>${format(aerialTotal.span)}</strong><small>${state.aerial.length ? `${state.aerial.length.toLocaleString()} aerial rows` : 'No aerial CSV loaded'}</small></article>
        <article class="metric"><span class="metric-label">Buried total span</span><strong>${format(buriedTotal.span)}</strong><small>${state.buried.length ? `${state.buried.length.toLocaleString()} buried rows` : 'No buried CSV loaded'}</small></article>
        <article class="metric metric-alert"><span class="metric-label">Review flags</span><strong>${flagged}</strong><small>${flagged ? 'Spans above 370 ft' : 'No over-limit spans'}</small></article>
      </section>
      <section class="data-panel"><div class="panel-head"><div><p class="eyebrow">ROW DETAIL</p><h2>Measurement register</h2></div><div class="controls"><div class="segmented"><button class="${state.filter === 'all' ? 'active' : ''}" data-filter="all">All</button><button class="${state.filter === 'aerial' ? 'active' : ''}" data-filter="aerial">Aerial</button><button class="${state.filter === 'buried' ? 'active' : ''}" data-filter="buried">Buried</button></div><input id="search" type="search" placeholder="Search ID or notes" value="${state.search}" /></div></div>
        <div class="table-wrap"><table><thead><tr><th>Type</th><th>IQ ID</th><th>ID</th><th>Unique ID</th><th>Measured</th><th>Calculated</th><th>Difference</th><th>Notes</th><th>Strand spec</th><th>IQGeo</th><th>Status</th></tr></thead><tbody>${visible.length ? visible.slice(0, 250).map((row) => `<tr class="${row.overLimit ? 'danger-row' : ''}"><td><span class="type-pill ${row.kind}">${row.kind}</span></td><td class="mono">${row.MODIFICATION_USER ?? '—'}</td><td class="mono">${row.ID ?? '—'}</td><td class="mono">${row['UNIQUE ID'] ?? '—'}</td><td>${format(row.span)}</td><td>${format(row.calculated)}</td><td class="${row.difference < 0 ? 'negative' : ''}">${row.difference >= 0 ? '+' : ''}${format(row.difference)}</td><td class="notes-cell">${row.NOTES || '—'}</td><td class="strand-cell">${row.STRAND_SPEC || '—'}</td><td>${row.iqgeo ? `<a class="iqgeo-link" href="${row.iqgeo}" target="_blank" rel="noopener">Open IQGeo ↗</a>` : '—'}</td><td>${row.overLimit ? '<span class="status danger"><span></span> Review</span>' : '<span class="status good"><span></span> Within limit</span>'}</td></tr>`).join('') : '<tr><td class="empty" colspan="11">Upload an aerial or buried CSV to populate the register.</td></tr>'}</tbody></table></div>${visible.length > 250 ? `<p class="table-note">Showing 250 of ${visible.length.toLocaleString()} matching rows.</p>` : ''}</section>
    </main>`}<footer><span>OSP QC APP</span><span>Developed by Shubham Srivastav · CSV stays in your browser</span></footer>`
  bindEvents()
}

function bindEvents() {
  document.querySelectorAll('input[type="file"]').forEach((input) => input.addEventListener('change', async (event) => {
    const file = event.target.files[0]
    if (!file) return
    state[event.target.dataset.kind] = normalize(parseCsv(await file.text()), event.target.dataset.kind, file.name)
    render()
  }))
  document.querySelectorAll('[data-filter]').forEach((button) => button.addEventListener('click', () => { state.filter = button.dataset.filter; render() }))
  document.querySelector('#search')?.addEventListener('input', (event) => { state.search = event.target.value; render() })
  document.querySelectorAll('[data-session]').forEach((button) => button.addEventListener('click', () => { state.session = Number(button.dataset.session); render() }))
  document.querySelector('#save-session')?.addEventListener('click', () => {
    const url = document.querySelector('#session-url').value.trim()
    if (!url) return
    state.sessionUrls[state.session] = /^https?:\/\//i.test(url) ? url : `https://${url}`
    render()
  })
  document.querySelectorAll('[data-load-tile]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.loadTile)
    const input = document.querySelector(`[data-tile-url="${index}"]`)
    const url = input.value.trim()
    if (!url) return
    state.sessionUrls[index] = /^https?:\/\//i.test(url) ? url : `https://${url}`
    state.session = index
    render()
  }))
  const embeddedFrame = document.querySelector('#embedded-site-frame')
  if (embeddedFrame) {
    const enhance = () => {
      addPoleColumnFilters(embeddedFrame)
      const observer = new MutationObserver(() => addPoleColumnFilters(embeddedFrame))
      if (embeddedFrame.contentDocument?.body) observer.observe(embeddedFrame.contentDocument.body, { childList: true, subtree: true })
    }
    embeddedFrame.addEventListener('load', enhance, { once: true })
    if (embeddedFrame.contentDocument?.readyState === 'complete') enhance()
  }
}

render()
