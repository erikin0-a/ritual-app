/* Ritual Audio Preview — app.js */

// ─── State ────────────────────────────────────────────────────────────────────

const state = {
  catalog: {},       // { roundName: [{ key, text }] }
  roundOrder: [],    // ['Пролог', 'Раунд 1', ...]
  activeRound: null,
  playing: null,     // currently playing Audio object
  playingKey: null,  // currently playing cue key
  roundQueue: null,  // queue for "play entire round"
  audioCache: {},    // key → Audio blob URL
  audioStatus: {},   // key → 'ok' | 'missing' | 'checking'
  modified: {},      // key → modified text (if differs from original)
}

// ─── DOM refs ─────────────────────────────────────────────────────────────────

const sidebar = document.getElementById('sidebar')
const content = document.getElementById('content')
const playRoundBtn = document.getElementById('playRoundBtn')
const headerInfo = document.getElementById('headerInfo')

function getPartners() {
  return {
    p1Name: document.getElementById('p1Name').value.trim() || 'Партнёр 1',
    p2Name: document.getElementById('p2Name').value.trim() || 'Партнёр 2',
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init() {
  try {
    const res = await fetch('/api/catalog')
    const data = await res.json()
    state.catalog = data.groups
    state.roundOrder = data.roundOrder

    const totalCues = Object.values(state.catalog).reduce((s, arr) => s + arr.length, 0)
    headerInfo.textContent = `${totalCues} cue`

    renderSidebar()
    selectRound(state.roundOrder[0])

    // Re-render preview when names change
    document.getElementById('p1Name').addEventListener('input', renderContent)
    document.getElementById('p2Name').addEventListener('input', renderContent)
  } catch (err) {
    content.innerHTML = `<div class="empty-state">Ошибка загрузки: ${err.message}</div>`
  }
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function renderSidebar() {
  // Remove existing tab buttons (keep playRoundBtn)
  Array.from(sidebar.querySelectorAll('.tab-btn')).forEach(b => b.remove())

  for (const round of state.roundOrder) {
    const cues = state.catalog[round] || []
    if (cues.length === 0) continue

    const btn = document.createElement('button')
    btn.className = 'tab-btn'
    btn.dataset.round = round
    btn.textContent = round
    btn.addEventListener('click', () => selectRound(round))
    sidebar.insertBefore(btn, playRoundBtn)
  }
}

function selectRound(round) {
  state.activeRound = round

  // Update active tab
  sidebar.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.round === round)
  })

  playRoundBtn.disabled = false
  renderContent()

  // Check audio status for visible cues (background)
  const cues = state.catalog[round] || []
  cues.forEach(({ key }) => checkAudioStatus(key))
}

// ─── Content ──────────────────────────────────────────────────────────────────

function renderContent() {
  const round = state.activeRound
  const cues = state.catalog[round] || []

  if (cues.length === 0) {
    content.innerHTML = '<div class="empty-state">Нет cue в этом разделе</div>'
    return
  }

  content.innerHTML = ''
  const { p1Name, p2Name } = getPartners()

  for (const { key, text } of cues) {
    const currentText = state.modified[key] ?? text
    const card = createCueCard(key, currentText, p1Name, p2Name)
    content.appendChild(card)
  }
}

function createCueCard(key, text, p1Name, p2Name) {
  const card = document.createElement('div')
  card.className = 'cue-card'
  card.dataset.key = key

  const status = state.audioStatus[key]
  if (status === 'ok') card.classList.add('has-audio')
  else if (status === 'missing') card.classList.add('no-audio')
  if (state.playingKey === key) card.classList.add('playing')

  const badgeHtml = status === 'ok'
    ? '<span class="audio-badge ok">✓ в Supabase</span>'
    : status === 'missing'
      ? '<span class="audio-badge missing">✗ нет аудио</span>'
      : '<span class="audio-badge checking">… проверка</span>'

  const previewHtml = buildPreviewHtml(text, p1Name, p2Name)
  const isModified = state.modified[key] !== undefined && state.modified[key] !== text

  card.innerHTML = `
    <div class="cue-header">
      <span class="cue-id">${key}</span>
      ${badgeHtml}
    </div>
    <textarea class="cue-textarea${isModified ? ' modified' : ''}" data-original="${escHtml(text)}" rows="3">${escHtml(text)}</textarea>
    <div class="cue-preview">${previewHtml}</div>
    <div class="cue-actions">
      <button class="btn btn-play" data-key="${key}">▶ Играть</button>
      <button class="btn btn-regen" data-key="${key}">🔄 Перегенерировать</button>
      <button class="btn btn-save" data-key="${key}"${isModified ? '' : ' disabled'}>💾 Сохранить</button>
      <span class="cue-status" id="status-${key}"></span>
    </div>
  `

  // Textarea change
  const textarea = card.querySelector('.cue-textarea')
  textarea.addEventListener('input', () => {
    const newText = textarea.value
    const original = textarea.dataset.original
    if (newText !== original) {
      state.modified[key] = newText
      textarea.classList.add('modified')
      card.querySelector('.btn-save').disabled = false
    } else {
      delete state.modified[key]
      textarea.classList.remove('modified')
      card.querySelector('.btn-save').disabled = true
    }
    // Update preview
    const { p1Name: n1, p2Name: n2 } = getPartners()
    card.querySelector('.cue-preview').innerHTML = buildPreviewHtml(newText, n1, n2)
  })

  // Play button
  card.querySelector('.btn-play').addEventListener('click', async () => {
    const currentText = state.modified[key] ?? text
    await playCue(key, currentText, card)
  })

  // Regenerate button
  card.querySelector('.btn-regen').addEventListener('click', async () => {
    const currentText = state.modified[key] ?? text
    await regenerateCue(key, currentText, card)
  })

  // Save button
  card.querySelector('.btn-save').addEventListener('click', async () => {
    const currentText = state.modified[key] ?? text
    await saveCue(key, currentText, card)
  })

  return card
}

