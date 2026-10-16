import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { viteSingleFile } from 'vite-plugin-singlefile';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url)));

// mode "preview" gom tất cả vào 1 file HTML để mở thử trên trình duyệt
export default defineConfig(({ mode }) => ({
  base: './',
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  plugins: mode === 'preview' ? [viteSingleFile()] : [],
  build: {
    outDir: mode === 'preview' ? 'dist-preview' : 'dist',
    emptyOutDir: true,
    target: 'es2020',
    chunkSizeWarningLimit: 2000,
    // icon 3D để thành file riêng (bản preview thì plugin singlefile tự nhúng vào HTML)
    ...(mode === 'preview' ? {} : { assetsInlineLimit: 0 }),
  },
}));
