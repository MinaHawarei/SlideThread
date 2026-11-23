#!/usr/bin/env node
import { createServer } from 'vite';
import { chromium } from '@playwright/test';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import sharp from 'sharp';
import { JSDOM } from 'jsdom';
import { readdir, readFile, stat, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const startersDir = path.join(root, 'src/templates/starters');
const schemaPath = path.join(root, 'src/templates/template.schema.json');
const categoriesPath = path.join(root, 'src/templates/registry/categories.json');
const indexPath = path.join(root, 'src/templates/registry/index.json');
const dimensions = { landscape: [1920, 1080], square: [1080, 1080], portrait: [1080, 1350], tall: [1080, 1920] };

function parseArgs(args) {
  const positional = [];
  const flags = new Set();
  for (const arg of args) arg.startsWith('--') ? flags.add(arg) : positional.push(arg);
  return { positional, flags };
}

async function templateFolders() {
  return (await readdir(startersDir, { withFileTypes: true }))
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(startersDir, entry.name))
    .sort();
}

async function loadJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

function ajvFor(schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(schema);
}

function contrastFailures(palette, contrast) {
  return [
    ['ink/bg', palette.ink, palette.bg, 7],
    ['mute/bg', palette.mute, palette.bg, 4.5],
    ['accent/bg', palette.acc, palette.bg, 3],
    ['onAcc/accent', palette.onAcc, palette.acc, 4.5],
  ].flatMap(([label, foreground, background, minimum]) => {
    const ratio = contrast(foreground, background);
    return ratio >= minimum ? [] : [`${label} ${ratio.toFixed(2)}:1 < ${minimum}:1`];
  });
}

