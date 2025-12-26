import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';

const isDev = process.env.NODE_ENV === 'development';

const actionSaverPlugin: Plugin = {
  name: 'action-saver',
  configureServer(server) {
    // Helper function to read request body
    const readBody = (req: any): Promise<string> => {
      return new Promise((resolve) => {
        let body = '';
        req.on('data', (chunk: any) => { body += chunk; });
        req.on('end', () => resolve(body));
      });
    };

    // API: Save action files
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url !== '/api/save-action') return next();
      
      if (req.method === 'POST') {
        try {
          const body = await readBody(req);
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
      } else {
        res.statusCode = 405;
        res.end('Method Not Allowed');
      }
    });

    // API: Save beat file
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url !== '/api/save-beat') return next();
      
      if (req.method === 'POST') {
        try {
          const body = await readBody(req);
          const data = JSON.parse(body);
          const { actionName, beatPattern } = data;
          
          const actionDir = path.resolve(__dirname, 'actions', actionName);
          const beatFilePath = path.join(actionDir, 'beat.tsx');

          if (!fs.existsSync(actionDir)) {
            throw new Error(`Action directory not found: ${actionDir}`);
          }

          // Generate beat code using our generator
          const { generateActionBeatCode } = await import('./actions/base/beatCodeGenerator');
          const beatCode = generateActionBeatCode(actionName, beatPattern);

          // Save beat file
          fs.writeFileSync(beatFilePath, beatCode, 'utf-8');

          // Update Action file to use beat import
          const actionFilePath = path.join(actionDir, `${actionName.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join('')}Action.tsx`);
          
          if (fs.existsSync(actionFilePath)) {
            const { updateActionFileToUseBeat } = await import('./actions/base/actionFileUpdater');
            const actionFileContent = fs.readFileSync(actionFilePath, 'utf-8');
            const updatedContent = updateActionFileToUseBeat(actionFileContent, actionName);
            fs.writeFileSync(actionFilePath, updatedContent, 'utf-8');
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            success: true, 
            path: beatFilePath,
            actionFileUpdated: fs.existsSync(actionFilePath)
          }));
        } catch (err: any) {
          console.error('Save beat error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      } else {
        res.statusCode = 405;
        res.end('Method Not Allowed');
      }
    });

    // API: Save guide file
    server.middlewares.use(async (req: any, res: any, next: any) => {
      if (req.url !== '/api/save-guide') return next();
      
      if (req.method === 'POST') {
        try {
          const body = await readBody(req);
          const data = JSON.parse(body);
          const { actionName, guideData } = data;
          
          const actionDir = path.resolve(__dirname, 'actions', actionName);
          const guideFilePath = path.join(actionDir, 'guide.ts');

          if (!fs.existsSync(actionDir)) {
            throw new Error(`Action directory not found: ${actionDir}`);
          }

          // Generate guide code
          const guideCode = `
import type { GuideData } from '../base/types';

const guide: GuideData = {
  totalBeats: ${guideData.totalBeats},
  framesPerBeat: ${guideData.framesPerBeat},
  frames: ${JSON.stringify(guideData.frames)},
  bpm: ${guideData.bpm},
  markedFrameIndices: ${JSON.stringify(guideData.markedFrameIndices)}
};

export default guide;
export { guide };
`;

          // Save guide file
          fs.writeFileSync(guideFilePath, guideCode, 'utf-8');

          // Update beat.tsx to include totalBeats and beatFrameMapping
          const beatFilePath = path.join(actionDir, 'beat.tsx');
          if (fs.existsSync(beatFilePath)) {
            const beatContent = fs.readFileSync(beatFilePath, 'utf-8');
            const updatedBeatContent = beatContent.replace(
              /(const beat: BeatPattern = \{[^}]*)(\})/,
              `$1,\n  totalBeats: ${guideData.totalBeats},\n  beatFrameMapping: ${JSON.stringify(guideData.markedFrameIndices)}\n$2`
            );
            fs.writeFileSync(beatFilePath, updatedBeatContent, 'utf-8');
          }

          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ 
            success: true, 
            path: guideFilePath,
            beatFileUpdated: fs.existsSync(beatFilePath)
          }));
        } catch (err: any) {
          console.error('Save guide error:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ success: false, error: err.message }));
        }
      } else {
        res.statusCode = 405;
        res.end('Method Not Allowed');
      }
    });
  }
};

const plugins: any[] = [
  react(),
  VitePWA({
    registerType: 'autoUpdate',
    injectRegister: 'auto',
    includeAssets: ['icon-192.png', 'icon-512.png', 'apple-touch-icon.png', 'maskable-icon-512.png'],
    manifest: {
      name: 'NeuroFit Pulsar',
      short_name: 'NeuroFit',
      description: 'AI-Powered Pulsating Fitness Experience',
      theme_color: '#0f172a',
      background_color: '#0f172a',
      display: 'standalone',
      icons: [
        {
          src: 'icon-192.png',
          sizes: '192x192',
          type: 'image/png'
        },
        {
          src: 'icon-512.png',
          sizes: '512x512',
          type: 'image/png'
        },
        {
          src: 'maskable-icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'maskable'
        }
      ]
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/storage\.googleapis\.com\/mediapipe-models\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'mediapipe-models',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        {
          urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/@mediapipe\/tasks-vision\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'mediapipe-assets',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 365,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        }
      ]
    }
  })
];

if (isDev) {
  plugins.push(actionSaverPlugin);
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins,
  base: './',
  define: {
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
