import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/constants.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
}); 