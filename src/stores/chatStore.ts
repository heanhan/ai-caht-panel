import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import type { ChatSession, ChatMessage, AppSettings } from '@/types/chat'
import { streamConsult, generateId } from '@/utils/stream'

const STORAGE_KEY = 'ai-chat-sessions'
const SETTINGS_KEY = 'ai-chat-settings'

function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ChatSession[]) : []
  } catch {
    return []
  }
}

function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (raw) return JSON.parse(raw) as AppSettings
  } catch {
    // ignore
  }
  return {
    temperature: 0.7,
  }
}

export const useChatStore = defineStore('chat', () => {
  // ---- State ----
  const sessions = ref<ChatSession[]>(loadSessions())
  const activeSessionId = ref<string | null>(sessions.value[0]?.id ?? null)
  const isStreaming = ref(false)
  const settings = ref<AppSettings>(loadSettings())
  const sidebarOpen = ref(true)

  let abortController: AbortController | null = null

  // ---- Getters ----
  const activeSession = computed(() =>
    sessions.value.find((s) => s.id === activeSessionId.value) ?? null,
  )

  const sortedSessions = computed(() =>
    [...sessions.value].sort((a, b) => b.updatedAt - a.updatedAt),
  )

  // ---- Persistence ----
  watch(sessions, (val) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
  }, { deep: true })

  watch(settings, (val) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(val))
  }, { deep: true })

  // ---- Actions ----
  function createSession(): string {
    const session: ChatSession = {
      id: generateId(),
      title: '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    sessions.value.unshift(session)
    activeSessionId.value = session.id
    return session.id
  }

  function deleteSession(id: string) {
    const idx = sessions.value.findIndex((s) => s.id === id)
    if (idx === -1) return
    sessions.value.splice(idx, 1)
    if (activeSessionId.value === id) {
      activeSessionId.value = sessions.value[0]?.id ?? null
    }
  }

  function renameSession(id: string, title: string) {
    const session = sessions.value.find((s) => s.id === id)
    if (session) {
      session.title = title
      session.updatedAt = Date.now()
    }
  }

  function setActiveSession(id: string) {
    activeSessionId.value = id
  }

  /** 发送消息并处理流式响应 */
  async function sendMessage(content: string) {
    let session = activeSession.value
    if (!session) {
      createSession()
      session = activeSession.value!
    }

    // 用户消息
    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content,
      timestamp: Date.now(),
    }
    session.messages.push(userMsg)

    // 自动命名：第一条消息时用前 20 字作为标题
    if (session.messages.length === 1) {
      session.title = content.slice(0, 20) + (content.length > 20 ? '…' : '')
    }
    session.updatedAt = Date.now()

    // AI 占位消息（正在思考…）
    const assistantMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      streaming: true,
      thinking: true,
    }
    session.messages.push(assistantMsg)
    // 获取消息索引用于后续更新
    const msgIndex = session.messages.length - 1

    isStreaming.value = true
    abortController = new AbortController()

    const url = '/api/v1/consultation/stream'

    // 使用 session.id 作为 sessionId，确保同一会话下保持一致
    await streamConsult(
      url,
      {
        sessionId: session.id,
        message: content,
      },
      {
        signal: abortController.signal,
        onToken(token: string) {
          // 后端已逐字流式返回，直接实时显示
          const msg = session.messages[msgIndex]
          if (msg) {
            msg.thinking = false
            msg.content += token
          }
        },
        onDone() {
          const msg = session.messages[msgIndex]
          if (msg) {
            msg.streaming = false
            msg.thinking = false
          }
          isStreaming.value = false
          abortController = null
          if (session) session.updatedAt = Date.now()
        },
        onError(error: Error) {
          const msg = session.messages[msgIndex]
          if (msg) {
            msg.streaming = false
            msg.thinking = false
            msg.error = true
            msg.content = msg.content || `请求失败: ${error.message}`
          }
          isStreaming.value = false
          abortController = null
        },
      },
    )
  }

  /** 中断当前生成 */
  function stopGeneration() {
    abortController?.abort()
    abortController = null
    isStreaming.value = false
    // 将正在流式的消息标记为结束
    const session = activeSession.value
    if (session) {
      const last = session.messages[session.messages.length - 1]
      if (last?.streaming) {
        last.streaming = false
        last.thinking = false
      }
    }
  }

  /** 重新生成最后一条 AI 回复 */
  async function regenerateLastMessage() {
    const session = activeSession.value
    if (!session || session.messages.length < 2) return

    // 移除最后的 assistant 消息
    const lastMsg = session.messages[session.messages.length - 1]
    if (lastMsg?.role === 'assistant') {
      session.messages.pop()
    }

    // 取最后一条用户消息的内容重新发送
    const lastUserMsg = [...session.messages].reverse().find((m) => m.role === 'user')
    if (lastUserMsg) {
      // 移除该用户消息（sendMessage 会重新添加）
      const idx = session.messages.indexOf(lastUserMsg)
      session.messages.splice(idx, 1)
      await sendMessage(lastUserMsg.content)
    }
  }

  return {
    sessions,
    activeSessionId,
    activeSession,
    sortedSessions,
    isStreaming,
    settings,
    sidebarOpen,
    createSession,
    deleteSession,
    renameSession,
    setActiveSession,
    sendMessage,
    stopGeneration,
    regenerateLastMessage,
  }
})
