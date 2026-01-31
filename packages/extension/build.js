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

// Copy popup HTML
const uiDistPath = path.join(__dirname, '../ui/dist/index.html');
if (fs.existsSync(uiDistPath)) {
  fs.copyFileSync(uiDistPath, path.join(distDir, 'popup.html'));
}

// Create icons directory and copy custom icons if available
const iconsDir = path.join(distDir, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Copy custom icons from public if they exist
const publicIconsDir = path.join(__dirname, 'public/icons');
if (fs.existsSync(publicIconsDir)) {
  const iconFiles = fs.readdirSync(publicIconsDir);
  iconFiles.forEach(file => {
    fs.copyFileSync(
      path.join(publicIconsDir, file),
      path.join(iconsDir, file)
    );
  });
  console.log('✅ Copied custom icons from public/icons');
}

// Create simple SVG placeholder icons (fallback)
const createIcon = (size) => {
  const svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" fill="#6366f1"/>
  <text x="50%" y="50%" font-family="Arial" font-size="${size * 0.5}" fill="white" text-anchor="middle" dominant-baseline="middle">V</text>
</svg>`;
  return svg;
};

// Create simple placeholder PNG files (1x1 pixel data URLs converted to buffer)
const createPlaceholderPNG = () => {
  // Minimal valid PNG file (1x1 transparent pixel)
  return Buffer.from([
    0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1F, 0x15, 0xC4, 0x89, 0x00, 0x00, 0x00,
    0x0A, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0D, 0x0A, 0x2D, 0xB4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82
  ]);
};

[16, 48, 128].forEach(size => {
  const iconPath = path.join(iconsDir, `icon-${size}.png`);
  fs.writeFileSync(iconPath, createPlaceholderPNG());
});

console.log('📦 Building extension...');

const buildOptions = {
  bundle: true,
  format: 'iife',
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
