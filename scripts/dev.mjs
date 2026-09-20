import { createServer } from 'vite';
import * as esbuild from 'esbuild';
import { spawn } from 'child_process';
import electron from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function start() {
  // 1. Start Vite Dev Server
  const server = await createServer({
    configFile: path.resolve(rootDir, 'vite.config.ts'),
  });
  await server.listen();
  console.log(`[Dev] Vite dev server listening at http://localhost:5173`);

  // 2. Build Main & Preload scripts
  const buildContext = await esbuild.context({
    entryPoints: {
      main: path.resolve(rootDir, 'src/main/index.ts'),
      preload: path.resolve(rootDir, 'src/preload/index.ts'),
    },
    bundle: true,
    platform: 'node',
    target: 'node20',
    outdir: path.resolve(rootDir, 'dist-electron'),
    external: ['electron', '@ghostery/adblocker-electron', 'cross-fetch'],
    sourcemap: 'inline',
  });

  await buildContext.rebuild();
  console.log('[Dev] Built main and preload scripts.');

  // 3. Launch Electron
  let electronProcess = null;

  const launchElectron = () => {
    if (electronProcess) {
      electronProcess.kill();
    }

    electronProcess = spawn(electron, ['.'], {
      cwd: rootDir,
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
      },
    });

    electronProcess.on('close', () => {
      server.close();
      process.exit();
    });
  };

  launchElectron();
}

start().catch((err) => {
  console.error('[Dev] Failed to start:', err);
  process.exit(1);
});