function buildPreviewHtml(text, p1Name, p2Name) {
  const clean = stripSsml(text)
  return clean
    .replace(/\{\{p1\.name\}\}/g, `<span class="name-highlight">${escHtml(p1Name)}</span>`)
    .replace(/\{\{p2\.name\}\}/g, `<span class="name-highlight">${escHtml(p2Name)}</span>`)
}

function stripSsml(text) {
  return text
    .replace(/<break[^>]*\/>/g, ' ')
    .replace(/<\/?[^>]+>/g, ' ')
    .replace(/\[.*?\]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

// ─── Audio Check ──────────────────────────────────────────────────────────────

async function checkAudioStatus(key) {
  if (state.audioStatus[key]) return // already checked

  try {
    const res = await fetch(`/api/check-audio/${key}`)
    const data = await res.json()
    state.audioStatus[key] = data.allExist ? 'ok' : 'missing'

    // Update badge in DOM if card is visible
    const card = content.querySelector(`[data-key="${key}"]`)
    if (card) {
      const badge = card.querySelector('.audio-badge')
      if (badge) {
        badge.className = `audio-badge ${data.allExist ? 'ok' : 'missing'}`
        badge.textContent = data.allExist ? '✓ в Supabase' : '✗ нет аудио'
      }
      card.classList.remove('has-audio', 'no-audio')
      card.classList.add(data.allExist ? 'has-audio' : 'no-audio')
    }
  } catch {
    // ignore
  }
}

// ─── Play ─────────────────────────────────────────────────────────────────────

async function playCue(key, text, card) {
  const { p1Name, p2Name } = getPartners()
  const btn = card.querySelector('.btn-play')
  const statusEl = card.querySelector(`#status-${key}`)

  // Stop any currently playing audio
  stopCurrentAudio()

  // Toggle off if same key
  if (state.playingKey === key) {
    state.playingKey = null
    btn.textContent = '▶ Играть'
    btn.classList.remove('playing')
    card.classList.remove('playing')
    return
  }

  btn.textContent = '⏳ Загрузка...'
  btn.disabled = true
  statusEl.textContent = 'генерация...'
  statusEl.className = 'cue-status loading'

  try {
    // Check cache first
    let audioUrl = state.audioCache[key]

    if (!audioUrl) {
      const res = await fetch('/api/speak', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, p1Name, p2Name })
      })

      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Server error')
      }

      const blob = await res.blob()
      audioUrl = URL.createObjectURL(blob)
      state.audioCache[key] = audioUrl
    }

    const audio = new Audio(audioUrl)
    state.playing = audio
    state.playingKey = key
    btn.textContent = '⏹ Стоп'
    btn.disabled = false
    btn.classList.add('playing')
    card.classList.add('playing')
    statusEl.textContent = 'играет'
    statusEl.className = 'cue-status ok'

    audio.play()
    audio.onended = () => {
      if (state.playingKey === key) {
        state.playing = null
        state.playingKey = null
        btn.textContent = '▶ Играть'
        btn.classList.remove('playing')
        card.classList.remove('playing')
        statusEl.textContent = ''
      }
    }
  } catch (err) {
    btn.textContent = '▶ Играть'
    btn.disabled = false
    statusEl.textContent = `Ошибка: ${err.message}`
    statusEl.className = 'cue-status error'
  }
}

function stopCurrentAudio() {
  if (state.playing) {
    state.playing.pause()
    state.playing.currentTime = 0
    state.playing = null
  }
  if (state.playingKey) {
    const prevCard = content.querySelector(`[data-key="${state.playingKey}"]`)
    if (prevCard) {
      prevCard.classList.remove('playing')
      const prevBtn = prevCard.querySelector('.btn-play')
      if (prevBtn) {
        prevBtn.textContent = '▶ Играть'
        prevBtn.classList.remove('playing')
      }
    }
    state.playingKey = null
  }
}

