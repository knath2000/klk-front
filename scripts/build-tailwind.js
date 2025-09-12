const fs = require('fs');
const path = require('path');
const postcss = require('postcss');
const tailwindPostcss = require('@tailwindcss/postcss');
const autoprefixer = require('autoprefixer');

async function build() {
  const root = process.cwd();
  const inputPath = path.join(root, 'src', 'app', 'globals.css');
  const outDir = path.join(root, 'public');
  const outPath = path.join(outDir, 'tailwind.css');

  if (!fs.existsSync(inputPath)) {
    console.error('Input CSS not found:', inputPath);
    process.exit(1);
  }

  const inputCss = fs.readFileSync(inputPath, 'utf8');

  try {
    const result = await postcss([
      tailwindPostcss(path.join(root, 'tailwind.config.js')),
      autoprefixer()
    ]).process(inputCss, { from: inputPath });

    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
    fs.writeFileSync(outPath, result.css, 'utf8');
    console.log('Wrote', outPath);
  } catch (err) {
    console.error('Error building Tailwind CSS:', err);
    process.exit(1);
  }
}

build();