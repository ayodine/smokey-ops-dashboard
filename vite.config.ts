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
                const urlObj = new URL(req.url, 'http://localhost')
                const query = urlObj.searchParams.get('q')?.trim()
                const sb = createClient(supabaseUrl, serviceKey || env.VITE_SUPABASE_ANON_KEY)
                
                let queryBuilder = sb
                  .from('orders')
                  .select('*, order_items(*)')
                  .is('deleted_at', null)
                  .neq('status', 'pending_payment')
                  .order('created_at', { ascending: false })

                if (query) {
                  // Search historical records across all fields without limit restriction
                  queryBuilder = queryBuilder
                    .or(`customer_name.ilike.%${query}%,customer_phone.ilike.%${query}%,delivery_address.ilike.%${query}%,id.ilike.%${query}%,notes.ilike.%${query}%`)
                    .limit(50)
                } else {
                  queryBuilder = queryBuilder.limit(200)
                }

                const { data, error } = await queryBuilder

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

            if (req.url?.startsWith('/api/products')) {
              try {
                const sb = createClient(supabaseUrl, serviceKey || env.VITE_SUPABASE_ANON_KEY)
                const { data, error } = await sb
                  .from('products')
                  .select('*')
                  .is('deleted_at', null)
                  .order('name', { ascending: true })

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

