import type { OpenAIDelta, OpenAIResponse } from '@/types/chat'

/**
 * 流式请求后端聊天接口，逐 token 回调内容。
 *
 * 同时支持三种格式：
 * 1. OpenAI 兼容 SSE（text/event-stream）— 每行以 "data: " 开头
 * 2. OpenAI 兼容非流式 JSON 响应
 * 3. 纯文本 chunk 流 — 直接返回文本块
 */
export async function streamChat(
  url: string,
  body: Record<string, unknown>,
  options: {
    onToken: (token: string) => void
    onDone: () => void
    onError: (error: Error) => void
    signal?: AbortSignal
  },
): Promise<void> {
  const { onToken, onDone, onError, signal } = options

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    onError(err instanceof Error ? err : new Error(String(err)))
    return
  }

  if (!response.ok) {
    onError(new Error(`HTTP ${response.status}: ${response.statusText}`))
    return
  }

  const contentType = response.headers.get('content-type') ?? ''
  const isSSE = contentType.includes('text/event-stream')
  const isJSON = contentType.includes('application/json')

  // ---------- 格式 2: OpenAI 非流式 JSON 响应 ----------
  if (isJSON && !isSSE && body.stream === false) {
    try {
      const data: OpenAIResponse = await response.json()
      const content = data.choices[0]?.message?.content
      if (content) {
        onToken(content)
      }
      onDone()
      return
    } catch (err) {
      onError(err instanceof Error ? err : new Error('JSON 解析失败'))
      return
    }
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onError(new Error('Response body is not readable'))
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      buffer += decoder.decode(value, { stream: true })

      if (isSSE) {
        // ---------- 格式 1: OpenAI SSE ----------
        // 按行拆分，保留未完成的行留到下一轮
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || trimmed.startsWith(':')) continue // 注释或空行
          if (trimmed === 'data: [DONE]') {
            onDone()
            return
          }
          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6)
            try {
              const parsed: OpenAIDelta = JSON.parse(jsonStr)
              const content = parsed.choices[0]?.delta?.content
              if (content) onToken(content)
            } catch {
              // JSON 解析失败则跳过该行
            }
          }
        }
      } else {
        // ---------- 格式 3: 纯文本 chunk ----------
        // 直接将收到的文本块输出
        onToken(buffer)
        buffer = ''
      }
    }

    // 流结束，若 buffer 中还有剩余内容则输出
    if (buffer.trim()) {
      if (isSSE) {
        const trimmed = buffer.trim()
        if (trimmed.startsWith('data: ') && trimmed !== 'data: [DONE]') {
          try {
            const parsed: OpenAIDelta = JSON.parse(trimmed.slice(6))
            const content = parsed.choices[0]?.delta?.content
            if (content) onToken(content)
          } catch {
            // ignore
          }
        }
      } else {
        onToken(buffer)
      }
    }

    onDone()
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    onError(err instanceof Error ? err : new Error(String(err)))
  } finally {
    reader.releaseLock()
  }
}

/** 生成唯一 ID */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

/**
 * 调用后端咨询接口（SSE 流式）
 * 
 * 后端返回格式：Flux<String>，每个数据块是字符串片段
 */
export async function streamConsult(
  url: string,
  body: { sessionId: string; message: string },
  options: {
    onToken: (token: string) => void
    onDone: () => void
    onError: (error: Error) => void
    signal?: AbortSignal
  },
): Promise<void> {
  const { onToken, onDone, onError, signal } = options

  let response: Response
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(body),
      signal,
    })
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    onError(err instanceof Error ? err : new Error(String(err)))
    return
  }

  if (!response.ok) {
    onError(new Error(`HTTP ${response.status}: ${response.statusText}`))
    return
  }

  const reader = response.body?.getReader()
  if (!reader) {
    onError(new Error('Response body is not readable'))
    return
  }

  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      buffer += chunk
      
      // 处理 SSE 格式数据 - 按行分割处理
      const lines = buffer.split('\n')
      buffer = lines.pop() ?? ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed) continue
        
        // SSE 格式: data:xxx 或 data: xxx
        if (trimmed.startsWith('data:')) {
          // 提取 data: 后的内容（兼容有空格和无空格的情况）
          const content = trimmed.slice(5).trimStart()
          if (content && content !== '[DONE]') {
            onToken(content)
          }
        }
      }
    }

    // 处理剩余内容
    if (buffer.trim()) {
      const trimmed = buffer.trim()
      if (trimmed.startsWith('data:')) {
        const content = trimmed.slice(5).trimStart()
        if (content && content !== '[DONE]') {
          onToken(content)
        }
      }
    }

    onDone()
  } catch (err) {
    if ((err as Error).name === 'AbortError') return
    onError(err instanceof Error ? err : new Error(String(err)))
  } finally {
    reader.releaseLock()
  }
}