async function validateAll({ requirePreviews = true } = {}) {
  const schema = await loadJson(schemaPath);
  const categories = await loadJson(categoriesPath);
  const categoryIds = categories.map(({ id }) => id);
  const schemaCategories = schema.properties.categories.items.enum;
  if (JSON.stringify(categoryIds) !== JSON.stringify(schemaCategories)) {
    throw new Error('template.schema.json category enum must match registry/categories.json in order');
  }
  const validateJsonSchema = ajvFor(schema);
  const folders = await templateFolders();
  const manifests = [];
  const jsdom = new JSDOM('<!doctype html><html><body></body></html>');
  Object.assign(globalThis, {
    window: jsdom.window,
    document: jsdom.window.document,
    DOMParser: jsdom.window.DOMParser,
    XMLSerializer: jsdom.window.XMLSerializer,
  });
  const vite = await createServer({
    configFile: path.join(root, 'vite.config.ts'),
    logLevel: 'error',
    server: { middlewareMode: true },
    appType: 'custom',
  });
  try {
    const { TemplateSchema, resolveTemplatePalette } = await vite.ssrLoadModule('/src/templates/schema.ts');
    const { getContrastRatio } = await vite.ssrLoadModule('/src/core/palette.ts');
    const { sanitizeSvg, sanitizeTemplateCss } = await vite.ssrLoadModule('/src/templates/security/sanitizers.ts');
    for (const folder of folders) {
      const manifestPath = path.join(folder, 'template.json');
      const manifest = await loadJson(manifestPath);
      if (!validateJsonSchema(manifest)) {
        throw new Error(`${path.relative(root, manifestPath)} JSON Schema: ${validateJsonSchema.errors?.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ')}`);
      }
      const parsed = TemplateSchema.parse(manifest);
      if (path.basename(folder) !== parsed.id) throw new Error(`${path.relative(root, manifestPath)} folder must match manifest id "${parsed.id}"`);
      if (!parsed.license.trim()) throw new Error(`${parsed.id}: license is required`);
      for (const mode of ['light', 'dark']) {
        let palette;
        try {
          palette = resolveTemplatePalette(parsed, mode, mode === 'dark' ? '#35D0E6' : '#0B7FA6');
        } catch (error) {
          if (!parsed.colorFlexible && !parsed.theme.modes[mode]) continue;
          throw error;
        }
        const failures = contrastFailures(palette, getContrastRatio);
        if (failures.length) throw new Error(`${parsed.id} ${mode} palette contrast: ${failures.join(', ')}`);
      }
      if (parsed.customCss) sanitizeTemplateCss(parsed.customCss, parsed.id);
      const assetsDir = path.join(folder, 'assets');
      let assetBytes = 0;
      try {
        const walk = async (directory) => {
          for (const entry of await readdir(directory, { withFileTypes: true })) {
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) await walk(file);
            else {
              const extension = path.extname(entry.name).toLowerCase();
              if (!['.svg', '.webp', '.png'].includes(extension)) throw new Error(`${parsed.id}: unsupported asset format ${path.relative(folder, file)}`);
              const info = await stat(file);
              assetBytes += info.size;
              if (extension === '.svg') sanitizeSvg(await readFile(file, 'utf8'));
            }
          }
        };
        await walk(assetsDir);
      } catch (error) {
        if (error?.code !== 'ENOENT') throw error;
      }
      if (assetBytes > 300 * 1024) throw new Error(`${parsed.id}: assets are ${assetBytes} bytes; limit is 307200`);
      const previewPath = path.join(folder, 'preview.webp');
      const previewInfo = await stat(previewPath).catch(() => undefined);
      if (requirePreviews && !previewInfo) throw new Error(`${parsed.id}: preview.webp is required`);
      if (requirePreviews && previewInfo && previewInfo.size > 40 * 1024) throw new Error(`${parsed.id}: preview.webp is ${previewInfo.size} bytes; limit is 40960`);
      manifests.push(parsed);
    }
    for (const manifest of manifests) {
      if (manifest.extends && !manifests.some((candidate) => candidate.id === manifest.extends)) {
        throw new Error(`${manifest.id}: unknown parent template ${manifest.extends}`);
      }
    }
    for (const manifest of manifests) {
      const current = new Map(manifests.map((item) => [item.id, item]));
      let next = manifest;
      const visited = new Set([manifest.id]);
      while (next.extends) {
        if (visited.has(next.extends)) throw new Error(`${manifest.id}: template inheritance cycle at ${next.extends}`);
        visited.add(next.extends);
        next = current.get(next.extends);
      }
    }
    console.log(`Validated ${manifests.length} templates (JSON Schema, runtime schema, security, contrast, assets, licenses, previews).`);
    return manifests;
  } finally {
    await vite.close();
    jsdom.window.close();
  }
}

function renderUrl(baseUrl, params) {
  const url = new URL('/template-dev', baseUrl);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
  return url.toString();
}

async function withBrowserServer(run) {
  const vite = await createServer({
    configFile: path.join(root, 'vite.config.ts'),
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false },
  });
  await vite.listen();
  const address = vite.httpServer?.address();
  if (!address || typeof address === 'string') throw new Error('Could not determine Vite server address');
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const browser = await chromium.launch({ headless: true });
  try {
    await run(browser, baseUrl);
  } finally {
    await browser.close();
    await vite.close();
  }
}

