import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl = env.VITE_SUPABASE_URL || env.SUPABASE_URL || 'https://itpnfalqjjicesqcjzix.supabase.co'
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY || ''

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'supabase-api-dev-middleware',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            if (req.url?.startsWith('/api/live-orders')) {
              try {
                const sb = createClient(supabaseUrl, serviceKey || env.VITE_SUPABASE_ANON_KEY)
                const { data, error } = await sb
                  .from('orders')
                  .select('*, order_items(*)')
                  .is('deleted_at', null)
                  .neq('status', 'pending_payment')
                  .order('created_at', { ascending: false })
                  .limit(200)

                if (error) {
                  res.statusCode = 500
                  res.setHeader('Content-Type', 'application/json')
                  res.end(JSON.stringify({ error: error.message }))
                  return
                }

                res.statusCode = 200
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ data }))
              } catch (err: any) {
                res.statusCode = 500
                res.setHeader('Content-Type', 'application/json')
                res.end(JSON.stringify({ error: err?.message || 'Server error' }))
              }
              return
            }
            next()
          })
        }
      }
    ],
    resolve: {
      alias: {
        '@/components/ui/button': path.resolve(import.meta.dirname, './src/components/ui/Button.tsx'),
        '@': path.resolve(import.meta.dirname, './src'),
      },
    },
  }
})

