export type TMessageRole = 'user' | 'assistant' | 'system'

export type TMessage = {
  id: string
  role: TMessageRole
  content: string
  timestamp?: number
}