async function renderStressMatrix(manifests) {
  const failures = [];
  await withBrowserServer(async (browser, baseUrl) => {
    const page = await browser.newPage({ viewport: { width: 1500, height: 1200 } });
    page.on('pageerror', (error) => failures.push(error.message));
    for (const manifest of manifests) {
      for (const aspect of Object.keys(dimensions)) {
        for (const theme of ['light', 'dark']) {
          for (const locale of ['en', 'ar']) {
            const url = renderUrl(baseUrl, { id: manifest.id, aspect, theme, locale, stress: 1 });
            await page.goto(url, { waitUntil: 'networkidle' });
            const slide = page.getByTestId('template-dev-slide');
            await slide.waitFor({ state: 'visible' });
            const ready = await slide.getAttribute('data-preview-ready');
            const box = await slide.boundingBox();
            if (ready !== 'true' || !box || box.width < 300 || box.height < 200) {
              failures.push(`${manifest.id}/${aspect}/${theme}/${locale}: slide did not render`);
              continue;
            }
            const title = slide.locator('.slide-title-h1');
            const titleText = (await title.textContent())?.trim() ?? '';
            const titleBox = await title.boundingBox();
            const direction = await slide.locator('.cover-title-group').getAttribute('dir');
            const hasExpectedScript = locale === 'ar' ? /[\u0600-\u06ff]/u.test(titleText) : /[A-Za-z]/u.test(titleText);
            if (!titleText || !titleBox || titleBox.y < box.y || titleBox.y + titleBox.height > box.y + box.height + 1 || !hasExpectedScript || direction !== (locale === 'ar' ? 'rtl' : 'ltr')) {
              failures.push(`${manifest.id}/${aspect}/${theme}/${locale}: title text, direction, or fit failed`);
            }
          }
        }
      }
    }
    await page.close();
  });
  if (failures.length) throw new Error(`Stress render failures:\n${failures.join('\n')}`);
  console.log(`Stress rendered ${manifests.length * 4 * 2 * 2} template/theme/language/aspect combinations.`);
}

async function previewAll(manifests, check) {
  const mismatches = [];
  await withBrowserServer(async (browser, baseUrl) => {
    const page = await browser.newPage({ viewport: { width: 920, height: 1140 }, deviceScaleFactor: 1 });
    for (const manifest of manifests) {
      const locale = manifest.id === 'heritage-geometric' ? 'ar' : 'en';
      await page.goto(renderUrl(baseUrl, { id: manifest.id, aspect: 'portrait', theme: 'dark', locale }), { waitUntil: 'networkidle' });
      const image = await page.getByTestId('template-dev-slide').screenshot({ animations: 'disabled' });
      const screenshotSize = await sharp(image).metadata();
      if (screenshotSize.width !== 864 || Math.abs((screenshotSize.height ?? 0) - 1080) > 1) throw new Error(`${manifest.id}: preview renderer produced ${screenshotSize.width}×${screenshotSize.height}; expected 864×1080`);
      let webp;
      for (const quality of [80, 74, 68, 62, 56, 50, 44, 38, 32]) {
        webp = await sharp(image).resize(864, 1080, { fit: 'fill' }).webp({ quality, effort: 6 }).toBuffer();
        if (webp.byteLength <= 40 * 1024) break;
      }
      if (!webp || webp.byteLength > 40 * 1024) throw new Error(`${manifest.id}: could not encode preview under 40960 bytes`);
      const previewPath = path.join(startersDir, manifest.id, 'preview.webp');
      if (!check) {
        await writeFile(previewPath, webp);
        console.log(`${manifest.id}: wrote ${webp.byteLength} byte preview`);
        continue;
      }
      const oldBuffer = await readFile(previewPath);
      const expected = await sharp(oldBuffer).resize(864, 1080, { fit: 'fill' }).removeAlpha().raw().toBuffer();
      const actual = await sharp(webp).removeAlpha().raw().toBuffer();
      if (expected.length !== actual.length) {
        mismatches.push(`${manifest.id}: preview dimensions differ`);
        continue;
      }
      let difference = 0;
      for (let index = 0; index < expected.length; index += 1) difference += Math.abs(expected[index] - actual[index]);
      const meanDifference = difference / expected.length;
      if (meanDifference > 12) mismatches.push(`${manifest.id}: preview mean pixel difference ${meanDifference.toFixed(2)} exceeds tolerant limit 12`);
      else console.log(`${manifest.id}: preview current (mean pixel difference ${meanDifference.toFixed(2)})`);
    }
    await page.close();
  });
  if (mismatches.length) throw new Error(`Preview drift:\n${mismatches.join('\n')}\nRun npm run template:preview to update previews.`);
}

