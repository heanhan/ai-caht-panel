<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/chatStore'

const store = useChatStore()

const editingId = ref<string | null>(null)
const editTitle = ref('')

function startRename(id: string, currentTitle: string) {
  editingId.value = id
  editTitle.value = currentTitle
}

function confirmRename(id: string) {
  const title = editTitle.value.trim()
  if (title) {
    store.renameSession(id, title)
  }
  editingId.value = null
}

function cancelRename() {
  editingId.value = null
}
</script>

<template>
  <div class="flex flex-col h-full bg-zinc-950 text-zinc-300">
    <!-- 头部 -->
    <div class="p-4 border-b border-zinc-800">
      <button
        class="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-xl transition-colors"
        @click="store.createSession()"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4">
          <path d="M10.75 4.75a.75.75 0 0 0-1.5 0v4.5h-4.5a.75.75 0 0 0 0 1.5h4.5v4.5a.75.75 0 0 0 1.5 0v-4.5h4.5a.75.75 0 0 0 0-1.5h-4.5v-4.5Z" />
        </svg>
        新建对话
      </button>
    </div>

    <!-- 对话列表 -->
    <div class="flex-1 overflow-y-auto p-2 space-y-1">
      <div
        v-for="session in store.sortedSessions"
        :key="session.id"
        class="group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors text-sm"
        :class="session.id === store.activeSessionId
          ? 'bg-zinc-800 text-white'
          : 'hover:bg-zinc-800/50 text-zinc-400'"
        @click="store.setActiveSession(session.id)"
      >
        <!-- 对话图标 -->
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 shrink-0 opacity-60">
          <path fill-rule="evenodd" d="M3.43 2.524A41.29 41.29 0 0 1 10 2c2.236 0 4.43.18 6.57.524 1.437.231 2.43 1.49 2.43 2.902v5.148c0 1.413-.993 2.67-2.43 2.902a41.202 41.202 0 0 1-5.183.501.78.78 0 0 0-.528.224l-3.579 3.58A.75.75 0 0 1 6 17.25v-3.443a41.033 41.033 0 0 1-2.57-.33C1.993 13.244 1 11.986 1 10.574V5.426c0-1.413.993-2.67 2.43-2.902Z" clip-rule="evenodd" />
        </svg>

        <!-- 标题 / 编辑 -->
        <template v-if="editingId === session.id">
          <input
            v-model="editTitle"
            class="flex-1 bg-zinc-700 text-white text-sm px-2 py-0.5 rounded outline-none"
            @keydown.enter="confirmRename(session.id)"
            @keydown.escape="cancelRename"
            @blur="confirmRename(session.id)"
            @click.stop
          />
        </template>
        <template v-else>
          <span class="flex-1 truncate">{{ session.title }}</span>
        </template>

        <!-- 操作按钮 -->
        <div
          v-if="editingId !== session.id"
          class="hidden group-hover:flex items-center gap-0.5"
        >
          <button
            class="p-1 rounded hover:bg-zinc-700 transition-colors"
            title="重命名"
            @click.stop="startRename(session.id, session.title)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3.5 h-3.5">
              <path d="M13.488 2.513a1.75 1.75 0 0 0-2.475 0L3.22 10.306a1 1 0 0 0-.258.41l-.97 2.88a.498.498 0 0 0 .61.61l2.88-.97a1 1 0 0 0 .41-.258l7.793-7.793a1.75 1.75 0 0 0 0-2.475l-.197-.197Z" />
            </svg>
          </button>
          <button
            class="p-1 rounded hover:bg-red-900/50 hover:text-red-400 transition-colors"
            title="删除"
            @click.stop="store.deleteSession(session.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" class="w-3.5 h-3.5">
              <path fill-rule="evenodd" d="M5 3.25V4H2.75a.75.75 0 0 0 0 1.5h.3l.815 8.15A1.5 1.5 0 0 0 5.357 15h5.285a1.5 1.5 0 0 0 1.493-1.35l.815-8.15h.3a.75.75 0 0 0 0-1.5H11v-.75A2.25 2.25 0 0 0 8.75 1h-1.5A2.25 2.25 0 0 0 5 3.25Zm2.25-.75a.75.75 0 0 0-.75.75V4h3v-.75a.75.75 0 0 0-.75-.75h-1.5ZM6.05 6a.75.75 0 0 1 .787.713l.275 5.5a.75.75 0 0 1-1.498.075l-.275-5.5A.75.75 0 0 1 6.05 6Zm3.9 0a.75.75 0 0 1 .712.787l-.275 5.5a.75.75 0 0 1-1.498-.075l.275-5.5A.75.75 0 0 1 9.95 6Z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="store.sessions.length === 0"
        class="text-center text-zinc-600 text-xs mt-8"
      >
        暂无对话记录
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="p-3 border-t border-zinc-800 text-xs text-zinc-600 text-center">
      AI Chat Panel
    </div>
  </div>
</template>
