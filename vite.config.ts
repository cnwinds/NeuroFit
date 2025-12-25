import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'action-saver',
      configureServer(server) {
        server.middlewares.use('/api/save-action', async (req, res) => {
          if (req.method === 'POST') {
            let body = '';
            req.on('data', chunk => { body += chunk; });
            req.on('end', async () => {
              try {
                const data = JSON.parse(body);
                const { englishName, files } = data;
                const actionDir = path.resolve(__dirname, 'actions', englishName.toLowerCase());

                if (!fs.existsSync(actionDir)) {
                  fs.mkdirSync(actionDir, { recursive: true });
                }

                for (const [filename, content] of Object.entries(files)) {
                  fs.writeFileSync(path.join(actionDir, filename), content as string);
                }

                res.statusCode = 200;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: true, path: actionDir }));
              } catch (err: any) {
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ success: false, error: err.message }));
              }
            });
          } else {
            res.statusCode = 405;
            res.end('Method Not Allowed');
          }
        });
      }
    }
  ],
  base: './', // Ensures assets are loaded correctly on GitHub Pages sub-paths
  define: {
    // This allows process.env.API_KEY to be used in the source code
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY || '')
  },
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
});