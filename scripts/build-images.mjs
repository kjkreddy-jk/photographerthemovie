import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const manifestOption = process.argv.find(argument => argument.startsWith('--manifest='));
const manifestPath = path.resolve(root, manifestOption ? manifestOption.slice('--manifest='.length) : 'content/image-sources.json');
const checkOnly = process.argv.includes('--check');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const outputDirectory = path.resolve(root, manifest.outputDirectory);
const formats = new Set(manifest.formats || []);

if (!Array.isArray(manifest.images) || !manifest.images.length) throw new Error('Image manifest needs at least one source.');
if (!Array.isArray(manifest.widths) || manifest.widths.some(width => !Number.isInteger(width) || width < 1)) throw new Error('Image widths must be positive integers.');
for (const format of formats) if (!['avif', 'webp', 'jpeg'].includes(format)) throw new Error(`Unsupported image format: ${format}`);

const missing = manifest.images.filter(image => !fs.existsSync(path.resolve(root, image.source)));
if (missing.length) throw new Error(`Approved image source files are missing: ${missing.map(image => image.source).join(', ')}`);

const { default: sharp } = await import('sharp');
const expected = [];
for (const image of manifest.images) {
  if (!/^[a-z0-9][a-z0-9-]*$/.test(image.id || '')) throw new Error(`Invalid image id: ${image.id || '(empty)'}`);
  if (!image.alt?.trim()) throw new Error(`Image ${image.id} needs editorial alt text.`);
  const sourcePath = path.resolve(root, image.source);
  const metadata = await sharp(sourcePath).metadata();
  if (!metadata.width || !metadata.height) throw new Error(`Image dimensions could not be read: ${image.source}`);
  for (const width of manifest.widths) {
    if (width > metadata.width) continue;
    for (const format of formats) {
      const extension = format === 'jpeg' ? 'jpg' : format;
      const outputPath = path.join(outputDirectory, `${image.id}-${width}.${extension}`);
      expected.push({ outputPath, width, format });
      if (checkOnly) continue;
      fs.mkdirSync(outputDirectory, { recursive: true });
      let pipeline = sharp(sourcePath).rotate().resize({ width, withoutEnlargement: true });
      if (format === 'avif') pipeline = pipeline.avif({ quality: 55, effort: 4 });
      if (format === 'webp') pipeline = pipeline.webp({ quality: 80, effort: 4 });
      if (format === 'jpeg') pipeline = pipeline.jpeg({ quality: 82, progressive: true, mozjpeg: true });
      await pipeline.toFile(outputPath);
    }
  }
}

if (checkOnly) {
  for (const item of expected) {
    if (!fs.existsSync(item.outputPath)) throw new Error(`Generated image is missing: ${path.relative(root, item.outputPath)}`);
    const metadata = await sharp(item.outputPath).metadata();
    const formatMatches = item.format === 'avif' ? metadata.mediaType === 'image/avif' : metadata.format === item.format;
    if (metadata.width !== item.width || !formatMatches) throw new Error(`Generated image metadata changed: ${path.relative(root, item.outputPath)}`);
  }
  console.log(`Responsive image pipeline verified ${expected.length} variants.`);
} else {
  console.log(`Generated ${expected.length} responsive image variants.`);
}
