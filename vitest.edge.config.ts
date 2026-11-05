import './tests/loadIntegrationEnv'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/edge-function.integration.test.ts'],
    testTimeout: 30_000,
    hookTimeout: 30_000,
  },
})
