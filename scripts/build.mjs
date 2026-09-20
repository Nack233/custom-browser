import * as esbuild from 'esbuild';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

async function build() {
  console.log('[Build] Compiling Electron main and preload scripts...');
  await esbuild.build({
    entryPoints: {
      main: path.resolve(rootDir, 'src/main/index.ts'),
      preload: path.resolve(rootDir, 'src/preload/index.ts'),
    },
    bundle: true,
    platform: 'node',
    target: 'node20',
    outdir: path.resolve(rootDir, 'dist-electron'),
    external: ['electron', '@ghostery/adblocker-electron', 'cross-fetch'],
    minify: true,
  });
  console.log('[Build] Successfully compiled Electron main and preload scripts.');
}

build().catch((err) => {
  console.error('[Build] Compilation failed:', err);
  process.exit(1);
});
