<script setup lang="ts">
import { useChatStore } from '@/stores/chatStore'
import ChatHistory from './components/ChatHistory.vue'
import ChatInterface from './components/ChatInterface.vue'

const store = useChatStore()
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-zinc-900 text-zinc-100">
    <!-- 侧栏遮罩（移动端） -->
    <div
      v-if="store.sidebarOpen"
      class="fixed inset-0 z-30 bg-black/50 lg:hidden"
      @click="store.sidebarOpen = false"
    />

    <!-- 左侧栏 -->
    <aside
      class="fixed z-40 lg:static inset-y-0 left-0 w-72 transform transition-transform duration-200 ease-in-out lg:translate-x-0 border-r border-zinc-800"
      :class="store.sidebarOpen ? 'translate-x-0' : '-translate-x-full'"
    >
      <ChatHistory />
    </aside>

    <!-- 右侧主内容 -->
    <main class="flex-1 min-w-0">
      <ChatInterface />
    </main>
  </div>
</template>