// ─── Regenerate ───────────────────────────────────────────────────────────────

async function regenerateCue(key, text, card) {
  const { p1Name, p2Name } = getPartners()
  const btn = card.querySelector('.btn-regen')
  const statusEl = card.querySelector(`#status-${key}`)

  btn.textContent = '⏳...'
  btn.disabled = true
  statusEl.textContent = 'генерирую в ElevenLabs...'
  statusEl.className = 'cue-status loading'

  // Clear audio cache for this key
  delete state.audioCache[key]

  try {
    const res = await fetch('/api/regenerate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, text, p1Name, p2Name })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Server error')

    state.audioStatus[key] = 'ok'

    // Update badge
    const badge = card.querySelector('.audio-badge')
    if (badge) {
      badge.className = 'audio-badge ok'
      badge.textContent = '✓ в Supabase'
    }
    card.classList.remove('no-audio')
    card.classList.add('has-audio')

    btn.textContent = '🔄 Перегенерировать'
    btn.disabled = false
    statusEl.textContent = `✓ ${data.segments.length} сегм. загружено`
    statusEl.className = 'cue-status ok'
    setTimeout(() => { statusEl.textContent = '' }, 4000)

    // Auto-play after regeneration
    await playCue(key, text, card)
  } catch (err) {
    btn.textContent = '🔄 Перегенерировать'
    btn.disabled = false
    statusEl.textContent = `Ошибка: ${err.message}`
    statusEl.className = 'cue-status error'
  }
}

// ─── Save cue ─────────────────────────────────────────────────────────────────

async function saveCue(key, text, card) {
  const btn = card.querySelector('.btn-save')
  const statusEl = card.querySelector(`#status-${key}`)

  btn.disabled = true
  statusEl.textContent = 'сохраняю...'
  statusEl.className = 'cue-status loading'

  try {
    const res = await fetch('/api/save-cue', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, text })
    })

    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Server error')

    // Update catalog state
    const round = state.activeRound
    const cues = state.catalog[round]
    const cue = cues.find(c => c.key === key)
    if (cue) cue.text = text

    delete state.modified[key]
    delete state.audioCache[key]

    // Update textarea dataset
    const textarea = card.querySelector('.cue-textarea')
    if (textarea) {
      textarea.dataset.original = escHtml(text)
      textarea.classList.remove('modified')
    }
    btn.disabled = true
    statusEl.textContent = '✓ сохранено'
    statusEl.className = 'cue-status ok'
    setTimeout(() => { statusEl.textContent = '' }, 3000)
  } catch (err) {
    btn.disabled = false
    statusEl.textContent = `Ошибка: ${err.message}`
    statusEl.className = 'cue-status error'
  }
}

// ─── Play entire round ────────────────────────────────────────────────────────

playRoundBtn.addEventListener('click', async () => {
  const round = state.activeRound
  const cues = state.catalog[round] || []
  if (cues.length === 0) return

  // If already playing round, stop
  if (state.roundQueue) {
    state.roundQueue = null
    stopCurrentAudio()
    playRoundBtn.textContent = '▶ Весь раунд'
    return
  }

  playRoundBtn.textContent = '⏹ Стоп раунд'
  state.roundQueue = [...cues]

  const playNext = async () => {
    if (!state.roundQueue || state.roundQueue.length === 0) {
      state.roundQueue = null
      playRoundBtn.textContent = '▶ Весь раунд'
      return
    }

    const { key, text } = state.roundQueue.shift()
    const currentText = state.modified[key] ?? text
    const card = content.querySelector(`[data-key="${key}"]`)
    if (!card) {
      await playNext()
      return
    }

    // Scroll card into view
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' })

    const { p1Name, p2Name } = getPartners()

    try {
      let audioUrl = state.audioCache[key]
      if (!audioUrl) {
        const res = await fetch('/api/speak', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: currentText, p1Name, p2Name })
        })
        if (res.ok) {
          const blob = await res.blob()
          audioUrl = URL.createObjectURL(blob)
          state.audioCache[key] = audioUrl
        }
      }

      if (audioUrl) {
        const audio = new Audio(audioUrl)
        state.playing = audio
        state.playingKey = key
        card.classList.add('playing')
        const btn = card.querySelector('.btn-play')
        if (btn) { btn.textContent = '⏵ ...'; btn.classList.add('playing') }

        await new Promise(resolve => {
          audio.play()
          audio.onended = resolve
          audio.onerror = resolve
        })

        card.classList.remove('playing')
        if (btn) { btn.textContent = '▶ Играть'; btn.classList.remove('playing') }
        state.playingKey = null
        state.playing = null

        // Pause 1.5s between cues
        await new Promise(r => setTimeout(r, 1500))
      }
    } catch {
      // skip on error
    }

    if (state.roundQueue) await playNext()
  }

  await playNext()
})

// ─── Boot ─────────────────────────────────────────────────────────────────────

init()
