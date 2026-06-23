import { defineWorkspace } from 'vitest/config'
import { fileURLToPath } from 'node:url'

const alias = { '@': fileURLToPath(new URL('.', import.meta.url)) }

/**
 * Two test projects:
 *  - `node`   — pure logic + API route handlers (no DOM). Fast, default `npm test`.
 *  - `jsdom`  — React component tests needing a DOM + jest-dom matchers.
 * Run one with `vitest --project node` / `--project jsdom`, or both with `vitest`.
 */
export default defineWorkspace([
  {
    resolve: { alias },
    test: {
      name: 'node',
      environment: 'node',
      include: ['tests/unit/**/*.test.ts', 'tests/unit/**/*.test.tsx'],
    },
  },
  {
    // esbuild's automatic JSX runtime — no `import React` needed in test files.
    esbuild: { jsx: 'automatic' },
    resolve: { alias },
    test: {
      name: 'jsdom',
      environment: 'jsdom',
      include: ['tests/component/**/*.test.tsx'],
      setupFiles: ['tests/setup/jsdom.ts'],
    },
  },
])
