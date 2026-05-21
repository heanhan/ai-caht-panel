<script setup lang="ts">
import { ref } from 'vue'
import { useChatStore } from '@/stores/chatStore'

const emit = defineEmits<{
  close: []
}>()

const store = useChatStore()

const temperature = ref(store.settings.temperature)

function handleSave() {
  store.settings.temperature = temperature.value
  emit('close')
}

function handleOverlayClick(e: MouseEvent) {
  if ((e.target as HTMLElement).classList.contains('modal-overlay')) {
    emit('close')
  }
}
</script>

<template>
  <div
    class="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    @click="handleOverlayClick"
  >
    <div class="bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
      <div class="flex items-center justify-between mb-6">
        <h2 class="text-lg font-semibold text-zinc-100">设置</h2>
        <button
          class="p-1 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400"
          @click="emit('close')"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
            <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
          </svg>
        </button>
      </div>

      <div class="space-y-5">
        <!-- Temperature -->
        <div>
          <label class="block text-sm text-zinc-400 mb-1.5">
            Temperature: <span class="text-zinc-200">{{ temperature.toFixed(1) }}</span>
          </label>
          <input
            v-model.number="temperature"
            type="range"
            min="0"
            max="2"
            step="0.1"
            class="w-full accent-blue-500"
          />
          <div class="flex justify-between text-xs text-zinc-600 mt-1">
            <span>精确 (0)</span>
            <span>创造 (2)</span>
          </div>
        </div>
      </div>

      <div class="flex justify-end gap-3 mt-8">
        <button
          class="px-4 py-2 text-sm text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
          @click="emit('close')"
        >
          取消
        </button>
        <button
          class="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
          @click="handleSave"
        >
          保存
        </button>
      </div>
    </div>
  </div>
</template>
