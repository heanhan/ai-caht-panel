/** 消息角色 */
export type MessageRole = 'user' | 'assistant'

/** 单条聊天消息 */
export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  timestamp: number
  /** 是否正在流式生成中 */
  streaming?: boolean
  /** 是否为"正在思考"占位消息 */
  thinking?: boolean
  /** 是否生成失败 */
  error?: boolean
}

/** 单个对话会话 */
export interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: number
  updatedAt: number
}

/** 发送给后端的请求体 */
export interface ChatRequest {
  messages: Array<{ role: MessageRole; content: string }>
  temperature?: number
  stream: boolean
}

/** OpenAI 兼容 SSE 格式中的 delta 结构 */
export interface OpenAIDelta {
  choices: Array<{
    delta: {
      content?: string
      role?: string
    }
    finish_reason?: string | null
  }>
}

/** OpenAI 兼容非流式响应结构 */
export interface OpenAIResponse {
  choices: Array<{
    message: {
      content: string
      role: string
    }
    finish_reason?: string | null
  }>
}

/** 后端接口请求体 */
export interface BackendChatRequest {
  sessionId: string
  message: string
}

/** 后端接口响应体 */
export interface BackendChatResponse {
  code: number
  data: {
    reply: string
  }
  message: string
}

/** 设置项 */
export interface AppSettings {
  temperature: number
}
