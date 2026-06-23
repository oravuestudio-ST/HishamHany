import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

// Project definitions live in vitest.workspace.ts (node + jsdom). This root
// config only carries shared settings (path alias). Run `vitest --project node`
// or `--project jsdom`, or `vitest` for both.
export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
    },
  },
})
