import { env } from 'node:process'
import { loadEnv } from 'vite'

const fileEnv = loadEnv('test', process.cwd(), '')

for (const name of ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY']) {
  if (!env[name] && fileEnv[name]) env[name] = fileEnv[name]
}
