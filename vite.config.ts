import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { readdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'strip-ort-wasm',
      closeBundle() {
        // onnxruntime-web fetches its ~24MB wasm from jsDelivr at runtime
        // (ort.env.wasm.wasmPaths in src/core/yolox.ts), so the copy Vite
        // emits into dist is never downloaded — drop it from the deploy.
        const assetsDir = join(process.cwd(), 'dist', 'assets')
        for (const file of readdirSync(assetsDir)) {
          if (/^ort-wasm.*\.wasm$/.test(file)) {
            rmSync(join(assetsDir, file))
          }
        }
      },
    },
  ],
  // Root base works for custom domain (ketsuin.clothpath.com) and Vercel.
  // GitHub Pages project URL redirects to the custom domain via CNAME.
  base: '/',
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    }
  }
})
