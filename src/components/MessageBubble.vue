<script setup lang="ts">
import { computed, ref, watch, nextTick } from 'vue'
import type { ChatMessage } from '@/types/chat'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'

const props = defineProps<{
  message: ChatMessage
}>()

const emit = defineEmits<{
  copy: []
  regenerate: []
}>()

const copied = ref(false)

// 初始化 marked（带代码高亮）
const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      if (lang && hljs.getLanguage(lang)) {
        return hljs.highlight(code, { language: lang }).value
      }
      return hljs.highlightAuto(code).value
    },
  }),
)

marked.setOptions({
  breaks: true,
  gfm: true,
})

const renderedContent = computed(() => {
  if (props.message.thinking) return ''
  const raw = props.message.content
  if (!raw) return ''
  
  // 流式过程中使用纯文本显示，避免频繁渲染 Markdown 导致闪烁
  if (props.message.streaming) {
    return formatPlainText(raw)
  }
  
  // 流式完成后渲染 Markdown
  try {
    return marked.parse(raw) as string
  } catch {
    return formatPlainText(raw)
  }
})

/** 格式化纯文本，增强可读性 */
function formatPlainText(text: string): string {
  // 先将 ### 标题转换为带样式的标题
  let formatted = text
    .replace(/###\s*(.+?)(?=\d+\.|$)/g, '<br><br><strong style="color:#fbbf24;font-size:1.1em">$1</strong><br>')
    // 将数字序号（如 1. 2. 3.）加粗
    .replace(/(\d+\.)\s/g, '<strong>$1</strong> ')
    // 将 - 列表项转换为带圆点的样式
    .replace(/\n-\s*/g, '<br>• ')
    // 将换行符转换为 <br>
    .replace(/\n/g, '<br>')
    // 将中文序号（如 一、二、）加粗
    .replace(/([一二三四五六七八九十]+、)/g, '<strong>$1</strong>')
    // 将冒号前的文字加粗（如 "疼痛性质："）
    .replace(/([^：<br>]+：)/g, '<strong>$1</strong>')
    // 将问号前的内容高亮
    .replace(/([^？]+？)/g, '<span style="color:#60a5fa">$1</span>')
  
  return formatted
}

const isUser = computed(() => props.message.role === 'user')

function handleCopy() {
  navigator.clipboard.writeText(props.message.content).then(() => {
    copied.value = true
    setTimeout(() => { copied.value = false }, 2000)
  })
  emit('copy')
}

function handleRegenerate() {
  emit('regenerate')
}

// 代码块复制按钮：为渲染后的 pre>code 添加复制按钮
const contentRef = ref<HTMLElement | null>(null)

watch(renderedContent, async () => {
  await nextTick()
  if (!contentRef.value) return
  const blocks = contentRef.value.querySelectorAll('pre')
  blocks.forEach((pre) => {
    if (pre.querySelector('.code-copy-btn')) return
    const btn = document.createElement('button')
    btn.className = 'code-copy-btn'
    btn.textContent = 'Copy'
    btn.addEventListener('click', () => {
      const code = pre.querySelector('code')?.textContent ?? ''
      navigator.clipboard.writeText(code).then(() => {
        btn.textContent = 'Copied!'
        setTimeout(() => { btn.textContent = 'Copy' }, 2000)
      })
    })
    pre.style.position = 'relative'
    pre.appendChild(btn)
  })
})
</script>

<template>
  <div
    class="flex w-full mb-4"
    :class="isUser ? 'justify-end' : 'justify-start'"
  >
    <div class="flex max-w-[85%] md:max-w-[70%] gap-3" :class="isUser ? 'flex-row-reverse' : 'flex-row'">
      <!-- 头像 -->
      <div
        class="shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
        :class="isUser ? 'bg-blue-600 text-white' : 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'"
      >
        {{ isUser ? 'U' : 'AI' }}
      </div>

      <!-- 消息内容 -->
      <div class="flex flex-col" :class="isUser ? 'items-end' : 'items-start'">
        <div
          class="rounded-2xl px-4 py-3 text-sm leading-relaxed"
          :class="[
            isUser
              ? 'bg-blue-600 text-white rounded-br-md'
              : 'bg-zinc-800 text-zinc-100 rounded-bl-md',
            message.error ? 'border border-red-500/50' : '',
          ]"
        >
          <!-- 正在思考占位 -->
          <div v-if="message.thinking" class="flex items-center gap-2 text-zinc-400">
            <span class="thinking-dots">
              <span></span><span></span><span></span>
            </span>
            正在思考…
          </div>

          <!-- Markdown 渲染内容 -->
          <div
            v-else
            ref="contentRef"
            class="markdown-body prose prose-invert prose-sm max-w-none"
            v-html="renderedContent"
          />

          <!-- 流式光标 -->
          <span
            v-if="message.streaming && !message.thinking"
            class="inline-block w-0.5 h-4 bg-zinc-300 animate-pulse ml-0.5 align-text-bottom"
          />
        </div>

        <!-- 操作按钮 -->
        <div
          v-if="!message.streaming && !message.thinking && message.content"
          class="flex items-center gap-2 mt-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          :class="isUser ? 'flex-row-reverse' : 'flex-row'"
        >
          <button
            class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800"
            @click="handleCopy"
          >
            {{ copied ? '已复制' : '复制' }}
          </button>
          <button
            v-if="!isUser"
            class="text-xs text-zinc-500 hover:text-zinc-300 transition-colors px-1.5 py-0.5 rounded hover:bg-zinc-800"
            @click="handleRegenerate"
          >
            重新生成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
/* 思考动画 */
.thinking-dots {
  display: inline-flex;
  gap: 3px;
}
.thinking-dots span {
  display: inline-block;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: currentColor;
  animation: thinking-bounce 1.4s infinite ease-in-out both;
}
.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }

@keyframes thinking-bounce {
  0%, 80%, 100% { transform: scale(0); }
  40% { transform: scale(1); }
}

/* 代码块复制按钮 */
.code-copy-btn {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 8px;
  font-size: 11px;
  background: rgba(255, 255, 255, 0.1);
  color: #aaa;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s;
}
.code-copy-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

/* Markdown 样式覆盖 */
.markdown-body pre {
  background: #1a1a2e;
  border-radius: 8px;
  padding: 1rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}
.markdown-body code {
  font-size: 0.85em;
  font-family: 'Fira Code', 'Cascadia Code', monospace;
}
.markdown-body :not(pre) > code {
  background: rgba(255, 255, 255, 0.1);
  padding: 0.15em 0.4em;
  border-radius: 4px;
}
.markdown-body table {
  border-collapse: collapse;
  width: 100%;
  margin: 0.5rem 0;
}
.markdown-body th,
.markdown-body td {
  border: 1px solid #333;
  padding: 6px 12px;
  text-align: left;
}
.markdown-body th {
  background: rgba(255, 255, 255, 0.05);
}
.markdown-body blockquote {
  border-left: 3px solid #555;
  padding-left: 1rem;
  color: #999;
  margin: 0.5rem 0;
}
.markdown-body a {
  color: #60a5fa;
  text-decoration: underline;
}
.markdown-body ul, .markdown-body ol {
  padding-left: 1.5rem;
  margin: 0.25rem 0;
}
.markdown-body p {
  margin: 0.35rem 0;
}
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  margin: 0.75rem 0 0.35rem;
  font-weight: 600;
}
</style>
