<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { useChatStore } from '@/stores/chatStore'

const store = useChatStore()

const inputText = ref('')
const textareaRef = ref<HTMLTextAreaElement | null>(null)

function autoResize() {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = Math.min(el.scrollHeight, 200) + 'px'
}

watch(inputText, () => {
  nextTick(autoResize)
})

function handleSend() {
  const text = inputText.value.trim()
  if (!text || store.isStreaming) return
  inputText.value = ''
  nextTick(autoResize)
  store.sendMessage(text)
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}
</script>

<template>
  <div class="border-t border-zinc-800 bg-zinc-900/80 backdrop-blur-sm px-4 py-3">
    <div class="max-w-3xl mx-auto flex items-end gap-3">
      <div class="flex-1 relative">
        <textarea
          ref="textareaRef"
          v-model="inputText"
          rows="1"
          :placeholder="store.isStreaming ? 'AI 正在回答中…' : '输入你的问题… (Shift+Enter 换行)'"
          class="w-full resize-none bg-zinc-800 text-zinc-100 placeholder-zinc-500 rounded-xl px-4 py-3 pr-12 text-sm leading-relaxed border border-zinc-700 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500/50 transition-colors"
          :disabled="store.isStreaming"
          @keydown="handleKeydown"
        />
      </div>

      <!-- 发送 / 停止按钮 -->
      <button
        v-if="!store.isStreaming"
        class="shrink-0 w-10 h-10 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors"
        :disabled="!inputText.trim()"
        @click="handleSend"
      >
        <!-- 发送图标 -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
        </svg>
      </button>
      <button
        v-else
        class="shrink-0 w-10 h-10 rounded-xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors"
        @click="store.stopGeneration()"
      >
        <!-- 停止图标 -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
          <path fill-rule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clip-rule="evenodd" />
        </svg>
      </button>
    </div>
  </div>
</template>
