export class InvalidAIAnswerError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InvalidAIAnswerError'
  }
}

export type TValidAnswer = '是' | '否' | '无关'

function normalizeModelText(text: string) {
  return text.trim().replace(/[\s\u3000]/g, '')
}

function extractAnswer(text: string): TValidAnswer | null {
  const normalized = normalizeModelText(text)
  if (!normalized) return null

  const isExact = (s: string) => normalized === s
  if (isExact('是')) return '是'
  if (isExact('否')) return '否'
  if (isExact('无关')) return '无关'

  // 允许模型返回了额外字符：尽量从中提取三选一
  const hasUnrelated = normalized.includes('无关')
  const hasYes = normalized.includes('是')
  const hasNo = normalized.includes('否')

  // 只有一个命中时直接返回；命中多个时仍返回空，交给重试/兜底
  const hits = [hasYes, hasNo, hasUnrelated].filter(Boolean).length
  if (hits !== 1) return null

  if (hasUnrelated) return '无关'
  if (hasYes) return '是'
  if (hasNo) return '否'

  return null
}

export type TStoryForAI = {
  surface: string
  bottom: string
}

export type TUserApiConfigForAI = {
  apiKey: string
  model: string
  endpoint: string
}

function buildSystemPrompt(story: TStoryForAI, strictMode = false) {
  if (strictMode) {
    // 更强约束的重试 prompt：仅输出三选一词之一（“无关”为两个字）
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

export async function askAI(
  question: string,
  story: TStoryForAI,
  userApiConfig: TUserApiConfigForAI,
): Promise<TValidAnswer> {
  const timeoutMs = 20000

  const apiKey = userApiConfig.apiKey
  const endpoint = userApiConfig.endpoint
  const model = userApiConfig.model

  if (!apiKey) {
    throw new Error('缺少 API Key：请先在首页完成 BYOK 配置。')
  }

  if (!endpoint) {
    throw new Error('缺少 Endpoint：请在首页填写 DeepSeek API 地址。')
  }

  const lastAttemptOutputs: string[] = []

  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), timeoutMs)

    try {
      const systemPrompt = buildSystemPrompt(story, attempt === 2)
      const userPrompt =
        attempt === 1
          ? `玩家问题：${question}\n\n请只输出：是 / 否 / 无关`
          : `问题：${question}\n\n只输出以下之一：是 / 否 / 无关（三选一，勿加其它字）`

      const response = await fetch(endpoint, {
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

      if (!response.ok) {
        const text = await response.text().catch(() => '')
        // 常见：401/403/429
        if (response.status === 401 || response.status === 403) {
          throw new Error('API Key 无效或无权限（401/403）。请检查后重试。')
        }
        if (response.status === 429) {
          throw new Error('API 限流（429）。请稍后重试或检查余额/速率。')
        }
        throw new Error(`AI 请求失败：HTTP ${response.status}${text ? `: ${text.slice(0, 80)}` : ''}`)
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: { content?: string }
          text?: string
        }>
      }
      const content =
        data?.choices?.[0]?.message?.content ??
        data?.choices?.[0]?.text ??
        ''

      const raw = String(content)
      lastAttemptOutputs.push(raw)
      const answer = extractAnswer(raw)
      if (answer) return answer

      // 若不合规，第二次重试后再抛错
    } finally {
      clearTimeout(timer)
    }
  }

  throw new InvalidAIAnswerError(
    `AI 输出不合规：无法解析“是/否/无关”。（最近输出：${lastAttemptOutputs
      .slice(-2)
      .join(' / ')
      .slice(0, 60)}...）`,
  )
}

