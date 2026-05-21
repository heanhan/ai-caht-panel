<script setup lang="ts">
import { ref, nextTick, watch, onMounted } from 'vue'
import { useChatStore } from '@/stores/chatStore'
import MessageBubble from './MessageBubble.vue'
import InputArea from './InputArea.vue'
import SettingsModal from './SettingsModal.vue'

const store = useChatStore()

const messagesContainer = ref<HTMLElement | null>(null)
const showSettings = ref(false)

// 自动滚动到底部
function scrollToBottom() {
  nextTick(() => {
    const el = messagesContainer.value
    if (el) {
      el.scrollTop = el.scrollHeight
    }
  })
}

// 监听消息变化，自动滚动
watch(
  () => store.activeSession?.messages,
  () => scrollToBottom(),
  { deep: true },
)

onMounted(scrollToBottom)

const exampleQuestions = [
  '请解释 JavaScript 中的闭包',
  '帮我写一个 Vue 3 的 TodoList',
  'TypeScript 和 JavaScript 有什么区别？',
  '如何优化 React 应用的性能？',
]

function askExample(question: string) {
  store.sendMessage(question)
}

function handleRegenerate() {
  store.regenerateLastMessage()
}
</script>

<template>
  <div class="flex flex-col h-full bg-zinc-900">
    <!-- 顶栏 -->
    <header class="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80 backdrop-blur-sm">
      <div class="flex items-center gap-3">
        <!-- 移动端侧栏开关 -->
        <button
          class="lg:hidden p-1.5 rounded-lg hover:bg-zinc-800 transition-colors"
          @click="store.sidebarOpen = !store.sidebarOpen"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
            <path fill-rule="evenodd" d="M2 4.75A.75.75 0 0 1 2.75 4h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 4.75ZM2 10a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75A.75.75 0 0 1 2 10Zm0 5.25a.75.75 0 0 1 .75-.75h14.5a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1-.75-.75Z" clip-rule="evenodd" />
          </svg>
        </button>
        <h1 class="text-sm font-medium text-zinc-200">
          {{ store.activeSession?.title ?? 'AI Chat' }}
        </h1>
      </div>
      <button
        class="p-1.5 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400 hover:text-zinc-200"
        title="设置"
        @click="showSettings = true"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
          <path fill-rule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.98.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clip-rule="evenodd" />
        </svg>
      </button>
    </header>

    <!-- 消息区域 -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto px-4 py-6">
      <!-- 空状态 -->
      <div
        v-if="!store.activeSession || store.activeSession.messages.length === 0"
        class="flex flex-col items-center justify-center h-full text-center"
      >
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" class="w-8 h-8">
            <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 20.97v-3.17a56.08 56.08 0 0 1-1.087-.126C2.99 17.424 1.5 15.813 1.5 13.894V6.385c0-1.866 1.37-3.477 3.413-3.727ZM16.75 7.5h-1.5A4.25 4.25 0 0 0 11 11.75v4.5A4.25 4.25 0 0 0 15.25 20.5h1.5A4.25 4.25 0 0 0 21 16.25v-4.5A4.25 4.25 0 0 0 16.75 7.5Z" />
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-zinc-200 mb-2">你好！我是 AI 助手</h2>
        <p class="text-zinc-500 text-sm mb-8 max-w-sm">
          我可以帮你编写代码、回答问题、翻译文本等。试试下面的示例开始对话吧！
        </p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
          <button
            v-for="q in exampleQuestions"
            :key="q"
            class="text-left px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-sm text-zinc-300 transition-colors border border-zinc-700/50"
            @click="askExample(q)"
          >
            {{ q }}
          </button>
        </div>
      </div>

      <!-- 消息列表 -->
      <div v-else class="max-w-3xl mx-auto">
        <div
          v-for="msg in store.activeSession.messages"
          :key="msg.id"
          class="group"
        >
          <MessageBubble
            :message="msg"
            @regenerate="handleRegenerate"
          />
        </div>
      </div>
    </div>

    <!-- 输入区域 -->
    <InputArea />

    <!-- 设置弹窗 -->
    <SettingsModal v-if="showSettings" @close="showSettings = false" />
  </div>
</template>
