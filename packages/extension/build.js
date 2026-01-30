import * as esbuild from 'esbuild';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const watch = process.argv.includes('--watch');
const distDir = path.join(__dirname, 'dist');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy manifest
fs.copyFileSync(
  path.join(__dirname, 'manifest.json'),
  path.join(distDir, 'manifest.json')
);

// Create icons directory and placeholder icons
const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Create simple SVG placeholder icons
const createIcon = (size) => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#6366f1"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.5}" fill="white" text-anchor="middle" dominant-baseline="middle">V</text>
</svg>`;
  return svg;
};

[16, 48, 128].forEach(size => {
  const iconPath = path.join(iconsDir, `icon-${size}.png`);
  // For simplicity, we'll create SVG icons and rename to PNG
  // In production, you'd use a proper PNG generator
  fs.writeFileSync(iconPath.replace('.png', '.svg'), createIcon(size));
});

console.log('📦 Building extension...');

const buildOptions = {
  bundle: true,
  format: 'esm',
  platform: 'browser',
  target: 'es2022',
  sourcemap: true,
  logLevel: 'info',
};

if (watch) {
  // Watch mode using context
  const ctxBackground = await esbuild.context({
    ...buildOptions,
    entryPoints: ['src/background/index.ts'],
    outfile: 'dist/background.js',
  });

  const ctxContent = await esbuild.context({
    ...buildOptions,
    entryPoints: ['src/content/index.ts'],
    outfile: 'dist/content.js',
  });

  const ctxInject = await esbuild.context({
    ...buildOptions,
    entryPoints: ['src/inject/index.ts'],
    outfile: 'dist/inject.js',
  });

  await Promise.all([
    ctxBackground.watch(),
    ctxContent.watch(),
    ctxInject.watch(),
  ]);

  console.log('✅ Extension built successfully!');
  console.log('👀 Watching for changes...');
} else {
  // Production build
  await Promise.all([
    esbuild.build({
      ...buildOptions,
      entryPoints: ['src/background/index.ts'],
      outfile: 'dist/background.js',
    }),
    esbuild.build({
      ...buildOptions,
      entryPoints: ['src/content/index.ts'],
      outfile: 'dist/content.js',
    }),
    esbuild.build({
      ...buildOptions,
      entryPoints: ['src/inject/index.ts'],
      outfile: 'dist/inject.js',
    }),
  ]);

  console.log('✅ Extension built successfully!');
}

console.log('✅ Extension built successfully!');

if (watch) {
  console.log('👀 Watching for changes...');
}