async function writeIndex(check) {
  const categories = await loadJson(categoriesPath);
  const folders = await templateFolders();
  const templates = [];
  for (const folder of folders) {
    const manifest = await loadJson(path.join(folder, 'template.json'));
    templates.push({
      id: manifest.id,
      name: manifest.name,
      description: manifest.description ?? {},
      categories: manifest.categories,
      tags: manifest.tags,
      colorFlexible: manifest.colorFlexible,
      formats: manifest.formats,
      modes: manifest.colorFlexible ? ['dark', 'light'] : Object.keys(manifest.theme.modes ?? {}).sort(),
      languages: ['ar', 'en'],
      preview: `starters/${manifest.id}/preview.webp`,
    });
  }
  const output = `${JSON.stringify({ schema: 1, categories: categories.map(({ id }) => id), templates }, null, 2)}\n`;
  if (check) {
    const current = await readFile(indexPath, 'utf8').catch(() => '');
    if (current !== output) throw new Error('Generated template index is stale. Run npm run template:index.');
    console.log(`Template index current (${templates.length} templates).`);
  } else {
    await mkdir(path.dirname(indexPath), { recursive: true });
    await writeFile(indexPath, output);
    console.log(`Wrote ${path.relative(root, indexPath)} (${templates.length} templates).`);
  }
}

async function scaffold(id) {
  if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('Usage: npm run template:new -- <lowercase-slug>');
  const folder = path.join(startersDir, id);
  try {
    await stat(folder);
    throw new Error(`Template already exists: ${id}`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  const category = (await loadJson(categoriesPath))[0].id;
  const source = {
    schema: 1,
    id,
    name: { en: id.split('-').map((part) => part[0].toUpperCase() + part.slice(1)).join(' '), ar: 'قالب جديد' },
    description: { en: 'A new SlideThread template.', ar: 'قالب جديد لشرائح.' },
    author: { name: 'Template contributor' },
    license: 'MIT',
    categories: [category],
    tags: ['starter'],
    colorFlexible: true,
    theme: { modes: {}, fonts: { display: 'ibm-plex-sans', body: 'ibm-plex-sans' } },
    layouts: {},
    formats: 'all',
  };
  await mkdir(folder, { recursive: true });
  await writeFile(path.join(folder, 'template.json'), `${JSON.stringify(source, null, 2)}\n`);
  console.log(`Created ${path.relative(root, folder)}. Add a preview with npm run template:preview -- ${id}.`);
}

async function dev(id) {
  if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) throw new Error('Usage: npm run template:dev -- <template-id>');
  const manifestPath = path.join(startersDir, id, 'template.json');
  await stat(manifestPath);
  const vite = await createServer({
    configFile: path.join(root, 'vite.config.ts'),
    server: { host: '127.0.0.1', port: 5173 },
  });
  await vite.listen();
  vite.printUrls();
  console.log(`Open ${vite.resolvedUrls?.local[0]}template-dev?id=${encodeURIComponent(id)} (hot reload enabled).`);
  await new Promise((resolve) => vite.httpServer?.once('close', resolve));
}

async function main() {
  const [command, ...args] = process.argv.slice(2);
  const { positional, flags } = parseArgs(args);
  if (command === 'new') return scaffold(positional[0]);
  if (command === 'dev') return dev(positional[0]);
  if (command === 'index') return writeIndex(flags.has('--check'));
  if (command === 'validate') {
    const manifests = await validateAll();
    await renderStressMatrix(manifests);
    return;
  }
  if (command === 'preview') {
    const all = await validateAll({ requirePreviews: flags.has('--check') });
    const selected = positional.length ? all.filter((template) => positional.includes(template.id)) : all;
    if (selected.length !== positional.length && positional.length > 0) throw new Error('Unknown template id in preview arguments');
    await previewAll(selected, flags.has('--check'));
    return;
  }
  throw new Error('Commands: new, dev, validate, preview, index');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
