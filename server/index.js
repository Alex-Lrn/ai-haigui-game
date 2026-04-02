import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { storiesFull } from './storiesFull.js'

dotenv.config()

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000

app.get('/api/test', (req, res) => {
  res.json({ ok: true, service: 'ai-haigui-game-server' })
})

app.get('/api/story-bottom/:storyId', (req, res) => {
  const { storyId } = req.params
  const story = storiesFull.find((s) => s.id === storyId)
  if (!story) return res.status(404).json({ error: 'Story not found' })
  return res.json({ bottom: story.bottom })
})

const VALID_ANSWERS = ['是', '否', '无关']

function normalizeModelText(text) {
  return String(text).trim().replace(/[\s\u3000]/g, '')
}

function extractAnswer(text) {
  const normalized = normalizeModelText(text)
  if (!normalized) return null

  if (normalized === '是') return '是'
  if (normalized === '否') return '否'
  if (normalized === '无关') return '无关'

  // 允许模型返回了额外字符：尽量从中提取三选一
  const hasUnrelated = normalized.includes('无关')
  const hasYes = normalized.includes('是')
  const hasNo = normalized.includes('否')

  const hits = [hasYes, hasNo, hasUnrelated].filter(Boolean).length
  if (hits !== 1) return null

  if (hasUnrelated) return '无关'
  if (hasYes) return '是'
  if (hasNo) return '否'

  return null
}

function buildSystemPrompt(story, strictMode = false) {
  if (strictMode) {
    return `你是海龟汤游戏主持人。根据以下汤底判断玩家问题：

汤底真相：
${story.bottom}

玩家问题：请判断为「是」「否」或「无关」。
只输出这三个词之一，不要任何其他内容。`
  }

  return `你是海龟汤游戏主持人。你掌握当前故事的汤底真相，但玩家只看到汤面信息。

## 汤面（玩家可见）
${story.surface}

## 汤底（你必须依据，用于判断）
${story.bottom}

## 你的任务
玩家会问一个问题。你需要判断“玩家的问题内容与汤底真相的关系”属于以下三种之一：
- 是：问题判断与汤底一致，或问题描述的情况在汤底中成立
- 否：问题判断与汤底矛盾，或问题描述的情况在汤底中不成立
- 无关：无法根据汤底判断，或问题与汤底真相无直接关联

## 输出规则（必须严格遵守）
- 只能输出以下三者之一：是 / 否 / 无关（其中「无关」为两个字，仍属合法输出）
- 禁止输出任何解释、理由、标点符号
- 禁止输出除上述词以外的任何其他文字
- 不要换行，不要添加引号，不要有空格

## 示例对话（学习用）
玩家问：凶手是认识受害者的吗？
你答：是

玩家问：案发时间在晚上吗？
你答：否

玩家问：今天天气如何？
你答：无关

## 再次强调
无论玩家问什么，你都只能从「是」「否」「无关」中选一个输出，不要任何其他内容。`
}

async function askDeepSeek(question, story) {
  const apiKey = process.env.DEEPSEEK_API_KEY
  if (!apiKey) {
    throw new Error('缺少环境变量 DEEPSEEK_API_KEY')
  }

  const model = process.env.DEEPSEEK_MODEL ?? 'deepseek-chat'
  const endpoint =
    process.env.DEEPSEEK_API_URL ??
    'https://api.deepseek.com/chat/completions'

  const attempts = 2
  const timeoutMs = Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 25000)
  let lastContent = ''

  for (let attempt = 1; attempt <= attempts; attempt++) {
    const systemPrompt = buildSystemPrompt(story, attempt === 2)
    const userPrompt =
      attempt === 1
        ? `玩家问题：${question}\n\n请只输出：是 / 否 / 无关`
        : `问题：${question}\n\n只输出以下之一：是 / 否 / 无关（三选一，勿加其它字）`

    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    let response
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        signal: controller.signal,
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          stream: false,
          temperature: 0.1,
        }),
      })
    } finally {
      clearTimeout(timer)
    }

    if (!response.ok) {
      throw new Error(`AI API 请求失败：HTTP ${response.status}`)
    }

    const data = await response.json()
    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      ''

    lastContent = String(content)

    const answer = extractAnswer(lastContent)
    if (answer && VALID_ANSWERS.includes(answer)) return answer
  }

  // 最终兜底：返回无关（也避免把模型原文带回前端）
  const fallback = extractAnswer(lastContent) ?? '无关'
  return fallback
}

app.post('/api/chat', async (req, res) => {
  try {
    const { storyId, question } = req.body ?? {}
    if (!storyId || !question) {
      return res.status(400).json({ error: 'Missing storyId or question' })
    }

    const requestId = Math.random().toString(36).slice(2)
    console.log(
      `[${requestId}] [api/chat] storyId=${storyId} question=${String(question).slice(0, 60)}`,
    )

    const story = storiesFull.find((s) => s.id === storyId)
    if (!story) {
      return res.status(404).json({ error: 'Story not found' })
    }

    const answer = await askDeepSeek(question, story)
    return res.json({ answer })
  } catch (e) {
    console.error('[api/chat] error:', e)
    return res.status(500).json({
      error: 'AI request failed',
      detail: e instanceof Error ? e.message : String(e),
    })
  }
})

app.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`)
})

