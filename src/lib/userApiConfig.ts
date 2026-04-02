export type TUserApiConfig = {
  apiKey: string
  model: string
  endpoint: string
}

export type TUserApiStatus =
  | { status: 'empty' }
  | { status: 'validating' }
  | { status: 'ready'; config: TUserApiConfig }
  | { status: 'error'; message: string }

const STORAGE_KEY = 'turtle_soup_byok_config'

function normalizeEndpoint(endpoint: string) {
  return endpoint.trim().replace(/\s+/g, '')
}

function normalizeModel(model: string) {
  return model.trim()
}

export function loadUserApiConfig(storage: 'local' | 'session' = 'local') {
  const store =
    storage === 'local' ? window.localStorage : window.sessionStorage
  const raw = store.getItem(STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as Partial<TUserApiConfig> | null
    if (!parsed?.apiKey) return null
    const apiKey = String(parsed.apiKey).trim()
    if (!apiKey) return null
    const model = parsed.model ? String(parsed.model).trim() : 'deepseek-chat'
    const endpoint = parsed.endpoint
      ? normalizeEndpoint(String(parsed.endpoint))
      : 'https://api.deepseek.com/chat/completions'
    return { apiKey, model, endpoint }
  } catch {
    return null
  }
}

export function saveUserApiConfig(config: TUserApiConfig, mode: 'local' | 'session' | 'none') {
  const store =
    mode === 'local'
      ? window.localStorage
      : mode === 'session'
        ? window.sessionStorage
        : null
  if (!store) return
  store.setItem(STORAGE_KEY, JSON.stringify(config))
}

export function clearUserApiConfig() {
  window.localStorage.removeItem(STORAGE_KEY)
  window.sessionStorage.removeItem(STORAGE_KEY)
}

function normalizeModelText(text: string) {
  return text.trim().replace(/[\s\u3000]/g, '')
}

function extractAnswer(text: string): '是' | '否' | '无关' | null {
  const normalized = normalizeModelText(text)
  if (!normalized) return null
  if (normalized.includes('无关') && normalized.includes('是') === false && normalized.includes('否') === false) return '无关'
  if (normalized.includes('是') && !normalized.includes('否') && !normalized.includes('无关')) return '是'
  if (normalized.includes('否') && !normalized.includes('是') && !normalized.includes('无关')) return '否'
  if (normalized === '是') return '是'
  if (normalized === '否') return '否'
  if (normalized === '无关') return '无关'
  return null
}

export async function validateUserApiConfig(config: TUserApiConfig) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(config.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: normalizeModel(config.model),
        messages: [
          {
            role: 'system',
            content: '你是海龟汤游戏主持人。只输出：无关，不要解释，不要换行。',
          },
          { role: 'user', content: '测试' },
        ],
        stream: false,
        temperature: 0.1,
      }),
      signal: controller.signal,
    })

    if (!res.ok) {
      const text = await res.text().catch(() => '')
      throw new Error(`HTTP ${res.status}${text ? `: ${text.slice(0, 80)}` : ''}`)
    }

    const data = (await res.json()) as {
      choices?: Array<{
        message?: { content?: string }
        text?: string
      }>
    }
    const content =
      data?.choices?.[0]?.message?.content ?? data?.choices?.[0]?.text ?? ''

    const answer = extractAnswer(String(content))
    if (!answer) {
      throw new Error('API 可达，但返回无法解析，请检查模型/Endpoint 是否正确。')
    }
    return answer
  } finally {
    clearTimeout(timer)
  }
}

